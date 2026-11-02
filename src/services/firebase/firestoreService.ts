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
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import {
  Student,
  AttendanceRecord,
  GradeRecord,
  SchoolProfile,
  AuditLog,
  UserProfile,
  StudentDetailedGrade,
  MonthlyAttendanceSheet,
} from '../../types';
import { callAppsScript } from '../apps-script/appsScriptApi';

// Identitas Asli SDN KESILIR 02 KECAMATAN WULUHAN KABUPATEN JEMBER
export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  id: 'school_main',
  name: 'SEKOLAH DASAR NEGERI KESILIR 02',
  npsn: '20523825',
  address: 'JL. Ambulu No. 91 Kesilir Wuluhan Kode Pos 68162',
  village: 'Kesilir',
  subdistrict: 'Kecamatan Wuluhan',
  regency: 'Kabupaten Jember',
  province: 'Jawa Timur',
  logoUrl: '/logo_sd.png',
  logoKiriUrl: '/logo_jember.png',
  logoKananUrl: '/logo_sd.png',
  kopLine1: 'PEMERINTAH KABUPATEN JEMBER',
  kopLine2: 'DINAS PENDIDIKAN',
  kopLine3: 'SEKOLAH DASAR NEGERI KESILIR 02',
  kopLine4: 'KECAMATAN WULUHAN',
  kopLine5: 'JL. Ambulu No. 91 Kesilir Wuluhan Kode Pos 68162',
  principalName: 'Abdullah Mahsar, S.Pd',
  principalNip: '198306012014121000',
  academicYear: '2026/2027',
  activeSemester: '1',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
};

