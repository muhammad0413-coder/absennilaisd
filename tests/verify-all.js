/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * AUTOMATED VERIFICATION TEST SUITE (tests/verify-all.js)
 * ==============================================================================
 */

import assert from 'assert';
import { canAccessClass, canManageStudents, canManageGrades, canManageAttendance, canEditTeacherProfile, isAdmin, isTeacher, ROLES, CLASSES } from '../src/permissions.js';

let passedTests = 0;
let totalTests = 0;

function runTest(description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`[PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${description}`);
    console.error(`       Error: ${err.message}`);
  }
}

console.log("==============================================================================");
console.log("MENJALANKAN PENGUJIAN OTORISASI & ATURAN HAK AKSES SISTEM");
console.log("==============================================================================");

// Mock Users
const adminUser = {
  uid: "ADMIN_UID",
  email: "admin@sekolah.id",
  role: ROLES.ADMIN,
  kelas_id: "semua"
};

const guruKelas1User = {
  uid: "GURU1_UID",
  email: "guru1@sekolah.id",
  role: ROLES.TEACHER_1,
  kelas_id: CLASSES.KELAS_1,
  teacher_id: "TCH001"
};

const guruKelas6User = {
  uid: "GURU6_UID",
  email: "guru6@sekolah.id",
  role: ROLES.TEACHER_6,
  kelas_id: CLASSES.KELAS_6,
  teacher_id: "TCH002"
};

const siswaUser = {
  uid: "SISWA_UID",
  email: "siswa@sekolah.id",
  role: ROLES.STUDENT,
  student_id: "STD_001"
};

// 1. Admin Login & Full Access Test
runTest("1. Admin memiliki hak akses administratif penuh", () => {
  assert.strictEqual(isAdmin(adminUser), true, "Admin harus diidentifikasi sebagai admin.");
  assert.strictEqual(canAccessClass(adminUser, CLASSES.KELAS_1), true, "Admin dapat akses Kelas 1.");
  assert.strictEqual(canAccessClass(adminUser, CLASSES.KELAS_6), true, "Admin dapat akses Kelas 6.");
  assert.strictEqual(canManageStudents(adminUser, CLASSES.KELAS_1), true, "Admin dapat kelola siswa Kelas 1.");
  assert.strictEqual(canManageStudents(adminUser, CLASSES.KELAS_6), true, "Admin dapat kelola siswa Kelas 6.");
});

// 2. Guru Kelas 1 Isolation Test
runTest("2. Guru Kelas 1 HANYA dapat mengakses Kelas 1", () => {
  assert.strictEqual(canAccessClass(guruKelas1User, CLASSES.KELAS_1), true, "Guru Kelas 1 boleh akses Kelas 1.");
  assert.strictEqual(canAccessClass(guruKelas1User, CLASSES.KELAS_6), false, "Guru Kelas 1 DILARANG akses Kelas 6.");
  assert.strictEqual(canManageStudents(guruKelas1User, CLASSES.KELAS_6), false, "Guru Kelas 1 DILARANG kelola siswa Kelas 6.");
  assert.strictEqual(canManageGrades(guruKelas1User, CLASSES.KELAS_6), false, "Guru Kelas 1 DILARANG kelola nilai Kelas 6.");
  assert.strictEqual(canManageAttendance(guruKelas1User, CLASSES.KELAS_6), false, "Guru Kelas 1 DILARANG kelola absensi Kelas 6.");
});

// 3. Guru Kelas 6 Isolation Test
runTest("3. Guru Kelas 6 HANYA dapat mengakses Kelas 6", () => {
  assert.strictEqual(canAccessClass(guruKelas6User, CLASSES.KELAS_6), true, "Guru Kelas 6 boleh akses Kelas 6.");
  assert.strictEqual(canAccessClass(guruKelas6User, CLASSES.KELAS_1), false, "Guru Kelas 6 DILARANG akses Kelas 1.");
  assert.strictEqual(canManageStudents(guruKelas6User, CLASSES.KELAS_1), false, "Guru Kelas 6 DILARANG kelola siswa Kelas 1.");
  assert.strictEqual(canManageGrades(guruKelas6User, CLASSES.KELAS_1), false, "Guru Kelas 6 DILARANG kelola nilai Kelas 1.");
  assert.strictEqual(canManageAttendance(guruKelas6User, CLASSES.KELAS_1), false, "Guru Kelas 6 DILARANG kelola absensi Kelas 1.");
});

// 4. Guru Profile Edit Isolation
runTest("4. Guru hanya dapat mengubah profil miliknya sendiri, bukan profil guru lain", () => {
  assert.strictEqual(canEditTeacherProfile(guruKelas1User, "TCH001"), true, "Guru Kelas 1 boleh edit profil TCH001 miliknya.");
  assert.strictEqual(canEditTeacherProfile(guruKelas1User, "TCH002"), false, "Guru Kelas 1 DILARANG edit profil TCH002 (Guru Kelas 6).");
  assert.strictEqual(canEditTeacherProfile(guruKelas6User, "TCH002"), true, "Guru Kelas 6 boleh edit profil TCH002 miliknya.");
  assert.strictEqual(canEditTeacherProfile(guruKelas6User, "TCH001"), false, "Guru Kelas 6 DILARANG edit profil TCH001 (Guru Kelas 1).");
  assert.strictEqual(canEditTeacherProfile(adminUser, "TCH001"), true, "Admin dapat mengedit seluruh profil.");
});

// 5. Siswa Permissions Test
runTest("5. Siswa tidak memiliki izin manipulasi data (read-only)", () => {
  assert.strictEqual(isAdmin(siswaUser), false, "Siswa bukan admin.");
  assert.strictEqual(isTeacher(siswaUser), false, "Siswa bukan guru.");
  assert.strictEqual(canManageStudents(siswaUser, CLASSES.KELAS_1), false, "Siswa tidak dapat mengelola siswa.");
  assert.strictEqual(canManageGrades(siswaUser, CLASSES.KELAS_1), false, "Siswa tidak dapat mengelola nilai.");
  assert.strictEqual(canManageAttendance(siswaUser, CLASSES.KELAS_1), false, "Siswa tidak dapat mengelola absensi.");
});

// 6. Security Check: Tidak ada rahasia di client code / .env.example
runTest("6. Keamanan Repository: Tidak ada service account key atau private key yang bocor", () => {
  import('fs').then(fs => {
    const envExample = fs.readFileSync('.env.example', 'utf8');
    assert.strictEqual(envExample.includes('private_key'), false, ".env.example tidak boleh berisi private_key!");
    assert.strictEqual(envExample.includes('BEGIN PRIVATE KEY'), false, ".env.example tidak boleh berisi RSA key!");
  });
});

console.log("==============================================================================");
console.log(`PENGUJIAN SELESAI: ${passedTests} / ${totalTests} LULUS (${Math.round((passedTests/totalTests)*100)}%)`);
console.log("==============================================================================");

if (passedTests !== totalTests) {
  process.exit(1);
}
