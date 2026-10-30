import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import {
  Student,
  AttendanceRecord,
  GradeRecord,
  SchoolProfile,
  AuditLog,
  UserProfile,
} from '../../types';

// Default mock/fallback data for initial zero-config experience & connection preview
const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  id: 'school_main',
  name: 'SD NEGERI 01 CEMARA INDAH',
  npsn: '20210899',
  address: 'Jl. Pendidikan No. 45, Kecamatan Sukamaju',
  village: 'Sukamaju',
  subdistrict: 'Sukamaju',
  regency: 'Kabupaten Bandung',
  province: 'Jawa Barat',
  logoUrl: '/logo.svg',
  principalName: 'Drs. H. Mulyadi, M.Pd.',
  principalNip: '19680512 199303 1 004',
  academicYear: '2026/2027',
  activeSemester: '1',
};

// ==========================================
// 1. STUDENTS SERVICE
// ==========================================
export async function getFirestoreStudents(classFilter?: string): Promise<Student[]> {
  if (!isFirebaseConfigured || !db) {
    const local = localStorage.getItem('school_students');
    if (local) {
      const parsed: Student[] = JSON.parse(local);
      return classFilter ? parsed.filter(s => s.class === classFilter) : parsed;
    }
    // Initial sample student master data across classes 1 to 6
    const initial: Student[] = [
      {
        studentId: 'SD-1-1001',
        nis: '1001',
        nisn: '0151234561',
        name: 'Ahmad Faiz Pratama',
        gender: 'Laki-laki',
        birthPlace: 'Bandung',
        birthDate: '2019-03-15',
        parentName: 'Bambang Pratama',
        address: 'Jl. Merpati No. 12',
        class: '1',
        schoolYear: '2026/2027',
        status: 'Aktif',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'google_sheets',
        syncStatus: 'synced',
      },
      {
        studentId: 'SD-1-1002',
        nis: '1002',
        nisn: '0151234562',
        name: 'Aisyah Putri Rahmadani',
        gender: 'Perempuan',
        birthPlace: 'Bandung',
        birthDate: '2019-07-22',
        parentName: 'Rahmat Hidayat',
        address: 'Jl. Kenari No. 04',
        class: '1',
        schoolYear: '2026/2027',
        status: 'Aktif',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'google_sheets',
        syncStatus: 'synced',
      },
      {
        studentId: 'SD-2-2001',
        nis: '2001',
        nisn: '0142345671',
        name: 'Bintang Arya Sena',
        gender: 'Laki-laki',
        birthPlace: 'Cimahi',
        birthDate: '2018-05-10',
        parentName: 'Agus Gunawan',
        address: 'Jl. Anggrek No. 18',
        class: '2',
        schoolYear: '2026/2027',
        status: 'Aktif',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'google_sheets',
        syncStatus: 'synced',
      },
      {
        studentId: 'SD-3-3001',
        nis: '3001',
        nisn: '0133456781',
        name: 'Citra Kirana Lestari',
        gender: 'Perempuan',
        birthPlace: 'Bandung',
        birthDate: '2017-09-14',
        parentName: 'Lestari Suwarno',
        address: 'Jl. Melati No. 08',
        class: '3',
        schoolYear: '2026/2027',
        status: 'Aktif',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'google_sheets',
        syncStatus: 'synced',
      },
      {
        studentId: 'SD-4-4001',
        nis: '4001',
        nisn: '0124567891',
        name: 'Daffa Rizky Ramadhan',
        gender: 'Laki-laki',
        birthPlace: 'Jakarta',
        birthDate: '2016-11-20',
        parentName: 'Rizky Alamsyah',
        address: 'Jl. Flamboyan No. 25',
        class: '4',
        schoolYear: '2026/2027',
        status: 'Aktif',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'google_sheets',
        syncStatus: 'synced',
      },
      {
        studentId: 'SD-5-5001',
        nis: '5001',
        nisn: '0115678901',
        name: 'Eka Nurul Fadilah',
        gender: 'Perempuan',
        birthPlace: 'Bandung',
        birthDate: '2015-02-18',
        parentName: 'Fadil Santoso',
        address: 'Jl. Cempaka No. 03',
        class: '5',
        schoolYear: '2026/2027',
        status: 'Aktif',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'google_sheets',
        syncStatus: 'synced',
      },
      {
        studentId: 'SD-6-6001',
        nis: '6001',
        nisn: '0106789011',
        name: 'Farhan Aditya Nugraha',
        gender: 'Laki-laki',
        birthPlace: 'Sumedang',
        birthDate: '2014-08-30',
        parentName: 'Nugraha Sanjaya',
        address: 'Jl. Dahlia No. 15',
        class: '6',
        schoolYear: '2026/2027',
        status: 'Aktif',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'google_sheets',
        syncStatus: 'synced',
      },
    ];
    localStorage.setItem('school_students', JSON.stringify(initial));
    return classFilter ? initial.filter(s => s.class === classFilter) : initial;
  }

  const studentsRef = collection(db, 'students');
  let q = query(studentsRef, orderBy('name', 'asc'));
  if (classFilter) {
    q = query(studentsRef, where('class', '==', classFilter), orderBy('name', 'asc'));
  }

  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as Student);
}

export async function saveFirestoreStudent(student: Student): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    const list = await getFirestoreStudents();
    const idx = list.findIndex(s => s.studentId === student.studentId);
    if (idx >= 0) {
      list[idx] = student;
    } else {
      list.push(student);
    }
    localStorage.setItem('school_students', JSON.stringify(list));
    return;
  }

  const docRef = doc(db, 'students', student.studentId);
  await setDoc(docRef, { ...student, updatedAt: new Date().toISOString() }, { merge: true });
}

