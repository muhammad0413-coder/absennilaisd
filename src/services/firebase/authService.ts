import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { UserProfile, UserRole } from '../../types';

// Default initial user profiles for testing
export const MOCK_USERS: Record<string, UserProfile> = {
  'admin@sekolah.sch.id': {
    uid: 'mock_admin_01',
    name: 'Administrator Utama',
    email: 'admin@sekolah.sch.id',
    role: 'admin',
    assignedClasses: ['1', '2', '3', '4', '5', '6'],
    nip: '19800101 200501 1 001',
    active: true,
  },
  'guru1@sekolah.sch.id': {
    uid: 'mock_guru_01',
    name: 'Siti Aminah, S.Pd. (Guru Kelas 1)',
    email: 'guru1@sekolah.sch.id',
    role: 'guru',
    assignedClasses: ['1'],
    nip: '19850314 200902 2 003',
    active: true,
  },
  'guru2@sekolah.sch.id': {
    uid: 'mock_guru_02',
    name: 'Budi Santoso, S.Pd. (Guru Kelas 2)',
    email: 'guru2@sekolah.sch.id',
    role: 'guru',
    assignedClasses: ['2'],
    nip: '19870820 201101 1 005',
    active: true,
  },
  'guru3@sekolah.sch.id': {
    uid: 'mock_guru_03',
    name: 'Dewi Lestari, S.Pd. (Guru Kelas 3)',
    email: 'guru3@sekolah.sch.id',
    role: 'guru',
    assignedClasses: ['3'],
    nip: '19900215 201403 2 008',
    active: true,
  },
  'guru4@sekolah.sch.id': {
    uid: 'mock_guru_04',
    name: 'Hendra Wijaya, S.Pd. (Guru Kelas 4)',
    email: 'guru4@sekolah.sch.id',
    role: 'guru',
    assignedClasses: ['4'],
    nip: '19860611 201001 1 007',
    active: true,
  },
  'guru5@sekolah.sch.id': {
    uid: 'mock_guru_05',
    name: 'Ratna Sari, S.Pd. (Guru Kelas 5)',
    email: 'guru5@sekolah.sch.id',
    role: 'guru',
    assignedClasses: ['5'],
    nip: '19891104 201502 2 012',
    active: true,
  },
  'guru6@sekolah.sch.id': {
    uid: 'mock_guru_06',
    name: 'Agus Salim, M.Pd. (Guru Kelas 6)',
    email: 'guru6@sekolah.sch.id',
    role: 'guru',
    assignedClasses: ['6'],
    nip: '19820719 200801 1 004',
    active: true,
  },
  'kepsek@sekolah.sch.id': {
    uid: 'mock_kepsek_01',
    name: 'Drs. H. Mulyadi, M.Pd. (Kepala Sekolah)',
    email: 'kepsek@sekolah.sch.id',
    role: 'kepsek',
    assignedClasses: ['1', '2', '3', '4', '5', '6'],
    nip: '19680512 199303 1 004',
    active: true,
  },
};

/**
 * Mendapatkan profil pengguna dari Firestore
 */
export async function fetchUserProfile(uid: string, email: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured || !db) {
    const cachedUsers = localStorage.getItem('school_users');
    const userMap: Record<string, UserProfile> = cachedUsers ? JSON.parse(cachedUsers) : MOCK_USERS;
    return userMap[email.toLowerCase()] || null;
  }

  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    // Jika belum ada di koleksi users, cek apakah ada default profil
    const fallback = MOCK_USERS[email.toLowerCase()];
    if (fallback) {
      await setDoc(docRef, { ...fallback, uid });
      return { ...fallback, uid };
    }
    return null;
  } catch (error) {
    console.error('Gagal mengambil profil pengguna dari Firestore:', error);
    return MOCK_USERS[email.toLowerCase()] || null;
  }
}

/**
 * Login dengan Email dan Password
 */
export async function loginUser(email: string, pass: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();

  // Mode live Firebase
  if (isFirebaseConfigured && auth) {
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const profile = await fetchUserProfile(cred.user.uid, cleanEmail);
      if (!profile) {
        throw new Error('Akun pengguna tidak memiliki data profil di sistem.');
      }
      if (!profile.active) {
        throw new Error('Akun Anda telah dinonaktifkan oleh Administrator.');
      }
      return profile;
    } catch (err: any) {
      // Jika kredensial firebase gagal, dan ada di daftar mock demo
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        const mock = MOCK_USERS[cleanEmail];
        if (mock && pass.length >= 6) {
          return mock;
        }
      }
      throw err;
    }
  }

  // Fallback demo/preview mode
  const mock = MOCK_USERS[cleanEmail];
  if (mock) {
    if (!mock.active) {
      throw new Error('Akun Anda dinonaktifkan oleh Administrator.');
    }
    localStorage.setItem('auth_current_user', JSON.stringify(mock));
    return mock;
  }

  throw new Error('Kombinasi email atau kata sandi tidak ditemukan.');
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  localStorage.removeItem('auth_current_user');
  if (isFirebaseConfigured && auth) {
    await firebaseSignOut(auth);
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
  // Fallback info
  await new Promise(r => setTimeout(r, 600));
}
