/**
 * Mendapatkan tahun ajaran otomatis berdasarkan bulan saat ini
 * Tahun ajaran Indonesia: Juli (07) s.d. Juni (06)
 */
export function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  if (month >= 7) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
}

/**
 * Mendapatkan semester aktif (1: Juli-Desember, 2: Januari-Juni)
 */
export function getCurrentSemester(): '1' | '2' {
  const month = new Date().getMonth() + 1;
  return (month >= 7 && month <= 12) ? '1' : '2';
}

/**
 * Mendapatkan tanggal hari ini dalam format YYYY-MM-DD (WIB)
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