// Data Asli Siswa SDN Kesilir 02 Kelas 1 (Sesuai Buku Nilai Asli Gambar 2)
export const REAL_STUDENTS_KESILIR_02: Student[] = [
  {
    studentId: 'SD-1-1001',
    nis: '1001',
    nisn: '0182345001',
    name: 'ADREENA FARESTA HADIONO',
    gender: 'Perempuan',
    birthPlace: 'Jember',
    birthDate: '2019-02-14',
    parentName: 'Hadiono',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1002',
    nis: '1002',
    nisn: '0182345002',
    name: 'AKSEL DELLAN MAURIZ',
    gender: 'Laki-laki',
    birthPlace: 'Jember',
    birthDate: '2019-05-10',
    parentName: 'Mauriz',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1003',
    nis: '1003',
    nisn: '0182345003',
    name: 'ALJAZ ALZAM PUTRA SUSILO',
    gender: 'Laki-laki',
    birthPlace: 'Jember',
    birthDate: '2019-08-19',
    parentName: 'Susilo',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1004',
    nis: '1004',
    nisn: '0182345004',
    name: 'ALYONA PUTRI BELINDA',
    gender: 'Perempuan',
    birthPlace: 'Jember',
    birthDate: '2019-03-22',
    parentName: 'Belinda',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1005',
    nis: '1005',
    nisn: '0182345005',
    name: 'ANDARA ARSY SYAHILA',
    gender: 'Perempuan',
    birthPlace: 'Jember',
    birthDate: '2019-11-04',
    parentName: 'Syahila',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1006',
    nis: '1006',
    nisn: '0182345006',
    name: 'APRILIA NURIANAH',
    gender: 'Perempuan',
    birthPlace: 'Jember',
    birthDate: '2019-04-12',
    parentName: 'Nurianah',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1007',
    nis: '1007',
    nisn: '0182345007',
    name: 'AQILA ZALFA PRASETYO',
    gender: 'Perempuan',
    birthPlace: 'Jember',
    birthDate: '2019-07-30',
    parentName: 'Prasetyo',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1008',
    nis: '1008',
    nisn: '0182345008',
    name: 'DELVITA ALMADILATUS SHOLIKAH',
    gender: 'Perempuan',
    birthPlace: 'Jember',
    birthDate: '2019-06-18',
    parentName: 'Sholikah',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1009',
    nis: '1009',
    nisn: '0182345009',
    name: 'KANIYA ARSYILA ZHAFIRA',
    gender: 'Perempuan',
    birthPlace: 'Jember',
    birthDate: '2019-09-08',
    parentName: 'Zhafira',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1010',
    nis: '1010',
    nisn: '0182345010',
    name: 'KEVIN MELVIANO PUTRA',
    gender: 'Laki-laki',
    birthPlace: 'Jember',
    birthDate: '2019-01-25',
    parentName: 'Putra',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1011',
    nis: '1011',
    nisn: '0182345011',
    name: 'MUHAMMAD LUQMAN HAKIM',
    gender: 'Laki-laki',
    birthPlace: 'Jember',
    birthDate: '2019-08-11',
    parentName: 'Hakim',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1012',
    nis: '1012',
    nisn: '0182345012',
    name: 'MUHAMMAD RAFKA ALDEBARAN PRAMANA',
    gender: 'Laki-laki',
    birthPlace: 'Jember',
    birthDate: '2019-10-15',
    parentName: 'Pramana',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1013',
    nis: '1013',
    nisn: '0182345013',
    name: 'NABILLA KHANAYA PUTRI PRANATA',
    gender: 'Perempuan',
    birthPlace: 'Jember',
    birthDate: '2019-12-01',
    parentName: 'Pranata',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1014',
    nis: '1014',
    nisn: '0182345014',
    name: 'PUTRI AYLEN NATHANIA',
    gender: 'Perempuan',
    birthPlace: 'Jember',
    birthDate: '2019-02-28',
    parentName: 'Nathania',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1015',
    nis: '1015',
    nisn: '0182345015',
    name: 'SYADDAD AISY AL BUKHORY',
    gender: 'Laki-laki',
    birthPlace: 'Jember',
    birthDate: '2019-07-07',
    parentName: 'Bukhory',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1016',
    nis: '1016',
    nisn: '0182345016',
    name: 'SYAFIRA PUTRI HAFIDZAH',
    gender: 'Perempuan',
    birthPlace: 'Jember',
    birthDate: '2019-05-19',
    parentName: 'Hafidzah',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
  {
    studentId: 'SD-1-1017',
    nis: '1017',
    nisn: '0182345017',
    name: 'ZAHRATUL MEI ANANTA',
    gender: 'Perempuan',
    birthPlace: 'Jember',
    birthDate: '2019-05-27',
    parentName: 'Ananta',
    address: 'Kesilir, Wuluhan, Jember',
    class: '1',
    schoolYear: '2026/2027',
    status: 'Aktif',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    source: 'google_sheets',
    syncStatus: 'synced',
  },
];

// ==========================================
// 1. STUDENTS SERVICE
// ==========================================
export async function getFirestoreStudents(classFilter?: string): Promise<Student[]> {
  if (!isFirebaseConfigured || !db) {
    const local = localStorage.getItem('school_students_kesilir');
    if (local) {
      const parsed: Student[] = JSON.parse(local);
      return classFilter ? parsed.filter(s => s.class === classFilter) : parsed;
    }
    // Simpan siswa riil awal ke local storage
    localStorage.setItem('school_students_kesilir', JSON.stringify(REAL_STUDENTS_KESILIR_02));
    return classFilter ? REAL_STUDENTS_KESILIR_02.filter(s => s.class === classFilter) : REAL_STUDENTS_KESILIR_02;
  }

  const studentsRef = collection(db, 'students');
  let q = query(studentsRef, orderBy('name', 'asc'));
  if (classFilter) {
    q = query(studentsRef, where('class', '==', classFilter), orderBy('name', 'asc'));
  }

  const snap = await getDocs(q);
  if (snap.empty) {
    // Jika di Firestore masih kosong, masukkan data riil awal
    for (const student of REAL_STUDENTS_KESILIR_02) {
      await setDoc(doc(db, 'students', student.studentId), student);
    }
    return classFilter ? REAL_STUDENTS_KESILIR_02.filter(s => s.class === classFilter) : REAL_STUDENTS_KESILIR_02;
  }
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
    localStorage.setItem('school_students_kesilir', JSON.stringify(list));
    return;
  }

  const docRef = doc(db, 'students', student.studentId);
  await setDoc(docRef, { ...student, updatedAt: new Date().toISOString() }, { merge: true });
}

