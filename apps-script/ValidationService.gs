/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: ValidationService.gs
 * Validasi Skema Data, Masukan Pengguna, dan Konsistensi Nilai
 */

/**
 * Validasi data siswa sebelum disimpan
 */
function validateStudentInput(data) {
  if (!data) throw new Error('Data siswa tidak boleh kosong');

  if (!data.Nama_Lengkap || String(data.Nama_Lengkap).trim().length === 0) {
    throw new Error('Nama lengkap siswa wajib diisi');
  }

  const validClasses = ['1', '2', '3', '4', '5', '6'];
  if (!data.Kelas || !validClasses.includes(String(data.Kelas).trim())) {
    throw new Error('Kelas harus berupa angka 1 sampai 6');
  }

  const validGenders = ['Laki-laki', 'Perempuan', 'L', 'P'];
  if (data.Jenis_Kelamin && !validGenders.includes(String(data.Jenis_Kelamin).trim())) {
    throw new Error('Jenis kelamin harus Laki-laki atau Perempuan');
  }

  const validStatuses = ['Aktif', 'Pindah', 'Lulus', 'Nonaktif'];
  if (data.Status_Siswa && !validStatuses.includes(String(data.Status_Siswa).trim())) {
    throw new Error('Status siswa harus Aktif, Pindah, Lulus, atau Nonaktif');
  }

  return true;
}

/**
 * Validasi status absensi
 */
function validateAttendanceStatus(status) {
  const allowed = ['Hadir', 'Sakit', 'Izin', 'Alpa'];
  if (!allowed.includes(String(status).trim())) {
    throw new Error(`Status absensi '${status}' tidak valid. Harus: Hadir, Sakit, Izin, atau Alpa`);
  }
  return true;
}

/**
 * Validasi skor nilai (0-100)
 */
function validateScore(score) {
  if (score === '' || score === null || score === undefined) {
    return true; // Boleh kosong (belum dinilai)
  }
  const num = Number(score);
  if (isNaN(num) || num < 0 || num > 100) {
    throw new Error(`Nilai harus berupa angka antara 0 hingga 100. Diberikan: ${score}`);
  }
  return true;
}
