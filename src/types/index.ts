/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * Definisi Type & Interface TypeScript
 * Sekolah Dasar Negeri Kesilir 02 - Kecamatan Wuluhan, Kabupaten Jember
 */

export type UserRole = 'admin' | 'guru' | 'kepsek';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  password?: string;
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

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'H' | 'S' | 'I' | 'A' | '';

export interface DailyAttendanceRecord {
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
}

// Attendance format matching Gambar 1 (1-31 monthly grid)
export interface MonthlyAttendanceSheet {
  month: string; // YYYY-MM, e.g. "2026-08"
  class: string;
  schoolYear: string;
  days: Record<string, Record<number, AttendanceStatus>>; // studentId -> day (1..31) -> status
  notes: Record<string, string>; // studentId -> notes
}

export type AttendanceRecord = DailyAttendanceRecord;

// Detailed Grade format matching Gambar 2 (SDN KESILIR 02)
export interface StudentDetailedGrade {
  studentId: string;
  studentName: string;
  nis: string;
  class: string;
  subject: string;
  schoolYear: string;
  semester: '1' | '2';
  // Formatif (Lingkup Materi 1-5, each TP 1-4)
  formatif: {
    lm1: { tp1: number | null; tp2: number | null; tp3: number | null; tp4: number | null };
    lm2: { tp1: number | null; tp2: number | null; tp3: number | null; tp4: number | null };
    lm3: { tp1: number | null; tp2: number | null; tp3: number | null; tp4: number | null };
    lm4: { tp1: number | null; tp2: number | null; tp3: number | null; tp4: number | null };
    lm5: { tp1: number | null; tp2: number | null; tp3: number | null; tp4: number | null };
  };
  // Sumatif Lingkup Materi (LM1 - LM5)
  sumatifLM: {
    lm1: number | null;
    lm2: number | null;
    lm3: number | null;
    lm4: number | null;
    lm5: number | null;
  };
  // Sumatif Akhir Semester
  sts: number | null; // Sumatif Tengah Semester
  sas: number | null; // Sumatif Akhir Semester
  finalScore: number | null; // Nilai Akhir
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
  score: number | null;
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
  logoUrl?: string; // Logo SD
  logoKiriUrl?: string; // Logo Pemkab Jember
  logoKananUrl?: string; // Logo SD
  kopLine1: string; // PEMERINTAH KABUPATEN JEMBER
  kopLine2: string; // DINAS PENDIDIKAN
  kopLine3: string; // SEKOLAH DASAR NEGERI KESILIR 02
  kopLine4: string; // KECAMATAN WULUHAN
  kopLine5: string; // JL. Ambulu No. 91 Kesilir Wuluhan Kode Pos 68162
  principalName: string;
  principalNip: string;
  academicYear: string;
  activeSemester: '1' | '2';
  spreadsheetUrl?: string;
}

export interface SubjectConfig {
  id: string;
  name: string;
  code: string;
  kkm: number;
  classes: string[];
  active: boolean;
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