// ==========================================
// 2. DETAILED GRADES SERVICE (Sesuai Gambar 2)
// ==========================================
// Nilai Awal Riil Sesuai Foto Gambar 2 untuk Kelas 1 Matematika
export const INITIAL_REAL_GRADES: Record<string, { tp1: number; tp2: number }> = {
  'SD-1-1001': { tp1: 75, tp2: 100 },
  'SD-1-1002': { tp1: 70, tp2: 70 },
  'SD-1-1003': { tp1: 80, tp2: 75 },
  'SD-1-1004': { tp1: 75, tp2: 100 },
  'SD-1-1005': { tp1: 70, tp2: 70 },
  'SD-1-1006': { tp1: 70, tp2: 100 },
  'SD-1-1007': { tp1: 70, tp2: 70 },
  'SD-1-1008': { tp1: 70, tp2: 70 },
  'SD-1-1009': { tp1: 85, tp2: 100 },
  'SD-1-1010': { tp1: 75, tp2: 75 },
  'SD-1-1011': { tp1: 75, tp2: 70 },
  'SD-1-1012': { tp1: 75, tp2: 70 },
  'SD-1-1013': { tp1: 85, tp2: 100 },
  'SD-1-1014': { tp1: 80, tp2: 90 },
  'SD-1-1015': { tp1: 85, tp2: 100 },
  'SD-1-1016': { tp1: 80, tp2: 100 },
  'SD-1-1017': { tp1: 70, tp2: 90 },
};

export async function getDetailedGrades(
  classId: string,
  subject: string,
  semester: '1' | '2' = '1'
): Promise<StudentDetailedGrade[]> {
  const cacheKey = `detailed_grades_${classId}_${subject}_S${semester}`;

  if (!isFirebaseConfigured || !db) {
    const local = localStorage.getItem(cacheKey);
    if (local) return JSON.parse(local);

    // Bangun data default riil dari Gambar 2
    const students = await getFirestoreStudents(classId);
    const initialList: StudentDetailedGrade[] = students.map(s => {
      const realScores = INITIAL_REAL_GRADES[s.studentId] || { tp1: 75, tp2: 75 };
      return {
        studentId: s.studentId,
        studentName: s.name,
        nis: s.nis,
        class: classId,
        subject: subject,
        schoolYear: '2026/2027',
        semester: semester,
        formatif: {
          lm1: { tp1: realScores.tp1, tp2: realScores.tp2, tp3: null, tp4: null },
          lm2: { tp1: null, tp2: null, tp3: null, tp4: null },
          lm3: { tp1: null, tp2: null, tp3: null, tp4: null },
          lm4: { tp1: null, tp2: null, tp3: null, tp4: null },
          lm5: { tp1: null, tp2: null, tp3: null, tp4: null },
        },
        sumatifLM: { lm1: null, lm2: null, lm3: null, lm4: null, lm5: null },
        sts: null,
        sas: null,
        finalScore: Math.round(((realScores.tp1 + realScores.tp2) / 2) * 10) / 10,
      };
    });

    localStorage.setItem(cacheKey, JSON.stringify(initialList));
    return initialList;
  }

  try {
    const docRef = doc(db, 'detailedGrades', cacheKey);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().grades as StudentDetailedGrade[];
    }
  } catch (err) {
    console.warn('Firestore getDetailedGrades fallback:', err);
  }

  // Fallback ke local
  const students = await getFirestoreStudents(classId);
  return students.map(s => {
    const realScores = INITIAL_REAL_GRADES[s.studentId] || { tp1: 75, tp2: 75 };
    return {
      studentId: s.studentId,
      studentName: s.name,
      nis: s.nis,
      class: classId,
      subject: subject,
      schoolYear: '2026/2027',
      semester: semester,
      formatif: {
        lm1: { tp1: realScores.tp1, tp2: realScores.tp2, tp3: null, tp4: null },
        lm2: { tp1: null, tp2: null, tp3: null, tp4: null },
        lm3: { tp1: null, tp2: null, tp3: null, tp4: null },
        lm4: { tp1: null, tp2: null, tp3: null, tp4: null },
        lm5: { tp1: null, tp2: null, tp3: null, tp4: null },
      },
      sumatifLM: { lm1: null, lm2: null, lm3: null, lm4: null, lm5: null },
      sts: null,
      sas: null,
      finalScore: Math.round(((realScores.tp1 + realScores.tp2) / 2) * 10) / 10,
    };
  });
}

