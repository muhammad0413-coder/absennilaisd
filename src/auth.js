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

/**
 * Login Guru / Staf Langsung Menggunakan Email (Tanpa Password)
 * Sesi tersimpan permanen di perangkat pengguna sampai menekan tombol Logout.
 */
export async function loginWithEmailOnly(email) {
  if (!email || !email.trim()) {
    throw new Error("Silakan masukkan alamat email guru / staf Anda.");
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Cek di daftar akun pengguna terdaftar
  const users = JSON.parse(localStorage.getItem('sd_users_accounts') || '[]');
  const found = users.find(u => (u.Email || '').toLowerCase() === cleanEmail);

  if (found) {
    currentUser = {
      uid: found.User_ID || ("USR_" + Date.now().toString(36)),
      email: found.Email,
      displayName: found.Nama,
      role: found.Role,
      kelas_id: found.Kelas_Ditugaskan || "semua"
    };
  } else if (cleanEmail === 'admin@sekolah.id' || cleanEmail.includes('admin')) {
    currentUser = {
      uid: "USR_ADM_001",
      email: cleanEmail,
      displayName: "Administrator Sekolah",
      role: ROLES.ADMIN,
      kelas_id: "semua"
    };
  } else if (cleanEmail === 'kepsek@sekolah.id' || cleanEmail.includes('kepsek')) {
    currentUser = {
      uid: "USR_KS_001",
      email: cleanEmail,
      displayName: "Drs. H. Mulyadi, M.Pd. (Kepala Sekolah)",
      role: ROLES.HEADMASTER,
      kelas_id: "semua"
    };
  } else if (cleanEmail.startsWith('guru') || cleanEmail.includes('guru')) {
    const match = cleanEmail.match(/\d+/);
    const classNum = match && ['1', '2', '3', '4', '5', '6'].includes(match[0]) ? match[0] : '1';
    currentUser = {
      uid: `USR_GUR_00${classNum}`,
      email: cleanEmail,
      displayName: `Guru Kelas ${classNum}`,
      role: ROLES.TEACHER,
      kelas_id: `kelas_${classNum}`
    };
  } else {
    const prefix = cleanEmail.split('@')[0];
    const nameFormatted = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    currentUser = {
      uid: "USR_" + Date.now().toString(36),
      email: cleanEmail,
      displayName: nameFormatted,
      role: ROLES.TEACHER,
      kelas_id: "semua"
    };
  }

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
  notifyAuthChanged();
  return currentUser;
}

/**
 * Perbarui Profil Guru / Staf Aktif
 * Memungkinkan pengubahan Nama Lengkap, Email Akun, NIP, Nomor HP, dan Penugasan Kelas
 */
export async function updateCurrentUserProfile(updatedData = {}) {
  if (!currentUser) throw new Error("Tidak ada pengguna aktif.");

  const oldEmail = (currentUser.email || '').toLowerCase();
  const newEmail = updatedData.email ? updatedData.email.trim().toLowerCase() : oldEmail;

  currentUser = {
    ...currentUser,
    displayName: updatedData.displayName ? updatedData.displayName.trim() : currentUser.displayName,
    email: newEmail,
    nip: updatedData.nip !== undefined ? updatedData.nip.trim() : (currentUser.nip || ''),
    phone: updatedData.phone !== undefined ? updatedData.phone.trim() : (currentUser.phone || ''),
    kelas_id: updatedData.kelas_id || currentUser.kelas_id
  };

  // 1. Simpan sesi aktif ke localStorage
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));

  // 2. Perbarui juga di daftar master akun pengguna (sd_users_accounts)
  try {
    const users = JSON.parse(localStorage.getItem('sd_users_accounts') || '[]');
    const idx = users.findIndex(u => (u.Email || '').toLowerCase() === oldEmail || u.User_ID === currentUser.uid);
    if (idx >= 0) {
      users[idx] = {
        ...users[idx],
        Nama: currentUser.displayName,
        Email: currentUser.email,
        NIP: currentUser.nip,
        Phone: currentUser.phone,
        Kelas_Ditugaskan: currentUser.kelas_id,
        Updated_At: new Date().toISOString()
      };
    } else {
      users.push({
        User_ID: currentUser.uid,
        Nama: currentUser.displayName,
        Email: currentUser.email,
        NIP: currentUser.nip,
        Phone: currentUser.phone,
        Role: currentUser.role,
        Kelas_Ditugaskan: currentUser.kelas_id,
        Status: "Aktif",
        Updated_At: new Date().toISOString()
      });
    }
    localStorage.setItem('sd_users_accounts', JSON.stringify(users));
  } catch (e) {
    console.warn("Gagal memperbarui sd_users_accounts:", e);
  }

  notifyAuthChanged();
  return currentUser;
}

function handleDemoLogin(email, password) {
  if (email === 'admin@sekolah.id') {
    currentUser = {
      uid: "USR_ADM_001",
      email: "admin@sekolah.id",
      displayName: "Administrator Sekolah",
      role: ROLES.ADMIN,
      kelas_id: "semua"
    };
  } else if (email === 'kepsek@sekolah.id') {
    currentUser = {
      uid: "USR_KS_001",
      email: "kepsek@sekolah.id",
      displayName: "Drs. H. Mulyadi, M.Pd. (Kepala Sekolah)",
      role: ROLES.HEADMASTER,
      kelas_id: "semua"
    };
  } else if (email.startsWith('guru') && email.endsWith('@sekolah.id')) {
    const classNum = email.replace('guru', '').replace('@sekolah.id', '');
    const validNum = ['1', '2', '3', '4', '5', '6'].includes(classNum) ? classNum : '1';
    
    currentUser = {
      uid: `USR_GUR_00${validNum}`,
      email: email,
      displayName: `Guru Kelas ${validNum}`,
      role: ROLES.TEACHER,
      kelas_id: `kelas_${validNum}`
    };
  } else {
    throw new Error("Email tidak terdaftar.");
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
