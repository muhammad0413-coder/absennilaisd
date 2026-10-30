/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: LogService.gs
 * Pencatatan Riwayat Sinkronisasi, Log Aktivitas Audit, dan Manajemen Profil Guru
 */

/**
 * Mencatat log sinkronisasi
 */
function writeSyncLog(dataType, direction, total, success, failed, status, message) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.SYNC_LOGS);
    if (!sheet) return;

    const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    const logId = 'LOG-' + Utilities.getUuid().substring(0, 8);

    sheet.appendRow([
      logId,
      now,
      dataType,
      direction,
      total,
      success,
      failed,
      status,
      message,
    ]);
  } catch (err) {
    Logger.log('Gagal menulis Sync Log: ' + err.message);
  }
}

/**
 * Mencatat aktivitas pengguna untuk audit trail
 */
function writeActivityLog(user, activity, dataType, dataId, details) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVITY_LOGS);
    if (!sheet) return;

    const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    const actId = 'ACT-' + Utilities.getUuid().substring(0, 8);
    const userId = user ? (user.uid || user.email) : 'SISTEM';
    const userName = user ? (user.name || user.email) : 'Sistem';

    sheet.appendRow([
      actId,
      now,
      userId,
      userName,
      activity,
      dataType,
      dataId,
      details,
    ]);
  } catch (err) {
    Logger.log('Gagal menulis Activity Log: ' + err.message);
  }
}

/**
 * Mengambil profil guru berdasarkan Email
 */
function getUserProfileByEmail(email) {
  if (!email) return null;
  const users = readSheetData(CONFIG.SHEETS.USERS);
  const target = users.find(u => String(u.Email).toLowerCase() === String(email).toLowerCase());
  if (target) {
    return {
      uid: target.User_ID,
      nama: target.Nama,
      email: target.Email,
      role: target.Role,
      kelasDitugaskan: target.Kelas_Ditugaskan,
      status: target.Status,
    };
  }
  return null;
}

/**
 * Memperbarui profil guru (hanya milik sendiri)
 */
function updateTeacherProfileService(payload, user) {
  if (!user) throw new Error('Pengguna tidak terautentikasi');

  const teachers = readSheetData(CONFIG.SHEETS.TEACHERS);
  const current = teachers.find(t => t.Email === user.email || t.User_ID === user.uid);

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const teacherId = current ? current.User_ID : (user.uid || Utilities.getUuid().substring(0, 8));

  const updatedTeacher = {
    User_ID: teacherId,
    Nama_Guru: payload.Nama_Guru || (current ? current.Nama_Guru : user.name),
    Email: user.email,
    NIP: payload.NIP || (current ? current.NIP : ''),
    Foto_URL: payload.Foto_URL || (current ? current.Foto_URL : ''),
    Kelas_Ditugaskan: current ? current.Kelas_Ditugaskan : (user.assignedClasses ? user.assignedClasses.join(',') : ''),
    Role: current ? current.Role : (user.role || ROLES.TEACHER),
    Status: current ? current.Status : 'Aktif',
    Created_At: current ? current.Created_At : now,
    Updated_At: now,
  };

  upsertRow(CONFIG.SHEETS.TEACHERS, 'User_ID', teacherId, updatedTeacher);

  // Perbarui juga di Sheet Pengguna
  const userRow = {
    User_ID: teacherId,
    Nama: updatedTeacher.Nama_Guru,
    Email: user.email,
    Role: updatedTeacher.Role,
    Kelas_Ditugaskan: updatedTeacher.Kelas_Ditugaskan,
    Status: updatedTeacher.Status,
    Updated_At: now,
  };
  upsertRow(CONFIG.SHEETS.USERS, 'User_ID', teacherId, userRow);

  return { success: true, teacher: updatedTeacher };
}

/**
 * Mengambil daftar seluruh pengguna (Admin Only)
 */
function getUsersService(user) {
  if (user.role !== ROLES.ADMIN) {
    throw new Error('Hanya administrator yang diizinkan mengakses data seluruh pengguna');
  }
  return readSheetData(CONFIG.SHEETS.USERS);
}

/**
 * Menyimpan pengguna baru atau update (Admin Only)
 */
function saveUserService(payload, user) {
  if (user.role !== ROLES.ADMIN) {
    throw new Error('Hanya administrator yang diizinkan mengelola akun pengguna');
  }

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const userId = payload.User_ID || Utilities.getUuid().substring(0, 8);

  const row = {
    User_ID: userId,
    Nama: payload.Nama,
    Email: payload.Email,
    Role: payload.Role,
    Kelas_Ditugaskan: payload.Kelas_Ditugaskan || '',
    Status: payload.Status || 'Aktif',
    Updated_At: now,
  };

  upsertRow(CONFIG.SHEETS.USERS, 'User_ID', userId, row);
  writeActivityLog(user, 'SIMPAN_USER', 'Pengguna', userId, `Menyimpan akun pengguna: ${payload.Email} (Role: ${payload.Role})`);

  return { success: true, user: row };
}
