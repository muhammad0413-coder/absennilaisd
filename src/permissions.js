/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS LAYER (src/permissions.js)
 * ==============================================================================
 */

export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'guru',
  HEADMASTER: 'kepala_sekolah'
};

export const CLASSES = {
  KELAS_1: 'kelas_1',
  KELAS_2: 'kelas_2',
  KELAS_3: 'kelas_3',
  KELAS_4: 'kelas_4',
  KELAS_5: 'kelas_5',
  KELAS_6: 'kelas_6'
};

export const CLASS_LABELS = {
  'kelas_1': 'Kelas 1',
  'kelas_2': 'Kelas 2',
  'kelas_3': 'Kelas 3',
  'kelas_4': 'Kelas 4',
  'kelas_5': 'Kelas 5',
  'kelas_6': 'Kelas 6'
};

/**
 * Cek apakah pengguna adalah Administrator
 */
export function isAdmin(user) {
  if (!user) return false;
  return user.role === ROLES.ADMIN;
}

/**
 * Cek apakah pengguna adalah Kepala Sekolah
 */
export function isHeadmaster(user) {
  if (!user) return false;
  return user.role === ROLES.HEADMASTER;
}

/**
 * Cek apakah pengguna adalah Guru Kelas
 */
export function isTeacher(user) {
  if (!user) return false;
  return user.role === ROLES.TEACHER;
}

/**
 * Cek apakah pengguna dapat melihat data kelas tertentu
 * - Admin: Seluruh Kelas 1–6
 * - Kepala Sekolah: Seluruh Kelas 1–6 (Monitoring)
 * - Guru Kelas: Hanya kelas yang ditugaskan kepadanya
 */
export function canAccessClass(user, kelasId) {
  if (!user) return false;
  if (isAdmin(user) || isHeadmaster(user)) return true;
  if (isTeacher(user) && user.kelas_id === kelasId) return true;
  return false;
}

/**
 * Cek apakah pengguna dapat mengubah/menginput data absensi
 * (Admin dan Guru kelas yang ditugaskan; Kepala Sekolah hanya membaca)
 */
export function canModifyAttendance(user, kelasId) {
  if (!user) return false;
  if (isHeadmaster(user)) return false; // Kepala sekolah read-only
  if (isAdmin(user)) return true;
  if (isTeacher(user) && user.kelas_id === kelasId) return true;
  return false;
}

/**
 * Cek apakah pengguna dapat mengubah/menginput data nilai
 * (Admin dan Guru kelas yang ditugaskan; Kepala Sekolah hanya membaca)
 */
export function canModifyGrades(user, kelasId) {
  if (!user) return false;
  if (isHeadmaster(user)) return false; // Kepala sekolah read-only
  if (isAdmin(user)) return true;
  if (isTeacher(user) && user.kelas_id === kelasId) return true;
  return false;
}

/**
 * Cek apakah pengguna dapat melihat laporan
 */
export function canViewReports(user, kelasId = null) {
  if (!user) return false;
  if (isAdmin(user) || isHeadmaster(user)) return true;
  if (isTeacher(user)) {
    return !kelasId || user.kelas_id === kelasId;
  }
  return false;
}

/**
 * Pengaturan sistem dan sinkronisasi hanya untuk Admin
 */
export function canManageSettings(user) {
  return isAdmin(user);
}

export function canTriggerSync(user) {
  return isAdmin(user);
}

export function canManageUsers(user) {
  return isAdmin(user);
}

/**
 * Format label badge role pengguna
 */
export function getRoleBadge(user) {
  if (!user) return { label: 'Tamu', class: 'badge-neutral' };

  if (user.role === ROLES.ADMIN) {
    return { label: 'Administrator', class: 'badge-danger' };
  } else if (user.role === ROLES.HEADMASTER) {
    return { label: 'Kepala Sekolah', class: 'badge-warning' };
  } else if (user.role === ROLES.TEACHER) {
    const classLabel = CLASS_LABELS[user.kelas_id] || 'Guru';
    return { label: `Guru ${classLabel}`, class: 'badge-info' };
  }

  return { label: user.role || 'Pengguna', class: 'badge-neutral' };
}