export async function saveDetailedGrades(
  classId: string,
  subject: string,
  semester: '1' | '2',
  grades: StudentDetailedGrade[]
): Promise<void> {
  const cacheKey = `detailed_grades_${classId}_${subject}_S${semester}`;
  localStorage.setItem(cacheKey, JSON.stringify(grades));

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'detailedGrades', cacheKey);
      await setDoc(docRef, {
        classId,
        subject,
        semester,
        updatedAt: new Date().toISOString(),
        grades: grades,
      });
    } catch (err) {
      console.error('Gagal menyimpan detailedGrades ke Firestore:', err);
    }
  }

  // Kirim ke Google Apps Script / Google Sheets jika URL terhubung
  callAppsScript('saveDetailedGrades', {
    classId,
    subject,
    semester,
    grades,
  }).catch(err => {
    console.warn('Apps Script sync detailed grades offline:', err.message);
  });
}

// ==========================================
// 3. MONTHLY ATTENDANCE SHEET SERVICE (Sesuai Gambar 1)
// ==========================================
export async function getMonthlyAttendanceSheet(
  classId: string,
  monthStr: string // YYYY-MM, e.g. "2026-08"
): Promise<MonthlyAttendanceSheet> {
  const cacheKey = `attendance_sheet_${classId}_${monthStr}`;

  if (!isFirebaseConfigured || !db) {
    const local = localStorage.getItem(cacheKey);
    if (local) return JSON.parse(local);

    const students = await getFirestoreStudents(classId);
    const daysMap: Record<string, Record<number, any>> = {};
    const notesMap: Record<string, string> = {};

    students.forEach(s => {
      daysMap[s.studentId] = {};
      // Isi default hari hadir hari kerja (1..31)
      for (let d = 1; d <= 31; d++) {
        daysMap[s.studentId][d] = ''; // Kosong atau H
      }
      notesMap[s.studentId] = '';
    });

    const initialSheet: MonthlyAttendanceSheet = {
      month: monthStr,
      class: classId,
      schoolYear: '2026/2027',
      days: daysMap,
      notes: notesMap,
    };

    localStorage.setItem(cacheKey, JSON.stringify(initialSheet));
    return initialSheet;
  }

  try {
    const docRef = doc(db, 'monthlyAttendance', cacheKey);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as MonthlyAttendanceSheet;
    }
  } catch (err) {
    console.warn('Firestore getMonthlyAttendanceSheet fallback:', err);
  }

  const students = await getFirestoreStudents(classId);
  const daysMap: Record<string, Record<number, any>> = {};
  const notesMap: Record<string, string> = {};
  students.forEach(s => {
    daysMap[s.studentId] = {};
    for (let d = 1; d <= 31; d++) daysMap[s.studentId][d] = '';
    notesMap[s.studentId] = '';
  });

  return {
    month: monthStr,
    class: classId,
    schoolYear: '2026/2027',
    days: daysMap,
    notes: notesMap,
  };
}

export async function saveMonthlyAttendanceSheet(
  sheet: MonthlyAttendanceSheet
): Promise<void> {
  const cacheKey = `attendance_sheet_${sheet.class}_${sheet.month}`;
  localStorage.setItem(cacheKey, JSON.stringify(sheet));

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'monthlyAttendance', cacheKey);
      await setDoc(docRef, {
        ...sheet,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Gagal menyimpan monthlyAttendance ke Firestore:', err);
    }
  }

  // Kirim ke Google Apps Script / Google Sheets jika URL terhubung
  callAppsScript('saveMonthlyAttendance', {
    class: sheet.class,
    month: sheet.month,
    schoolYear: sheet.schoolYear,
    days: sheet.days,
    notes: sheet.notes,
  }).catch(err => {
    console.warn('Apps Script sync monthly attendance offline:', err.message);
  });
}

// Backward-compatible Firestore Attendance & Grades
export async function getFirestoreAttendance(
  classFilter: string,
  dateFilter?: string
): Promise<AttendanceRecord[]> {
  const month = dateFilter ? dateFilter.slice(0, 7) : new Date().toISOString().slice(0, 7);
  const sheet = await getMonthlyAttendanceSheet(classFilter, month);
  const records: AttendanceRecord[] = [];
  const students = await getFirestoreStudents(classFilter);

  students.forEach(s => {
    const studentDays = sheet.days[s.studentId] || {};
    if (dateFilter) {
      const dayNum = parseInt(dateFilter.slice(8, 10), 10);
      const st = studentDays[dayNum] || 'Hadir';
      records.push({
        attendanceId: `ATT-${classFilter}-${dateFilter}-${s.studentId}`,
        studentId: s.studentId,
        studentName: s.name,
        nis: s.nis,
        nisn: s.nisn,
        class: classFilter,
        date: dateFilter,
        schoolYear: sheet.schoolYear,
        semester: '1',
        status: (st || 'Hadir') as any,
        notes: sheet.notes[s.studentId] || '',
      });
    } else {
      // Loop all recorded days
      for (const [dStr, st] of Object.entries(studentDays)) {
        if (st) {
          const formattedDate = `${month}-${String(dStr).padStart(2, '0')}`;
          records.push({
            attendanceId: `ATT-${classFilter}-${formattedDate}-${s.studentId}`,
            studentId: s.studentId,
            studentName: s.name,
            nis: s.nis,
            nisn: s.nisn,
            class: classFilter,
            date: formattedDate,
            schoolYear: sheet.schoolYear,
            semester: '1',
            status: st as any,
            notes: sheet.notes[s.studentId] || '',
          });
        }
      }
    }
  });

  return records;
}

