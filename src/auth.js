/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * AUTHENTICATION & SESSION MANAGER (src/auth.js)
 * ==============================================================================
 */

import { 
  auth, 
  isFirebaseConfigured, 
  signInWithEmailAndPassword, 
  fbSignOut, 
  sendPasswordResetEmail,
  updatePassword as fbUpdatePassword,
  onAuthStateChanged 
} from './firebase.js';
import { ROLES } from './permissions.js';

const AUTH_USER_KEY = 'sd_active_user_session';

let currentUser = null;
const authListeners = [];

try {
  const saved = localStorage.getItem(AUTH_USER_KEY);
  if (saved) currentUser = JSON.parse(saved);
} catch (e) {
  currentUser = null;
}

export function onAuthChanged(callback) {
  authListeners.push(callback);
  callback(currentUser);
  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
}

function notifyAuthChanged() {
  for (const listener of authListeners) {
    try {
      listener(currentUser);
    } catch (e) {
      console.error("Auth listener error:", e);
    }
  }
}

export function getCurrentUser() {
  return currentUser;
}

/**
 * Login Pengguna (Admin, Guru Kelas 1–6, Kepala Sekolah)
 */
export async function login(email, password) {
  if (!email || !password) {
    throw new Error("Email dan kata sandi wajib diisi.");
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Firebase Authentication jika terkonfigurasi
  if (isFirebaseConfigured && auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;
      const idToken = await fbUser.getIdToken();

      const profile = resolveUserProfile(fbUser.uid, cleanEmail);

      currentUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: profile.nama,
        role: profile.role,
        kelas_id: profile.kelas_id,
        idToken: idToken,
        is_demo: false
      };

      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
      notifyAuthChanged();
      return currentUser;
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error("Email atau kata sandi tidak cocok.");
      }
      if (!import.meta.env.VITE_ENABLE_DEMO_FALLBACK) {
        throw new Error(error.message || "Gagal masuk.");
      }
    }
  }

  // 2. Demo / Fallback Login
  return handleDemoLogin(cleanEmail, password);
}

function handleDemoLogin(email, password) {
  // Akun Demo Pengujian Resmi
  if (email === 'admin@sekolah.id' && password === 'admin123') {
    currentUser = {
      uid: "DEV_ADM_001",
      email: "admin@sekolah.id",
      displayName: "Administrator Sekolah [DEMO]",
      role: ROLES.ADMIN,
      kelas_id: "semua",
      is_demo: true
    };
  } else if (email === 'kepsek@sekolah.id' && password === 'kepsek123') {
    currentUser = {
      uid: "DEV_KS_001",
      email: "kepsek@sekolah.id",
      displayName: "Drs. H. Mulyadi, M.Pd. (Kepala Sekolah) [DEMO]",
      role: ROLES.HEADMASTER,
      kelas_id: "semua",
      is_demo: true
    };
  } else if (email.startsWith('guru') && email.endsWith('@sekolah.id') && password === 'guru123') {
    const classNum = email.replace('guru', '').replace('@sekolah.id', '');
    const validNum = ['1', '2', '3', '4', '5', '6'].includes(classNum) ? classNum : '1';
    
    currentUser = {
      uid: `DEV_GUR_00${validNum}`,
      email: email,
      displayName: `Guru Kelas ${validNum} [DEMO]`,
      role: ROLES.TEACHER,
      kelas_id: `kelas_${validNum}`,
      is_demo: true
    };
  } else {
    throw new Error("Email atau kata sandi tidak cocok. Gunakan akun demonstrasi atau konfigurasikan Firebase.");
  }

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
  notifyAuthChanged();
  return currentUser;
}

export async function logout() {
  if (isFirebaseConfigured && auth) {
    try {
      await fbSignOut(auth);
    } catch (e) {}
  }

  currentUser = null;
  localStorage.removeItem(AUTH_USER_KEY);
  notifyAuthChanged();
}

export async function resetPassword(email) {
  if (!email) throw new Error("Email wajib diisi.");
  if (isFirebaseConfigured && auth) {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true, message: `Email pemulihan kata sandi telah dikirim ke ${email}.` };
  }
  return {
    success: true,
    message: `[Mode Pengujian] Tautan pemulihan kata sandi untuk ${email} siap diproses oleh Firebase saat produksi.`
  };
}

export async function changePassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("Kata sandi baru minimal 6 karakter.");
  }
  if (isFirebaseConfigured && auth && auth.currentUser) {
    await fbUpdatePassword(auth.currentUser, newPassword);
    return { success: true, message: "Kata sandi berhasil diperbarui!" };
  }
  return { success: true, message: "Kata sandi berhasil diubah (Mode Pengujian)." };
}

function resolveUserProfile(uid, email) {
  if (email.includes('admin')) {
    return { role: ROLES.ADMIN, kelas_id: 'semua', nama: 'Administrator' };
  }
  if (email.includes('kepsek')) {
    return { role: ROLES.HEADMASTER, kelas_id: 'semua', nama: 'Kepala Sekolah' };
  }
  for (let c = 1; c <= 6; c++) {
    if (email.includes(`guru${c}`)) {
      return { role: ROLES.TEACHER, kelas_id: `kelas_${c}`, nama: `Guru Kelas ${c}` };
    }
  }
  return { role: ROLES.TEACHER, kelas_id: 'kelas_1', nama: 'Guru Kelas' };
}

if (isFirebaseConfigured && auth) {
  onAuthStateChanged(auth, (fbUser) => {
    if (!fbUser && currentUser && !currentUser.is_demo) {
      currentUser = null;
      localStorage.removeItem(AUTH_USER_KEY);
      notifyAuthChanged();
    }
  });
}
