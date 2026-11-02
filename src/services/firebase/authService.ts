import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { UserProfile, UserRole } from '../../types';
import { callAppsScript } from '../apps-script/appsScriptApi';

// Daftar Akun Nyata Awal SDN KESILIR 02 (Dapat ditambah & diedit di Google Sheet 'Pengguna')
export const INITIAL_REAL_USERS: Record<string, UserProfile & { password?: string }> = {
  'admin@sdnkesilir02.sch.id': {
    uid: 'usr_admin_kesilir',
    name: 'Administrator SDN Kesilir 02',
    email: 'admin@sdnkesilir02.sch.id',
    password: 'admin123',
    role: 'admin',
    assignedClasses: ['1', '2', '3', '4', '5', '6'],
    nip: '19800101 200501 1 001',
    active: true,
  },
  'suci@sdnkesilir02.sch.id': {
    uid: 'usr_guru1_suci',
    name: 'Suci Ayu Ningrum, S.Pd',
    email: 'suci@sdnkesilir02.sch.id',
    password: 'guru123',
    role: 'guru',
    assignedClasses: ['1'],
    nip: '199410142023212000',
    active: true,
  },
  'guru1@sdnkesilir02.sch.id': {
    uid: 'usr_guru1_suci_alias',
    name: 'Suci Ayu Ningrum, S.Pd (Wali Kelas 1)',
    email: 'guru1@sdnkesilir02.sch.id',
    password: 'guru123',
    role: 'guru',
    assignedClasses: ['1'],
    nip: '199410142023212000',
    active: true,
  },
  'abdullah@sdnkesilir02.sch.id': {
    uid: 'usr_kepsek_abdullah',
    name: 'Abdullah Mahsar, S.Pd',
    email: 'abdullah@sdnkesilir02.sch.id',
    password: 'kepsek123',
    role: 'kepsek',
    assignedClasses: ['1', '2', '3', '4', '5', '6'],
    nip: '198306012014121000',
    active: true,
  },
  'kepsek@sdnkesilir02.sch.id': {
    uid: 'usr_kepsek_alias',
    name: 'Abdullah Mahsar, S.Pd (Kepala Sekolah)',
    email: 'kepsek@sdnkesilir02.sch.id',
    password: 'kepsek123',
    role: 'kepsek',
    assignedClasses: ['1', '2', '3', '4', '5', '6'],
    nip: '198306012014121000',
    active: true,
  },
};

export const MOCK_USERS = INITIAL_REAL_USERS;

/**
 * Mendapatkan daftar seluruh akun (tersinkronisasi dengan Google Sheets & Local Cache)
 */
export function getAllUserProfiles(): Record<string, UserProfile & { password?: string }> {
  const cached = localStorage.getItem('school_users_kesilir');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback
    }
  }
  localStorage.setItem('school_users_kesilir', JSON.stringify(INITIAL_REAL_USERS));
  return INITIAL_REAL_USERS;
}

/**
 * Menyimpan profil pengguna ke database & cache lokal
 */
export function saveUserProfileToCache(user: UserProfile & { password?: string }): void {
  const users = getAllUserProfiles();
  users[user.email.toLowerCase()] = user;
  localStorage.setItem('school_users_kesilir', JSON.stringify(users));
}

/**
 * Mendapatkan profil pengguna dari Firestore / Sheets
 */
export async function fetchUserProfile(uid: string, email: string): Promise<UserProfile | null> {
  const all = getAllUserProfiles();
  const found = all[email.toLowerCase()];
  if (found) return found;

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('Fetch user profile Firestore error:', e);
    }
  }
  return null;
}

/**
 * Login langsung dengan Email / Nama Pengguna dan Password
 * Memeriksa Google Sheets (via Apps Script), Firebase Authentication, dan basis data akun sekolah
 */
export async function loginUser(emailOrUsername: string, pass: string): Promise<UserProfile> {
  const cleanKey = emailOrUsername.trim().toLowerCase();

  // 1. Coba verifikasi langsung ke Google Sheets melalui Google Apps Script jika terhubung
  try {
    const gasRes = await callAppsScript<{ user: UserProfile }>('authenticateUser', {
      email: cleanKey,
      password: pass,
    });
    if (gasRes.success && gasRes.data?.user) {
      const u = gasRes.data.user;
      localStorage.setItem('auth_current_user', JSON.stringify(u));
      saveUserProfileToCache(u);
      return u;
    }
  } catch (gasErr) {
    // Apps script offline atau belum deploy, lanjutkan ke auth lokal/Firebase
  }

  // 2. Coba Firebase Auth jika Firebase aktif
  if (isFirebaseConfigured && auth) {
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanKey, pass);
      const profile = await fetchUserProfile(cred.user.uid, cleanKey);
      if (profile) {
        if (!profile.active) throw new Error('Akun Anda dinonaktifkan oleh Administrator.');
        localStorage.setItem('auth_current_user', JSON.stringify(profile));
        return profile;
      }
    } catch (fbErr: any) {
      // Jika kredensial firebase gagal, cek akun lokal
    }
  }

  // 3. Verifikasi Akun Pengguna Nyata (Tersinkron dengan Google Sheets Sheet Pengguna)
  const users = getAllUserProfiles();

  // Cari berdasarkan email persis atau username (sebelum @)
  const matchedUser = Object.values(users).find(u => {
    const uEmail = u.email.toLowerCase();
    const uPrefix = uEmail.split('@')[0];
    return uEmail === cleanKey || uPrefix === cleanKey;
  });

  if (matchedUser) {
    if (!matchedUser.active) {
      throw new Error('Akun Anda telah dinonaktifkan oleh Administrator.');
    }
    // Verifikasi kata sandi
    if (matchedUser.password && matchedUser.password !== pass) {
      throw new Error('Kata sandi yang Anda masukkan salah.');
    }

    localStorage.setItem('auth_current_user', JSON.stringify(matchedUser));
    return matchedUser;
  }

  throw new Error('Email atau kata sandi tidak cocok. Pastikan akun sudah didaftarkan di Google Sheets atau oleh Administrator.');
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  localStorage.removeItem('auth_current_user');
  if (isFirebaseConfigured && auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // Ignored
    }
  }
}

/**
 * Reset Password
 */
export async function requestPasswordReset(email: string): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await sendPasswordResetEmail(auth, email);
    return;
  }
  await new Promise(r => setTimeout(r, 600));
}
