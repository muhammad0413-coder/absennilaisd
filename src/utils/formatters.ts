export * from './dateUtils';

/**
 * Format tanggal dalam Bahasa Indonesia (contoh: 30 Oktober 2026)
 */
export function formatDateIndo(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

/**
 * Format tanggal dan waktu dalam Bahasa Indonesia
 */
export function formatDateTimeIndo(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

/**
 * Menghitung predikat nilai (A, B, C, D) berdasarkan skala 0-100
 */
export function getGradePredicate(score: number | null): { predicate: string; label: string } {
  if (score === null || score === undefined || isNaN(score)) {
    return { predicate: '-', label: 'Belum Dinilai' };
  }
  if (score >= 88) return { predicate: 'A', label: 'Sangat Baik' };
  if (score >= 74) return { predicate: 'B', label: 'Baik' };
  if (score >= 60) return { predicate: 'C', label: 'Cukup' };
  return { predicate: 'D', label: 'Perlu Bimbingan' };
}

/**
 * Format persentase
 */
export function formatPercentage(val: number): string {
  if (isNaN(val)) return '0%';
  return `${val.toFixed(1)}%`;
}
