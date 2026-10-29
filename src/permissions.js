/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS LAYER (src/permissions.js)
 * ==============================================================================
 */

export const ROLES = {
  ADMIN: 'admin',
  TEACHER_1: 'guru_kelas_1',
  TEACHER_6: 'guru_kelas_6',
  TEACHER: 'guru', // Generic teacher fallback
  STUDENT: 'siswa'
};

export const CLASSES = {
  KELAS_1: 'kelas_1',
  KELAS_6: 'kelas_6'
};

/**
 * Cek apakah user adalah Administrator
 */
export function isAdmin(user) {
  if (!user) return false;
  return user.role === ROLES.ADMIN;
}

/**
 * Cek apakah user adalah Guru (Kelas 1 atau Kelas 6)
 */
export function isTeacher(user) {
  if (!user) return false;
  return (
    user.role === ROLES.TEACHER_1 ||
    user.role === ROLES.TEACHER_6 ||
    user.role === ROLES.TEACHER
  );
}

/**
 * Cek apakah user memiliki hak akses ke kelas tertentu
 * - Admin: Berhak akses kelas_1 dan kelas_6
 * - Guru Kelas 1: HANYA kelas_1
 * - Guru Kelas 6: HANYA kelas_6
 */
export function canAccessClass(user, kelasId) {
  if (!user) return false;
  if (isAdmin(user)) return true;

  if (user.role === ROLES.TEACHER_1 && kelasId === CLASSES.KELAS_1) return true;
  if (user.role === ROLES.TEACHER_6 && kelasId === CLASSES.KELAS_6) return true;
  if (user.kelas_id === kelasId) return true;

  return false;
}

/**
 * Validasi otorisasi pengelolaan siswa (tambah / ubah / nonaktifkan)
 */
export function canManageStudents(user, targetKelasId) {
  return canAccessClass(user, targetKelasId);
}

/**
 * Validasi otorisasi pengelolaan absensi
 */
export function canManageAttendance(user, targetKelasId) {
  return canAccessClass(user, targetKelasId);
}

/**
 * Validasi otorisasi pengelolaan nilai
 */
export function canManageGrades(user, targetKelasId) {
  return canAccessClass(user, targetKelasId);
}

/**
 * Validasi otorisasi edit profil guru
 * Guru hanya boleh mengubah profil miliknya sendiri (nomor telepon & foto)
 */
export function canEditTeacherProfile(user, teacherId) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return user.teacher_id === teacherId;
}

/**
 * Validasi otorisasi akses fitur administrasi penuh
 */
export function canAccessAdminFeatures(user) {
  return isAdmin(user);
}

/**
 * Label yang ramah dibaca untuk Role
 */
export function getRoleBadge(role) {
  switch (role) {
    case ROLES.ADMIN:
      return { label: 'Administrator', class: 'badge-danger' };
    case ROLES.TEACHER_1:
      return { label: 'Guru Kelas 1', class: 'badge-info' };
    case ROLES.TEACHER_6:
      return { label: 'Guru Kelas 6', class: 'badge-success' };
    case ROLES.TEACHER:
      return { label: 'Guru Kelas', class: 'badge-info' };
    case ROLES.STUDENT:
      return { label: 'Siswa', class: 'badge-warning' };
    default:
      return { label: 'Tamu / Siswa', class: 'badge-neutral' };
  }
}
