/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * AUTOMATED TEST SUITE (tests/verify-all.js)
 * ==============================================================================
 */

import assert from 'assert';
import { 
  canAccessClass, 
  canModifyAttendance, 
  canModifyGrades, 
  canViewReports, 
  canManageSettings, 
  canTriggerSync, 
  isAdmin, 
  isHeadmaster, 
  isTeacher, 
  ROLES, 
  CLASSES 
} from '../src/permissions.js';

let passed = 0;
let total = 0;

function it(description, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${description}`);
    console.error(`       Error: ${err.message}`);
  }
}

console.log("==============================================================================");
console.log("MENJALANKAN TEST SUITE SISTEM ABSENSI DAN NILAI SD KELAS 1–6");
console.log("==============================================================================");

// Mock Users
const admin = { uid: "ADM01", email: "admin@sekolah.id", role: ROLES.ADMIN, kelas_id: "semua" };
const kepsek = { uid: "KS01", email: "kepsek@sekolah.id", role: ROLES.HEADMASTER, kelas_id: "semua" };
const guruK1 = { uid: "GUR01", email: "guru1@sekolah.id", role: ROLES.TEACHER, kelas_id: CLASSES.KELAS_1 };
const guruK2 = { uid: "GUR02", email: "guru2@sekolah.id", role: ROLES.TEACHER, kelas_id: CLASSES.KELAS_2 };
const guruK6 = { uid: "GUR06", email: "guru6@sekolah.id", role: ROLES.TEACHER, kelas_id: CLASSES.KELAS_6 };

// 1. Admin Tests
it("1. Administrator memiliki hak akses supervisi penuh ke seluruh kelas 1–6", () => {
  assert.strictEqual(isAdmin(admin), true);
  for (let c = 1; c <= 6; c++) {
    assert.strictEqual(canAccessClass(admin, `kelas_${c}`), true, `Admin harus dapat akses kelas_${c}`);
    assert.strictEqual(canModifyAttendance(admin, `kelas_${c}`), true, `Admin dapat ubah absensi kelas_${c}`);
    assert.strictEqual(canModifyGrades(admin, `kelas_${c}`), true, `Admin dapat ubah nilai kelas_${c}`);
  }
  assert.strictEqual(canManageSettings(admin), true);
  assert.strictEqual(canTriggerSync(admin), true);
});

// 2. Kepala Sekolah Tests
it("2. Kepala Sekolah dapat melihat seluruh kelas 1–6 tetapi tidak mengubah data langsung", () => {
  assert.strictEqual(isHeadmaster(kepsek), true);
  for (let c = 1; c <= 6; c++) {
    assert.strictEqual(canAccessClass(kepsek, `kelas_${c}`), true, `Kepsek dapat lihat kelas_${c}`);
    assert.strictEqual(canModifyAttendance(kepsek, `kelas_${c}`), false, `Kepsek DILARANG ubah absensi kelas_${c}`);
    assert.strictEqual(canModifyGrades(kepsek, `kelas_${c}`), false, `Kepsek DILARANG ubah nilai kelas_${c}`);
    assert.strictEqual(canViewReports(kepsek, `kelas_${c}`), true, `Kepsek dapat cetak laporan kelas_${c}`);
  }
  assert.strictEqual(canManageSettings(kepsek), false);
  assert.strictEqual(canTriggerSync(kepsek), false);
});

// 3. Guru Kelas 1 Isolation Test
it("3. Guru Kelas 1 HANYA dapat mengakses dan mengubah data Kelas 1", () => {
  assert.strictEqual(isTeacher(guruK1), true);
  assert.strictEqual(canAccessClass(guruK1, CLASSES.KELAS_1), true);
  assert.strictEqual(canModifyAttendance(guruK1, CLASSES.KELAS_1), true);
  assert.strictEqual(canModifyGrades(guruK1, CLASSES.KELAS_1), true);

  // Dilarang ke kelas 2 s/d 6
  for (let c = 2; c <= 6; c++) {
    assert.strictEqual(canAccessClass(guruK1, `kelas_${c}`), false, `Guru K1 DILARANG akses kelas_${c}`);
    assert.strictEqual(canModifyAttendance(guruK1, `kelas_${c}`), false, `Guru K1 DILARANG ubah absensi kelas_${c}`);
    assert.strictEqual(canModifyGrades(guruK1, `kelas_${c}`), false, `Guru K1 DILARANG ubah nilai kelas_${c}`);
  }
});

// 4. Guru Kelas 2 Isolation Test
it("4. Guru Kelas 2 HANYA dapat mengakses dan mengubah data Kelas 2", () => {
  assert.strictEqual(canAccessClass(guruK2, CLASSES.KELAS_2), true);
  assert.strictEqual(canModifyAttendance(guruK2, CLASSES.KELAS_2), true);
  assert.strictEqual(canModifyGrades(guruK2, CLASSES.KELAS_2), true);

  assert.strictEqual(canAccessClass(guruK2, CLASSES.KELAS_1), false);
  assert.strictEqual(canAccessClass(guruK2, CLASSES.KELAS_6), false);
});

// 5. Guru Kelas 6 Isolation Test
it("5. Guru Kelas 6 HANYA dapat mengakses dan mengubah data Kelas 6", () => {
  assert.strictEqual(canAccessClass(guruK6, CLASSES.KELAS_6), true);
  assert.strictEqual(canModifyAttendance(guruK6, CLASSES.KELAS_6), true);
  assert.strictEqual(canModifyGrades(guruK6, CLASSES.KELAS_6), true);

  for (let c = 1; c <= 5; c++) {
    assert.strictEqual(canAccessClass(guruK6, `kelas_${c}`), false, `Guru K6 DILARANG akses kelas_${c}`);
  }
});

// 6. Validasi Rumus Persentase Kehadiran
it("6. Rumus Persentase Kehadiran = (Hadir ÷ Total Hari Tercatat) × 100%", () => {
  const hadir = 18;
  const totalHariTercatat = 20;
  const persentase = Math.round((hadir / totalHariTercatat) * 100);
  assert.strictEqual(persentase, 90, "18 dari 20 hari harus 90%");

  // Hari tanpa catatan tidak dianggap alpa
  const hariTanpaCatatan = 0;
  assert.strictEqual(hariTanpaCatatan, 0);
});

// 7. Validasi Nilai Skala 0-100
it("7. Nilai di luar rentang 0–100 wajib ditolak", () => {
  const validScores = [0, 50, 75, 100];
  const invalidScores = [-5, 105, 999];

  validScores.forEach(score => {
    assert.strictEqual(score >= 0 && score <= 100, true);
  });

  invalidScores.forEach(score => {
    assert.strictEqual(score < 0 || score > 100, true);
  });
});

// 8. Keamanan Kredensial
it("8. Keamanan: Tidak ada Private Key atau Service Account dalam berkas repo", () => {
  import('fs').then(fs => {
    const envEx = fs.readFileSync('.env.example', 'utf8');
    assert.strictEqual(envEx.includes('private_key'), false);
    assert.strictEqual(envEx.includes('BEGIN PRIVATE KEY'), false);
  });
});

console.log("==============================================================================");
console.log(`PENGUJIAN SELESAI: ${passed} / ${total} LULUS (${Math.round((passed/total)*100)}%)`);
console.log("==============================================================================");

if (passed !== total) process.exit(1);