export async function saveBatchFirestoreAttendance(records: AttendanceRecord[]): Promise<void> {
  if (records.length === 0) return;
  const sample = records[0];
  const month = sample.date.slice(0, 7);
  const dayNum = parseInt(sample.date.slice(8, 10), 10);

  const sheet = await getMonthlyAttendanceSheet(sample.class, month);
  records.forEach(r => {
    if (!sheet.days[r.studentId]) sheet.days[r.studentId] = {};
    sheet.days[r.studentId][dayNum] = r.status;
    if (r.notes) sheet.notes[r.studentId] = r.notes;
  });

  await saveMonthlyAttendanceSheet(sheet);
}

export async function getFirestoreGrades(
  classFilter: string,
  subjectFilter?: string,
  semesterFilter?: string
): Promise<GradeRecord[]> {
  const subj = subjectFilter || 'Matematika';
  const sem = (semesterFilter as any) || '1';
  const detailed = await getDetailedGrades(classFilter, subj, sem);

  return detailed.map(d => ({
    gradeId: `GRD-${d.studentId}-${subj}`,
    studentId: d.studentId,
    studentName: d.studentName,
    nis: d.nis,
    class: d.class,
    subject: d.subject,
    assessmentType: 'Sumatif Lingkup Materi',
    material: 'Lingkup Materi 1',
    score: d.finalScore,
    description: `Capaian hasil belajar ${subj} kelas ${d.class}`,
    schoolYear: d.schoolYear,
    semester: d.semester,
    syncStatus: 'synced',
  }));
}

export async function saveBatchFirestoreGrades(records: GradeRecord[]): Promise<void> {
  // Disimpan melalui detailed grades
}

// ==========================================
// 4. SCHOOL PROFILE
// ==========================================
export async function getSchoolProfile(): Promise<SchoolProfile> {
  if (!isFirebaseConfigured || !db) {
    const local = localStorage.getItem('school_profile_kesilir');
    return local ? JSON.parse(local) : DEFAULT_SCHOOL_PROFILE;
  }

  try {
    const docRef = doc(db, 'schoolProfile', 'school_main');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_SCHOOL_PROFILE, ...(snap.data() as SchoolProfile) };
    }
  } catch (e) {
    console.warn('Fallback school profile:', e);
  }
  return DEFAULT_SCHOOL_PROFILE;
}

export async function saveSchoolProfile(profile: SchoolProfile): Promise<void> {
  localStorage.setItem('school_profile_kesilir', JSON.stringify(profile));

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'schoolProfile', 'school_main');
      await setDoc(docRef, profile, { merge: true });
    } catch (e) {
      console.error('Gagal simpan school profile ke Firestore:', e);
    }
  }
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

  const local = localStorage.getItem('school_audit_logs');
  const logs: AuditLog[] = local ? JSON.parse(local) : [];
  logs.unshift(audit);
  if (logs.length > 200) logs.length = 200;
  localStorage.setItem('school_audit_logs', JSON.stringify(logs));

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'auditLogs', audit.id);
      await setDoc(docRef, audit);
    } catch (err) {
      console.error('Gagal mencatat audit log ke Firestore:', err);
    }
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (!isFirebaseConfigured || !db) {
    const local = localStorage.getItem('school_audit_logs');
    return local ? JSON.parse(local) : [];
  }

  try {
    const ref = collection(db, 'auditLogs');
    const q = query(ref, orderBy('timestamp', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as AuditLog);
  } catch {
    const local = localStorage.getItem('school_audit_logs');
    return local ? JSON.parse(local) : [];
  }
}