// ==========================================
// 2. ATTENDANCE SERVICE
// ==========================================
export async function getFirestoreAttendance(
  classFilter: string,
  dateFilter?: string
): Promise<AttendanceRecord[]> {
  if (!isFirebaseConfigured || !db) {
    const local = localStorage.getItem('school_attendance');
    const records: AttendanceRecord[] = local ? JSON.parse(local) : [];
    return records.filter(r => {
      if (r.class !== classFilter) return false;
      if (dateFilter && r.date !== dateFilter) return false;
      return true;
    });
  }

  const ref = collection(db, 'attendance');
  let q = query(ref, where('class', '==', classFilter));
  if (dateFilter) {
    q = query(ref, where('class', '==', classFilter), where('date', '==', dateFilter));
  }

  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as AttendanceRecord);
}

export async function saveBatchFirestoreAttendance(records: AttendanceRecord[]): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    const local = localStorage.getItem('school_attendance');
    const existing: AttendanceRecord[] = local ? JSON.parse(local) : [];
    const map = new Map(existing.map(r => [r.attendanceId, r]));
    records.forEach(r => map.set(r.attendanceId, r));
    localStorage.setItem('school_attendance', JSON.stringify(Array.from(map.values())));
    return;
  }

  for (const record of records) {
    const docRef = doc(db, 'attendance', record.attendanceId);
    await setDoc(docRef, { ...record, updatedAt: new Date().toISOString() }, { merge: true });
  }
}

// ==========================================
// 3. GRADES SERVICE
// ==========================================
export async function getFirestoreGrades(
  classFilter: string,
  subjectFilter?: string,
  semesterFilter?: string
): Promise<GradeRecord[]> {
  if (!isFirebaseConfigured || !db) {
    const local = localStorage.getItem('school_grades');
    const records: GradeRecord[] = local ? JSON.parse(local) : [];
    return records.filter(r => {
      if (r.class !== classFilter) return false;
      if (subjectFilter && r.subject.toLowerCase() !== subjectFilter.toLowerCase()) return false;
      if (semesterFilter && r.semester !== semesterFilter) return false;
      return true;
    });
  }

  const ref = collection(db, 'grades');
  let q = query(ref, where('class', '==', classFilter));
  if (subjectFilter) {
    q = query(ref, where('class', '==', classFilter), where('subject', '==', subjectFilter));
  }

  const snap = await getDocs(q);
  let list = snap.docs.map(doc => doc.data() as GradeRecord);
  if (semesterFilter) {
    list = list.filter(r => r.semester === semesterFilter);
  }
  return list;
}

export async function saveBatchFirestoreGrades(records: GradeRecord[]): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    const local = localStorage.getItem('school_grades');
    const existing: GradeRecord[] = local ? JSON.parse(local) : [];
    const map = new Map(existing.map(r => [r.gradeId, r]));
    records.forEach(r => map.set(r.gradeId, r));
    localStorage.setItem('school_grades', JSON.stringify(Array.from(map.values())));
    return;
  }

  for (const record of records) {
    const docRef = doc(db, 'grades', record.gradeId);
    await setDoc(docRef, { ...record, updatedAt: new Date().toISOString() }, { merge: true });
  }
}

// ==========================================
// 4. SCHOOL PROFILE & SETTINGS
// ==========================================
export async function getSchoolProfile(): Promise<SchoolProfile> {
  if (!isFirebaseConfigured || !db) {
    const local = localStorage.getItem('school_profile');
    return local ? JSON.parse(local) : DEFAULT_SCHOOL_PROFILE;
  }

  const docRef = doc(db, 'schoolProfile', 'school_main');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as SchoolProfile;
  }
  return DEFAULT_SCHOOL_PROFILE;
}

export async function saveSchoolProfile(profile: SchoolProfile): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    localStorage.setItem('school_profile', JSON.stringify(profile));
    return;
  }

  const docRef = doc(db, 'schoolProfile', profile.id || 'school_main');
  await setDoc(docRef, profile, { merge: true });
}

// ==========================================
// 5. AUDIT LOGS
// ==========================================
export async function logAuditEvent(
  user: { uid?: string; name?: string; email?: string } | null,
  action: string,
  dataType: string,
  dataId: string,
  details: string
): Promise<void> {
  const audit: AuditLog = {
    id: 'ACT-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    userId: user?.uid || user?.email || 'SYSTEM',
    userName: user?.name || user?.email || 'Sistem',
    action,
    dataType,
    dataId,
    details,
  };

  if (!isFirebaseConfigured || !db) {
    const local = localStorage.getItem('school_audit_logs');
    const logs: AuditLog[] = local ? JSON.parse(local) : [];
    logs.unshift(audit);
    // keep last 200 logs
    if (logs.length > 200) logs.length = 200;
    localStorage.setItem('school_audit_logs', JSON.stringify(logs));
    return;
  }

  try {
    const docRef = doc(db, 'auditLogs', audit.id);
    await setDoc(docRef, audit);
  } catch (err) {
    console.error('Gagal mencatat audit log:', err);
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (!isFirebaseConfigured || !db) {
    const local = localStorage.getItem('school_audit_logs');
    return local ? JSON.parse(local) : [];
  }

  const ref = collection(db, 'auditLogs');
  const q = query(ref, orderBy('timestamp', 'desc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as AuditLog);
}
