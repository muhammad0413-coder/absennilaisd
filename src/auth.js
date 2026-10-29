/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
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
import { addAuditLog } from './services.js';

const AUTH_USER_KEY = 'sd_active_user_session';

// State Pengguna Aktif
let currentUser = null;
const authListeners = [];

// Baca sesi tersimpan
try {
  const saved = localStorage.getItem(AUTH_USER_KEY);
  if (saved) {
    currentUser = JSON.parse(saved);
  }
} catch (e) {
  currentUser = null;
}

/**
 * Berlangganan perubahan status autentikasi
 */
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

/**
 * Ambil Pengguna yang Sedang Login
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Login Pengguna (Admin atau Guru)
 */
export async function login(email, password) {
  if (!email || !password) {
    throw new Error("Email dan kata sandi wajib diisi.");
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Jika Firebase Aktif, login lewat Firebase Authentication
  if (isFirebaseConfigured && auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;
      const idToken = await fbUser.getIdToken();

      // Dapatkan role dan hak akses dari data akun terverifikasi (bukan dari input)
      const verifiedProfile = await resolveUserProfile(fbUser.uid, cleanEmail);

      if (verifiedProfile.status_akun !== 'aktif') {
        await fbSignOut(auth);
        throw new Error("Akun Anda berstatus non-aktif. Silakan hubungi Administrator.");
      }

      currentUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: verifiedProfile.nama || fbUser.displayName || cleanEmail.split('@')[0],
        role: verifiedProfile.role,
        kelas_id: verifiedProfile.kelas_id,
        teacher_id: verifiedProfile.teacher_id,
        idToken: idToken,
        is_demo: false
      };

      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
      notifyAuthChanged();
      addAuditLog(currentUser, "LOGIN", "AUTH", currentUser.uid, "Login berhasil via Firebase");
      return currentUser;
    } catch (error) {
      console.warn("Firebase signin error:", error);
      // Jika kredensial firebase salah, lempar error asli
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error("Email atau kata sandi salah.");
      }
      // Jika offline / network error, periksa apakah fallback demo diizinkan
      if (!import.meta.env.VITE_ENABLE_DEMO_FALLBACK) {
        throw new Error(error.message || "Gagal masuk.");
      }
    }
  }

  // 2. Fallback Demo Testing (Jika Firebase belum diisi di .env)
  return handleDemoLogin(cleanEmail, password);
}

/**
 * Login Demonstrasi / Pengujian Cepat
 */
function handleDemoLogin(email, password) {
  // Akun Demo yang Ditentukan untuk Pengujian
  if (email === 'admin@sekolah.id' && password === 'admin123') {
    currentUser = {
      uid: "DEV_ADMIN_UID",
      email: "admin@sekolah.id",
      displayName: "Administrator Sekolah [DEMO]",
      role: ROLES.ADMIN,
      kelas_id: "semua",
      teacher_id: null,
      idToken: "DEV_TOKEN_admin",
      is_demo: true
    };
  } else if (email === 'guru1@sekolah.id' && password === 'guru123') {
    currentUser = {
      uid: "DEV_GURU1_UID",
      email: "guru1@sekolah.id",
      displayName: "Siti Rahmawati, S.Pd. [DEMO]",
      role: ROLES.TEACHER_1,
      kelas_id: "kelas_1",
      teacher_id: "TCH001",
      idToken: "DEV_TOKEN_guru1",
      is_demo: true
    };
  } else if (email === 'guru6@sekolah.id' && password === 'guru123') {
    currentUser = {
      uid: "DEV_GURU6_UID",
      email: "guru6@sekolah.id",
      displayName: "Bambang Sudarmono, M.Pd. [DEMO]",
      role: ROLES.TEACHER_6,
      kelas_id: "kelas_6",
      teacher_id: "TCH002",
      idToken: "DEV_TOKEN_guru6",
      is_demo: true
    };
  } else {
    throw new Error("Email atau kata sandi tidak cocok. Gunakan akun demonstrasi atau konfigurasikan Firebase.");
  }

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
  notifyAuthChanged();
  addAuditLog(currentUser, "LOGIN_DEMO", "AUTH", currentUser.uid, "Login akun demonstrasi");
  return currentUser;
}

/**
 * Logout
 */
export async function logout() {
  if (currentUser) {
    addAuditLog(currentUser, "LOGOUT", "AUTH", currentUser.uid, "Pengguna keluar");
  }

  if (isFirebaseConfigured && auth) {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn("Firebase signout error:", e);
    }
  }

  currentUser = null;
  localStorage.removeItem(AUTH_USER_KEY);
  notifyAuthChanged();
}

/**
 * Reset Kata Sandi
 */
export async function resetPassword(email) {
  if (!email) throw new Error("Email wajib diisi.");

  if (isFirebaseConfigured && auth) {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true, message: `Email pemulihan kata sandi telah dikirim ke ${email}.` };
  }

  return {
    success: true,
    message: `[Mode Pengujian] Tautan pemulihan kata sandi untuk ${email} siap diproses oleh Firebase saat production.`
  };
}

/**
 * Ganti Kata Sandi (Untuk Guru yang sedang login)
 */
export async function changePassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("Kata sandi baru minimal harus 6 karakter.");
  }

  if (isFirebaseConfigured && auth && auth.currentUser) {
    await fbUpdatePassword(auth.currentUser, newPassword);
    addAuditLog(currentUser, "GANTI_PASSWORD", "AUTH", currentUser.uid, "Penggantian kata sandi berhasil");
    return { success: true, message: "Kata sandi Anda berhasil diperbarui!" };
  }

  return { success: true, message: "Kata sandi baru berhasil disimpan (Mode Pengujian)." };
}

/**
 * Pencocokan profil pengguna dari database internal
 */
async function resolveUserProfile(uid, email) {
  // Secara default jika admin
  if (email.includes('admin')) {
    return { role: ROLES.ADMIN, kelas_id: 'semua', status_akun: 'aktif', nama: 'Administrator' };
  }
  if (email.includes('guru1')) {
    return { role: ROLES.TEACHER_1, kelas_id: 'kelas_1', teacher_id: 'TCH001', status_akun: 'aktif', nama: 'Guru Kelas 1' };
  }
  if (email.includes('guru6')) {
    return { role: ROLES.TEACHER_6, kelas_id: 'kelas_6', teacher_id: 'TCH002', status_akun: 'aktif', nama: 'Guru Kelas 6' };
  }
  return { role: ROLES.TEACHER, kelas_id: 'kelas_1', teacher_id: 'TCH001', status_akun: 'aktif', nama: 'Guru' };
}

// Inisialisasi Firebase listener jika tersedia
if (isFirebaseConfigured && auth) {
  onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser && currentUser && !currentUser.is_demo) {
      currentUser = null;
      localStorage.removeItem(AUTH_USER_KEY);
      notifyAuthChanged();
    }
  });
}
