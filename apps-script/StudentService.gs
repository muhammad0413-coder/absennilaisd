/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: StudentService.gs
 * Manajemen Data Siswa (CRUD, Validasi, dan Otorisasi Kelas)
 */

/**
 * Mendapatkan daftar siswa
 * @param {Object} filters { class, status, schoolYear }
 * @param {Object} user User yang sedang login
 */
function getStudentsService(filters, user) {
  const allStudents = readSheetData(CONFIG.SHEETS.STUDENTS);

  return allStudents.filter(s => {
    // 1. Otorisasi Peran: Guru hanya dapat melihat kelas binaannya
    if (user && user.role === ROLES.TEACHER) {
      if (!user.assignedClasses || !user.assignedClasses.includes(String(s.Kelas).trim())) {
        return false;
      }
    }

    // 2. Filter opsional
    if (filters) {
      if (filters.class && String(s.Kelas).trim() !== String(filters.class).trim()) return false;
      if (filters.status && String(s.Status_Siswa).toLowerCase() !== String(filters.status).toLowerCase()) return false;
      if (filters.schoolYear && String(s.Tahun_Pelajaran) !== String(filters.schoolYear)) return false;
    }

    return true;
  });
}

/**
 * Menambah siswa baru
 */
function addStudentService(payload, user) {
  // Validasi otorisasi
  if (!authorizeClassAccess(user, payload.Kelas)) {
    throw new Error('Anda tidak memiliki izin menambah siswa di kelas ' + payload.Kelas);
  }

  // Validasi field wajib
  validateStudentInput(payload);

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const studentId = payload.ID_Siswa || ('SD-' + payload.Kelas + '-' + (payload.NIS || Utilities.getUuid().substring(0, 8)));

  // Cek duplikasi NIS / ID
  const existing = readSheetData(CONFIG.SHEETS.STUDENTS);
  const isDuplicate = existing.some(s => s.ID_Siswa === studentId || (payload.NIS && s.NIS === payload.NIS));
  if (isDuplicate) {
    throw new Error('Siswa dengan ID atau NIS tersebut sudah terdaftar!');
  }

  const row = {
    ID_Siswa: studentId,
    NIS: payload.NIS || '',
    NISN: payload.NISN || '',
    Nama_Lengkap: payload.Nama_Lengkap,
    Jenis_Kelamin: payload.Jenis_Kelamin,
    Tempat_Lahir: payload.Tempat_Lahir || '',
    Tanggal_Lahir: payload.Tanggal_Lahir || '',
    Nama_Orang_Tua: payload.Nama_Orang_Tua || '',
    Alamat: payload.Alamat || '',
    Kelas: String(payload.Kelas),
    Tahun_Pelajaran: payload.Tahun_Pelajaran || '2026/2027',
    Status_Siswa: payload.Status_Siswa || 'Aktif',
    Foto_URL: payload.Foto_URL || '',
    Created_At: now,
    Updated_At: now,
    Updated_By: user ? (user.name || user.email) : 'Sistem',
    Sync_Status: 'synced',
  };

  upsertRow(CONFIG.SHEETS.STUDENTS, 'ID_Siswa', studentId, row);
  writeActivityLog(user, 'TAMBAH_SISWA', 'Siswa', studentId, `Menambah siswa: ${payload.Nama_Lengkap} di kelas ${payload.Kelas}`);

  return { success: true, studentId: studentId, student: row };
}

/**
 * Memperbarui data siswa
 */
function updateStudentService(payload, user) {
  if (!payload.ID_Siswa) throw new Error('ID_Siswa wajib disertakan');

  const existing = readSheetData(CONFIG.SHEETS.STUDENTS);
  const current = existing.find(s => s.ID_Siswa === payload.ID_Siswa);
  if (!current) throw new Error('Data siswa tidak ditemukan');

  // Pastikan guru memiliki akses ke kelas siswa saat ini maupun kelas tujuan
  if (!authorizeClassAccess(user, current.Kelas) || (payload.Kelas && !authorizeClassAccess(user, payload.Kelas))) {
    throw new Error('Anda tidak memiliki izin mengubah data siswa di kelas ini');
  }

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const updatedRow = {
    ...current,
    ...payload,
    Updated_At: now,
    Updated_By: user ? (user.name || user.email) : 'Sistem',
    Sync_Status: 'synced',
  };

  upsertRow(CONFIG.SHEETS.STUDENTS, 'ID_Siswa', payload.ID_Siswa, updatedRow);
  writeActivityLog(user, 'UPDATE_SISWA', 'Siswa', payload.ID_Siswa, `Mengubah data siswa: ${updatedRow.Nama_Lengkap}`);

  return { success: true, student: updatedRow };
}

/**
 * Menonaktifkan siswa (bukan hapus permanen)
 */
function deactivateStudentService(studentId, status, reason, user) {
  const existing = readSheetData(CONFIG.SHEETS.STUDENTS);
  const current = existing.find(s => s.ID_Siswa === studentId);
  if (!current) throw new Error('Siswa tidak ditemukan');

  if (!authorizeClassAccess(user, current.Kelas)) {
    throw new Error('Anda tidak memiliki izin menonaktifkan siswa di kelas ' + current.Kelas);
  }

  const newStatus = status || 'Nonaktif';
  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  current.Status_Siswa = newStatus;
  current.Updated_At = now;
  current.Updated_By = user ? (user.name || user.email) : 'Sistem';

  upsertRow(CONFIG.SHEETS.STUDENTS, 'ID_Siswa', studentId, current);
  writeActivityLog(user, 'STATUS_SISWA', 'Siswa', studentId, `Mengubah status siswa menjadi ${newStatus}. Alasan: ${reason || '-'}`);

  return { success: true, message: `Status siswa berhasil diubah menjadi ${newStatus}` };
}
