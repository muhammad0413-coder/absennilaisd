import { callAppsScript, testAppsScriptConnection } from '../apps-script/appsScriptApi';
import {
  getFirestoreStudents,
  saveFirestoreStudent,
  getFirestoreAttendance,
  getFirestoreGrades,
  logAuditEvent,
} from '../firebase/firestoreService';
import { Student, AttendanceRecord, GradeRecord, SystemSyncStatus } from '../../types';

export interface SyncExecutionResult {
  type: string;
  total: number;
  successCount: number;
  failedCount: number;
  errors: string[];
  status: 'BERHASIL' | 'SEBAGIAN' | 'GAGAL';
  message: string;
  timestamp: string;
}

/**
 * Sinkronisasi Siswa dari Google Sheets ke Firestore
 */
export async function syncStudentsFromSheets(): Promise<SyncExecutionResult> {
  const result: SyncExecutionResult = {
    type: 'Siswa',
    total: 0,
    successCount: 0,
    failedCount: 0,
    errors: [],
    status: 'BERHASIL',
    message: '',
    timestamp: new Date().toISOString(),
  };

  const response = await callAppsScript<any>('getStudents', {}, 'GET');
  if (!response.success || !response.data) {
    result.status = 'GAGAL';
    result.message = response.message || 'Gagal mengambil data siswa dari Google Sheets';
    result.errors.push(result.message);
    return result;
  }

  const rawStudents: any[] = response.data;
  result.total = rawStudents.length;

  for (const raw of rawStudents) {
    try {
      const student: Student = {
        studentId: String(raw.ID_Siswa || raw.studentId),
        nis: String(raw.NIS || ''),
        nisn: String(raw.NISN || ''),
        name: String(raw.Nama_Lengkap || raw.name),
        gender: raw.Jenis_Kelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
        birthPlace: String(raw.Tempat_Lahir || ''),
        birthDate: String(raw.Tanggal_Lahir || ''),
        parentName: String(raw.Nama_Orang_Tua || ''),
        address: String(raw.Alamat || ''),
        class: String(raw.Kelas || '1'),
        schoolYear: String(raw.Tahun_Pelajaran || '2026/2027'),
        status: raw.Status_Siswa || 'Aktif',
        photoURL: raw.Foto_URL || '',
        createdAt: raw.Created_At || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'google_sheets',
        syncStatus: 'synced',
      };

      await saveFirestoreStudent(student);
      result.successCount++;
    } catch (err: any) {
      result.failedCount++;
      result.errors.push(`Gagal memproses ${raw.Nama_Lengkap || raw.ID_Siswa}: ${err.message}`);
    }
  }

  if (result.failedCount > 0) {
    result.status = result.successCount > 0 ? 'SEBAGIAN' : 'GAGAL';
  }
  result.message = `Sinkronisasi Siswa: ${result.successCount} berhasil, ${result.failedCount} gagal dari ${result.total} data.`;

  await logAuditEvent(null, 'SYNC_SISWA', 'Students', 'BATCH', result.message);
  return result;
}

/**
 * Sinkronisasi Absensi dari Firestore ke Google Sheets
 */
export async function syncAttendanceToSheets(classId: string, date: string): Promise<SyncExecutionResult> {
  const result: SyncExecutionResult = {
    type: 'Absensi',
    total: 0,
    successCount: 0,
    failedCount: 0,
    errors: [],
    status: 'BERHASIL',
    message: '',
    timestamp: new Date().toISOString(),
  };

  const attendanceRecords = await getFirestoreAttendance(classId, date);
  result.total = attendanceRecords.length;

  if (attendanceRecords.length === 0) {
    result.message = 'Tidak ada catatan absensi untuk disinkronkan pada tanggal tersebut.';
    return result;
  }

  const response = await callAppsScript('saveAttendance', { records: attendanceRecords }, 'POST');
  if (response.success && response.data) {
    result.successCount = response.data.savedCount || attendanceRecords.length;
    result.failedCount = response.data.failedCount || 0;
    result.errors = response.data.errors || [];
    if (result.failedCount > 0) {
      result.status = result.successCount > 0 ? 'SEBAGIAN' : 'GAGAL';
    }
    result.message = `Sinkronisasi Absensi: ${result.successCount} berhasil, ${result.failedCount} gagal.`;
  } else {
    result.status = 'GAGAL';
    result.failedCount = result.total;
    result.message = response.message || 'Gagal mengirim absensi ke Google Sheets';
    result.errors.push(result.message);
  }

  await logAuditEvent(null, 'SYNC_ABSENSI', 'Attendance', `Kelas ${classId} - ${date}`, result.message);
  return result;
}

/**
 * Sinkronisasi Nilai dari Firestore ke Google Sheets
 */
export async function syncGradesToSheets(classId: string, subject: string): Promise<SyncExecutionResult> {
  const result: SyncExecutionResult = {
    type: 'Nilai',
    total: 0,
    successCount: 0,
    failedCount: 0,
    errors: [],
    status: 'BERHASIL',
    message: '',
    timestamp: new Date().toISOString(),
  };

  const grades = await getFirestoreGrades(classId, subject);
  result.total = grades.length;

  if (grades.length === 0) {
    result.message = 'Tidak ada data nilai untuk mata pelajaran ini.';
    return result;
  }

  const response = await callAppsScript('saveGrades', { records: grades }, 'POST');
  if (response.success && response.data) {
    result.successCount = response.data.savedCount || grades.length;
    result.failedCount = response.data.failedCount || 0;
    result.errors = response.data.errors || [];
    if (result.failedCount > 0) {
      result.status = result.successCount > 0 ? 'SEBAGIAN' : 'GAGAL';
    }
    result.message = `Sinkronisasi Nilai: ${result.successCount} berhasil, ${result.failedCount} gagal.`;
  } else {
    result.status = 'GAGAL';
    result.failedCount = result.total;
    result.message = response.message || 'Gagal mengirim nilai ke Google Sheets';
    result.errors.push(result.message);
  }

  await logAuditEvent(null, 'SYNC_NILAI', 'Grades', `Kelas ${classId} - ${subject}`, result.message);
  return result;
}

/**
 * Menjalankan Sinkronisasi Semua Entitas
 */
export async function syncAllEntities(): Promise<{
  students: SyncExecutionResult;
  systemStatus: SystemSyncStatus;
}> {
  const studentsResult = await syncStudentsFromSheets();
  const systemStatus = await testAppsScriptConnection();
  return { students: studentsResult, systemStatus };
}
