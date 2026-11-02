/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: Authentication.gs
 * Keamanan, Verifikasi Token Firebase, dan Role-Based Access Control (RBAC)
 */

const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'guru',
  PRINCIPAL: 'kepsek',
};

/**
 * Memvalidasi kredensial request (Token Firebase atau API Secret Key)
 * @param {Object} headers Request headers atau payload
 * @return {Object} { isValid: boolean, user: Object|null, error: string|null }
 */
function authenticateRequest(authHeader, apiSecretHeader) {
  // 1. Cek bypass dengan API Secret Key (Digunakan untuk sinkronisasi server-to-server)
  const configuredSecret = getProperty(CONFIG.PROPERTIES.API_SECRET_KEY);
  if (configuredSecret && apiSecretHeader && apiSecretHeader === configuredSecret) {
    return {
      isValid: true,
      authType: 'API_SECRET',
      user: {
        uid: 'SYSTEM_SYNC_ADMIN',
        email: 'system@sekolah.sch.id',
        role: ROLES.ADMIN,
        name: 'System Sync Service',
      },
    };
  }

  // 2. Cek Firebase ID Token jika diberikan
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.substring(7);
    const verification = verifyFirebaseIdToken(idToken);
    if (verification.isValid) {
      // Ambil detail role pengguna dari database lokal/Spreadsheet untuk mencegah spoofing role
      const userProfile = getUserProfileByEmail(verification.user.email);
      if (userProfile && userProfile.status === 'Aktif') {
        return {
          isValid: true,
          authType: 'FIREBASE_TOKEN',
          user: {
            uid: verification.user.localId || verification.user.uid,
            email: verification.user.email,
            name: userProfile.nama || verification.user.displayName,
            role: userProfile.role || ROLES.TEACHER,
            assignedClasses: userProfile.kelasDitugaskan ? String(userProfile.kelasDitugaskan).split(',').map(s => s.trim()) : [],
          },
        };
      } else if (!userProfile) {
        // Fallback jika user belum ada di sheet tetapi token valid dari Firebase Auth
        return {
          isValid: true,
          authType: 'FIREBASE_TOKEN_NEW',
          user: {
            uid: verification.user.localId || verification.user.uid,
            email: verification.user.email,
            name: verification.user.displayName || 'Pengguna',
            role: ROLES.TEACHER,
            assignedClasses: [],
          },
        };
      } else {
        return { isValid: false, error: 'Akun dinonaktifkan oleh administrator.' };
      }
    } else {
      return { isValid: false, error: 'Token autentikasi tidak valid atau sudah kedaluwarsa: ' + verification.error };
    }
  }

  return { isValid: false, error: 'Autentikasi gagal: Token Bearer atau API Secret tidak ditemukan.' };
}

/**
 * Memverifikasi Firebase ID Token melalui Google Identity Toolkit REST API
 */
function verifyFirebaseIdToken(idToken) {
  const firebaseApiKey = getProperty(CONFIG.PROPERTIES.FIREBASE_API_KEY);
  if (!firebaseApiKey) {
    // Mode dev/toleran jika belum diisi API key
    return { isValid: true, user: { email: 'admin@sekolah.sch.id', uid: 'admin_dev' } };
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`;
  const payload = { idToken: idToken };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const responseCode = response.getResponseCode();
    const result = JSON.parse(response.getContentText());

    if (responseCode === 200 && result.users && result.users.length > 0) {
      return { isValid: true, user: result.users[0] };
    } else {
      const errorMsg = result.error ? result.error.message : 'Unknown verification error';
      return { isValid: false, error: errorMsg };
    }
  } catch (err) {
    return { isValid: false, error: err.toString() };
  }
}

/**
 * Memastikan pengguna memiliki izin untuk memodifikasi kelas tertentu
 */
function authorizeClassAccess(user, targetClass) {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true; // Admin punya hak akses ke semua kelas 1-6
  if (user.role === ROLES.TEACHER) {
    if (!targetClass) return false;
    const target = String(targetClass).trim();
    return user.assignedClasses && user.assignedClasses.includes(target);
  }
  return false;
}

/**
 * Melakukan autentikasi langsung menggunakan Email/Username dan Password dari Google Sheets
 * Memungkinkan Guru dan Pengguna baru dibuat atau diubah langsung di Google Sheet 'Pengguna'
 */
function authenticateUserService(payload) {
  if (!payload) throw new Error('Data login tidak boleh kosong');
  const loginKey = String(payload.email || payload.username || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();

  if (!loginKey) throw new Error('Email atau nama pengguna wajib diisi');
  if (!password) throw new Error('Kata sandi wajib diisi');

  const ss = getSpreadsheet();
  let userSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (!userSheet || userSheet.getLastRow() <= 1) {
    initializeDatabase();
  }

  const users = readSheetData(CONFIG.SHEETS.USERS);
  const matched = users.find(u => {
    const email = String(u.Email || '').trim().toLowerCase();
    const uid = String(u.User_ID || '').trim().toLowerCase();
    const prefix = email.split('@')[0];
    return email === loginKey || uid === loginKey || prefix === loginKey;
  });

  if (!matched) {
    throw new Error('Akun tidak ditemukan. Pastikan akun sudah didaftarkan pada sheet Pengguna di Google Sheets.');
  }

  if (String(matched.Status || '').toLowerCase() === 'nonaktif') {
    throw new Error('Akun Anda dinonaktifkan oleh Administrator.');
  }

  const storedPass = String(matched.Password || '').trim();
  if (storedPass && storedPass !== password) {
    throw new Error('Kata sandi yang Anda masukkan salah. Periksa kolom Password pada sheet Pengguna di Google Sheets.');
  }

  const assignedClasses = matched.Kelas_Ditugaskan
    ? String(matched.Kelas_Ditugaskan).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const userProfile = {
    uid: matched.User_ID,
    name: matched.Nama,
    email: matched.Email,
    role: matched.Role || ROLES.TEACHER,
    assignedClasses: assignedClasses,
    active: true,
  };

  writeActivityLog(userProfile, 'LOGIN', 'Pengguna', matched.User_ID, 'Login berhasil melalui web');

  return { user: userProfile };
}
