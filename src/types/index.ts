/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * Definisi Type & Interface TypeScript
 */

export type UserRole = 'admin' | 'guru' | 'kepsek';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  assignedClasses: string[]; // e.g., ['1'] or ['3'] or ['1','2']
  photoURL?: string;
  nip?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type StudentStatus = 'Aktif' | 'Pindah' | 'Lulus' | 'Nonaktif';
export type Gender = 'Laki-laki' | 'Perempuan';

export interface Student {
  studentId: string;
  nis: string;
  nisn: string;
  name: string;
  gender: Gender;
  birthPlace: string;
  birthDate: string; // YYYY-MM-DD
  parentName: string;
  address: string;
  class: string; // '1' - '6'
  schoolYear: string; // e.g. '2026/2027'
  status: StudentStatus;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  source?: 'google_sheets' | 'web';
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';

export interface AttendanceRecord {
  attendanceId: string;
  studentId: string;
  studentName: string;
  nis?: string;
  nisn?: string;
  class: string;
  date: string; // YYYY-MM-DD
  schoolYear: string;
  semester: '1' | '2';
  status: AttendanceStatus;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export type AssessmentType =
  | 'Formatif'
  | 'Sumatif Lingkup Materi'
  | 'Sumatif Tengah Semester'
  | 'Sumatif Akhir Semester';

export interface GradeRecord {
  gradeId: string;
  studentId: string;
  studentName: string;
  nis?: string;
  nisn?: string;
  class: string;
  subject: string;
  assessmentType: AssessmentType;
  material: string;
  score: number | null; // null if not yet graded
  description?: string;
  schoolYear: string;
  semester: '1' | '2';
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export interface SchoolProfile {
  id: string;
  name: string;
  npsn: string;
  address: string;
  village: string;
  subdistrict: string;
  regency: string;
  province: string;
  logoUrl?: string;
  principalName: string;
  principalNip: string;
  academicYear: string;
  activeSemester: '1' | '2';
}

export interface SubjectConfig {
  id: string;
  name: string;
  code: string;
  kkm: number;
  classes: string[]; // ['1','2','3','4','5','6']
  active: boolean;
}

export interface AssessmentWeightConfig {
  type: AssessmentType;
  weight: number; // percentage, sum = 100
}

export interface ServiceHealthStatus {
  connected: boolean;
  status: 'TERHUBUNG' | 'BELUM_TERHUBUNG' | 'MENUNGGU' | 'SINKRONISASI' | 'GAGAL';
  message?: string;
  details?: Record<string, any>;
}

export interface SystemSyncStatus {
  timestamp: string;
  services: {
    firebase: ServiceHealthStatus;
    sheets: ServiceHealthStatus;
    appsScript: ServiceHealthStatus;
    googleDrive: ServiceHealthStatus;
  };
  pendingQueueCount: number;
  lastSync?: {
    time: string;
    type: string;
    direction: string;
    status: string;
    message: string;
  } | null;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  dataType: string;
  dataId: string;
  details: string;
}

export interface StudentAttendanceRecap {
  studentId: string;
  nis: string;
  nisn: string;
  name: string;
  class: string;
  present: number;
  sick: number;
  permit: number;
  absent: number;
  totalDays: number;
  attendanceRate: number; // 0 - 100%
}
