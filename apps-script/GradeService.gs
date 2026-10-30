/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: GradeService.gs
 * Pengelolaan Input Nilai, Rekap Nilai, dan Rapor Siswa
 */

const ASSESSMENT_TYPES = {
  FORMATIVE: 'Formatif',
  SUMMATIVE_MATERIAL: 'Sumatif Lingkup Materi',
  SUMMATIVE_MID: 'Sumatif Tengah Semester',
  SUMMATIVE_FINAL: 'Sumatif Akhir Semester',
};

/**
 * Menyimpan data nilai massal atau per siswa
 */
function receiveGradesService(records, user) {
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error('Data nilai kosong');
  }

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  let savedCount = 0;
  let failedCount = 0;
  const errors = [];

  records.forEach((item, index) => {
    try {
      const classVal = String(item.Kelas || item.class).trim();
      if (!authorizeClassAccess(user, classVal)) {
        throw new Error(`Tidak memiliki izin untuk kelas ${classVal}`);
      }

      // Validasi skor jika diisi: rentang 0-100. Nilai kosong tidak dianggap nol.
      const rawScore = item.Nilai !== undefined ? item.Nilai : item.score;
      let scoreVal = '';
      if (rawScore !== '' && rawScore !== null && rawScore !== undefined) {
        const num = Number(rawScore);
        if (isNaN(num) || num < 0 || num > 100) {
          throw new Error(`Nilai harus berupa angka antara 0 dan 100. Ditemukan: ${rawScore}`);
        }
        scoreVal = num;
      }

      const studentId = String(item.ID_Siswa || item.studentId).trim();
      const subject = String(item.Mata_Pelajaran || item.subject).trim();
      const assessmentType = String(item.Jenis_Asesmen || item.assessmentType).trim();
      const material = String(item.Lingkup_Materi || item.material || 'Umum').trim();
      const schoolYear = String(item.Tahun_Pelajaran || item.schoolYear || '2026/2027').trim();
      const semester = String(item.Semester || item.semester || '1').trim();

      // Mencegah duplikasi: ID unik berbasis entitas
      // ID: GRD-{Tahun}-{Sem}-{Kelas}-{MataPelajaran}-{JenisAsesmen}-{Materi}-{ID_Siswa}
      const safeSubject = subject.replace(/\s+/g, '_');
      const safeType = assessmentType.replace(/\s+/g, '_');
      const safeMat = material.replace(/\s+/g, '_');
      const gradeId = item.ID_Nilai || item.gradeId || `GRD-${schoolYear.replace('/', '-')}-S${semester}-${classVal}-${safeSubject}-${safeType}-${safeMat}-${studentId}`;

      const row = {
        ID_Nilai: gradeId,
        Tahun_Pelajaran: schoolYear,
        Semester: semester,
        Kelas: classVal,
        ID_Siswa: studentId,
        NIS: item.NIS || item.nis || '',
        NISN: item.NISN || item.nisn || '',
        Nama_Siswa: item.Nama_Siswa || item.studentName || '',
        Mata_Pelajaran: subject,
        Jenis_Asesmen: assessmentType,
        Lingkup_Materi: material,
        Nilai: scoreVal,
        Deskripsi: item.Deskripsi || item.description || '',
        Diinput_Oleh: user ? (user.name || user.email) : (item.Diinput_Oleh || 'Sistem'),
        Updated_At: now,
        Sync_Status: 'synced',
      };

      upsertRow(CONFIG.SHEETS.GRADES, 'ID_Nilai', gradeId, row);
      savedCount++;
    } catch (err) {
      failedCount++;
      errors.push(`Baris ${index + 1}: ${err.message}`);
    }
  });

  writeActivityLog(
    user,
    'SIMPAN_NILAI',
    'Nilai',
    `Kelas ${records[0].Kelas || records[0].class} - ${records[0].Mata_Pelajaran || records[0].subject}`,
    `Menyimpan nilai: ${savedCount} berhasil, ${failedCount} gagal`
  );

  return {
    success: failedCount === 0,
    savedCount: savedCount,
    failedCount: failedCount,
    errors: errors,
  };
}

/**
 * Mendapatkan rekapitulasi nilai untuk analisis rapor
 */
function getGradesReportService(filters, user) {
  const allGrades = readSheetData(CONFIG.SHEETS.GRADES);
  const targetClass = filters.class ? String(filters.class).trim() : null;

  if (user && user.role === ROLES.TEACHER) {
    if (!targetClass || !user.assignedClasses.includes(targetClass)) {
      throw new Error('Anda tidak memiliki izin melihat nilai kelas ini');
    }
  }

  const filtered = allGrades.filter(g => {
    if (targetClass && String(g.Kelas).trim() !== targetClass) return false;
    if (filters.schoolYear && String(g.Tahun_Pelajaran) !== String(filters.schoolYear)) return false;
    if (filters.semester && String(g.Semester) !== String(filters.semester)) return false;
    if (filters.subject && String(g.Mata_Pelajaran).toLowerCase() !== String(filters.subject).toLowerCase()) return false;
    if (filters.assessmentType && String(g.Jenis_Asesmen) !== String(filters.assessmentType)) return false;
    if (filters.studentId && String(g.ID_Siswa) !== String(filters.studentId)) return false;
    return true;
  });

  return {
    class: targetClass,
    filters: filters,
    totalRecords: filtered.length,
    grades: filtered,
  };
}
