/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: AttendanceService.gs
 * Pengelolaan Absensi Harian, Rekapitulasi, dan Sinkronisasi Absensi
 */

const ATTENDANCE_STATUS = {
  PRESENT: 'Hadir',
  SICK: 'Sakit',
  PERMIT: 'Izin',
  ABSENT: 'Alpa',
};

/**
 * Menyimpan data absensi massal atau per siswa
 * @param {Array} records Array of attendance records
 * @param {Object} user User yang sedang login
 */
function receiveAttendanceService(records, user) {
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error('Data absensi kosong');
  }

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  let savedCount = 0;
  let failedCount = 0;
  const errors = [];

  records.forEach((item, index) => {
    try {
      // Validasi izin kelas
      if (!authorizeClassAccess(user, item.Kelas || item.class)) {
        throw new Error(`Tidak memiliki izin untuk kelas ${item.Kelas || item.class}`);
      }

      const classVal = String(item.Kelas || item.class).trim();
      const studentId = String(item.ID_Siswa || item.studentId).trim();
      const dateVal = String(item.Tanggal || item.date).trim();
      const statusVal = item.Status_Absensi || item.status || ATTENDANCE_STATUS.PRESENT;

      // Unique ID: ATT-{Kelas}-{Tanggal}-{ID_Siswa}
      const attendanceId = item.ID_Absensi || item.attendanceId || `ATT-${classVal}-${dateVal}-${studentId}`;

      const row = {
        ID_Absensi: attendanceId,
        Tanggal: dateVal,
        Tahun_Pelajaran: item.Tahun_Pelajaran || item.schoolYear || '2026/2027',
        Semester: String(item.Semester || item.semester || '1'),
        Kelas: classVal,
        ID_Siswa: studentId,
        NIS: item.NIS || item.nis || '',
        NISN: item.NISN || item.nisn || '',
        Nama_Siswa: item.Nama_Siswa || item.studentName || '',
        Status_Absensi: statusVal,
        Keterangan: item.Keterangan || item.notes || '',
        Diinput_Oleh: user ? (user.name || user.email) : (item.Diinput_Oleh || 'Sistem'),
        Updated_At: now,
        Sync_Status: 'synced',
      };

      upsertRow(CONFIG.SHEETS.ATTENDANCE, 'ID_Absensi', attendanceId, row);
      savedCount++;
    } catch (err) {
      failedCount++;
      errors.push(`Baris ${index + 1}: ${err.message}`);
    }
  });

  writeActivityLog(
    user,
    'SIMPAN_ABSENSI',
    'Absensi',
    `Kelas ${records[0].Kelas || records[0].class} - ${records[0].Tanggal || records[0].date}`,
    `Menyimpan absensi: ${savedCount} berhasil, ${failedCount} gagal`
  );

  return {
    success: failedCount === 0,
    savedCount: savedCount,
    failedCount: failedCount,
    errors: errors,
  };
}

/**
 * Menghitung rekapitulasi kehadiran berdasarkan rentang tanggal atau bulan
 */
function getAttendanceReportService(filters, user) {
  const allRecords = readSheetData(CONFIG.SHEETS.ATTENDANCE);
  const allStudents = readSheetData(CONFIG.SHEETS.STUDENTS);

  // Filter kelas berdasarkan hak akses
  const targetClass = filters.class ? String(filters.class).trim() : null;
  if (user && user.role === ROLES.TEACHER) {
    if (!targetClass || !user.assignedClasses.includes(targetClass)) {
      throw new Error('Anda tidak memiliki akses melihat rekap kelas ini');
    }
  }

  // Filter siswa aktif kelas target
  const classStudents = allStudents.filter(s => {
    if (targetClass && String(s.Kelas).trim() !== targetClass) return false;
    return s.Status_Siswa === 'Aktif';
  });

  // Filter catatan absensi
  const filteredRecords = allRecords.filter(r => {
    if (targetClass && String(r.Kelas).trim() !== targetClass) return false;
    if (filters.schoolYear && String(r.Tahun_Pelajaran) !== String(filters.schoolYear)) return false;
    if (filters.semester && String(r.Semester) !== String(filters.semester)) return false;
    if (filters.startDate && r.Tanggal < filters.startDate) return false;
    if (filters.endDate && r.Tanggal > filters.endDate) return false;
    if (filters.month) {
      // format YYYY-MM
      if (!String(r.Tanggal).startsWith(filters.month)) return false;
    }
    return true;
  });

  // Agregasi per siswa
  const studentMap = {};
  classStudents.forEach(s => {
    studentMap[s.ID_Siswa] = {
      studentId: s.ID_Siswa,
      nis: s.NIS,
      nisn: s.NISN,
      name: s.Nama_Lengkap,
      class: s.Kelas,
      present: 0,
      sick: 0,
      permit: 0,
      absent: 0,
      totalDays: 0,
      attendanceRate: 0,
    };
  });

  filteredRecords.forEach(r => {
    const sId = r.ID_Siswa;
    if (studentMap[sId]) {
      studentMap[sId].totalDays += 1;
      const status = String(r.Status_Absensi).toLowerCase();
      if (status === 'hadir') studentMap[sId].present += 1;
      else if (status === 'sakit') studentMap[sId].sick += 1;
      else if (status === 'izin') studentMap[sId].permit += 1;
      else if (status === 'alpa') studentMap[sId].absent += 1;
    }
  });

  // Hitung persentase kehadiran: (Hadir / Total Hari Tercatat) * 100
  // Hari tanpa data tidak dianggap alpa
  const report = Object.values(studentMap).map(item => {
    const rate = item.totalDays > 0 ? Math.round((item.present / item.totalDays) * 1000) / 10 : 0;
    item.attendanceRate = rate;
    return item;
  });

  return {
    class: targetClass,
    filters: filters,
    totalStudents: classStudents.length,
    studentsReport: report,
  };
}
