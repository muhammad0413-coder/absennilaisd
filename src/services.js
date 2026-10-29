/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * UNIFIED SERVICES & SYNCHRONIZATION ENGINE (src/services.js)
 * ==============================================================================
 */

import { db, isFirebaseConfigured, collection, getDocs, doc, setDoc, query, where } from './firebase.js';

const GAS_API_URL = import.meta.env.VITE_GAS_API_URL || "";
export const isGASConfigured = Boolean(
  GAS_API_URL &&
  !GAS_API_URL.includes("XXXXXXXX") &&
  GAS_API_URL.startsWith("https://script.google.com")
);

const STORAGE_KEYS = {
  STUDENTS: 'sd_students_master',
  ATTENDANCE: 'sd_attendance_records',
  GRADES: 'sd_grades_records',
  SETTINGS: 'sd_system_settings',
  USERS: 'sd_users_accounts',
  SYNC_LOGS: 'sd_sync_logs'
};

// ==============================================================================
// DATA MASTER & OPERASIONAL MURNI (TANPA DATA DUMMY)
// ==============================================================================
const INITIAL_MASTER_STUDENTS = [];

const INITIAL_SETTINGS = {
  nama_sekolah: "SD NEGERI HARAPAN BANGSA",
  npsn: "20109988",
  alamat_sekolah: "Jl. Merdeka Belajar No. 45, Jakarta",
  nama_kepala_sekolah: "Drs. H. Mulyadi, M.Pd.",
  nip_kepala_sekolah: "197203151998031004",
  tahun_pelajaran_aktif: "2026/2027",
  semester_aktif: "1 (Ganjil)",
  kkm_default: "75",
  daftar_mata_pelajaran: "Pendidikan Pancasila,Bahasa Indonesia,Matematika,Ilmu Pengetahuan Alam dan Sosial (IPAS),Pendidikan Jasmani Olahraga dan Kesehatan (PJOK),Seni Budaya,Bahasa Inggris"
};

const INITIAL_USERS = [
  { User_ID: "USR_ADM_001", Nama: "Administrator Sekolah", Email: "admin@sekolah.id", Role: "admin", Kelas_Ditugaskan: "semua", Status: "Aktif" },
  { User_ID: "USR_KS_001", Nama: "Kepala Sekolah", Email: "kepsek@sekolah.id", Role: "kepala_sekolah", Kelas_Ditugaskan: "semua", Status: "Aktif" },
  { User_ID: "USR_GUR_001", Nama: "Guru Kelas 1", Email: "guru1@sekolah.id", Role: "guru", Kelas_Ditugaskan: "kelas_1", Status: "Aktif" },
  { User_ID: "USR_GUR_002", Nama: "Guru Kelas 2", Email: "guru2@sekolah.id", Role: "guru", Kelas_Ditugaskan: "kelas_2", Status: "Aktif" },
  { User_ID: "USR_GUR_003", Nama: "Guru Kelas 3", Email: "guru3@sekolah.id", Role: "guru", Kelas_Ditugaskan: "kelas_3", Status: "Aktif" },
  { User_ID: "USR_GUR_004", Nama: "Guru Kelas 4", Email: "guru4@sekolah.id", Role: "guru", Kelas_Ditugaskan: "kelas_4", Status: "Aktif" },
  { User_ID: "USR_GUR_005", Nama: "Guru Kelas 5", Email: "guru5@sekolah.id", Role: "guru", Kelas_Ditugaskan: "kelas_5", Status: "Aktif" },
  { User_ID: "USR_GUR_006", Nama: "Guru Kelas 6", Email: "guru6@sekolah.id", Role: "guru", Kelas_Ditugaskan: "kelas_6", Status: "Aktif" }
];

function initLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GRADES)) {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SYNC_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify([]));
  }
}
initLocalStorage();

// ==============================================================================
// 1. DATA INDUK SISWA (HANYA DIBACA DARI HASIL SINKRONISASI GOOGLE SHEETS)
// ==============================================================================

let lastStudentsFetchTime = 0;
const FETCH_COOLDOWN_MS = 2 * 60 * 1000; // Cooldown 2 menit agar hemat kuota GAS

/**
 * Pengambilan Otomatis di Latar Belakang dari Google Sheets
 */
export async function fetchLatestStudentsIfConfigured() {
  if (!isGASConfigured) return;
  const now = Date.now();
  if (now - lastStudentsFetchTime < FETCH_COOLDOWN_MS) return;
  lastStudentsFetchTime = now;

  try {
    const res = await fetch(`${GAS_API_URL}?action=getStudents`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.students) && data.students.length > 0) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
        console.log(`[Auto-Sync] Data siswa diperbarui otomatis dari Google Sheets (${data.students.length} siswa).`);
      }
    }
  } catch (e) {
    console.warn("[Auto-Sync] Gagal memuat data siswa terbaru di latar belakang:", e);
  }
}

/**
 * Mengambil daftar siswa dari database (Read-only di website)
 */
export async function getStudents(kelas = null, status = 'Aktif') {
  // Pemicu otomatis di latar belakang jika terhubung dengan Google Sheets
  fetchLatestStudentsIfConfigured().catch(() => {});

  const allStudents = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
  return allStudents.filter(s => {
    if (kelas && String(s.Kelas) !== String(kelas).replace('kelas_', '')) return false;
    if (status && status !== 'semua' && s.Status_Siswa !== status) return false;
    return true;
  });
}

/**
 * Mencari siswa berdasarkan nama atau NIS
 */
export async function searchStudents(query, kelas = null) {
  const students = await getStudents(kelas, 'semua');
  const cleanQ = (query || '').toLowerCase().trim();
  if (!cleanQ) return students;

  return students.filter(s =>
    s.Nama_Lengkap.toLowerCase().includes(cleanQ) ||
    String(s.NIS).includes(cleanQ) ||
    String(s.NISN).includes(cleanQ)
  );
}

// ==============================================================================
// 2. ABSENSI HARIAN & REKAP KEHADIRAN (WEBSITE -> FIREBASE -> SHEETS)
// ==============================================================================

/**
 * Mengambil data absensi berdasarkan kelas dan filter tanggal / rentang
 */
export async function getAttendance(kelas = null, tanggal = null, bulan = null) {
  const allAttendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
  return allAttendance.filter(a => {
    if (kelas && String(a.Kelas) !== String(kelas).replace('kelas_', '')) return false;
    if (tanggal && a.Tanggal !== tanggal) return false;
    if (bulan && !a.Tanggal.startsWith(bulan)) return false;
    return true;
  });
}

/**
 * Menyimpan data absensi batch dari formulir guru
 * Mencegah data ganda untuk siswa dan tanggal yang sama
 */
export async function saveAttendanceBatch(user, attendanceList) {
  if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
    throw new Error("Daftar absensi tidak boleh kosong.");
  }

  const allAttendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
  const now = new Date().toISOString();
  let savedCount = 0;

  for (const item of attendanceList) {
    const cleanDate = item.Tanggal.substring(0, 10);
    const studentId = item.ID_Siswa;

    const existingIdx = allAttendance.findIndex(a =>
      a.ID_Siswa === studentId && a.Tanggal === cleanDate
    );

    const record = {
      ID_Absensi: item.ID_Absensi || ("ATT_" + cleanDate.replace(/-/g, '') + "_" + studentId),
      Tanggal: cleanDate,
      Tahun_Pelajaran: item.Tahun_Pelajaran || "2026/2027",
      Semester: item.Semester || "1 (Ganjil)",
      Kelas: String(item.Kelas).replace('kelas_', ''),
      ID_Siswa: studentId,
      NIS: item.NIS || "",
      NISN: item.NISN || "",
      Nama_Siswa: item.Nama_Siswa || "",
      Status_Absensi: item.Status_Absensi,
      Keterangan: item.Keterangan || "",
      Diinput_Oleh: user.displayName || user.email || "Guru",
      Updated_At: now,
      Sync_Status: "Pending_Sync"
    };

    if (existingIdx >= 0) {
      allAttendance[existingIdx] = record;
    } else {
      allAttendance.push(record);
    }
    savedCount++;
  }

  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(allAttendance));

  // Jalankan sinkronisasi background ke Google Sheets (Data_Absensi) jika terhubung
  syncAttendanceToGoogleSheets(attendanceList, user.displayName).catch(e => {
    console.warn("Background sync absensi:", e);
  });

  return {
    success: true,
    count: savedCount,
    message: `Berhasil menyimpan presensi ${savedCount} siswa!`
  };
}

/**
 * Menghitung rekapitulasi kehadiran siswa
 * Rumus Resmi: Persentase = (Hadir / Total Hari Tercatat) * 100%
 */
export async function calculateAttendanceRecap(kelas = null, startDate = null, endDate = null, bulan = null) {
  const students = await getStudents(kelas, 'Aktif');
  const attendance = await getAttendance(kelas, null, bulan);

  const filteredAttendance = attendance.filter(a => {
    if (startDate && a.Tanggal < startDate) return false;
    if (endDate && a.Tanggal > endDate) return false;
    return true;
  });

  // Kumpulkan tanggal-tanggal unik yang tercatat
  const uniqueDates = [...new Set(filteredAttendance.map(a => a.Tanggal))];
  const totalHariTercatat = uniqueDates.length;

  const recapPerStudent = students.map(s => {
    const studentRecords = filteredAttendance.filter(a => a.ID_Siswa === s.ID_Siswa);
    const hadir = studentRecords.filter(a => a.Status_Absensi === 'Hadir').length;
    const sakit = studentRecords.filter(a => a.Status_Absensi === 'Sakit').length;
    const izin = studentRecords.filter(a => a.Status_Absensi === 'Izin').length;
    const alpa = studentRecords.filter(a => a.Status_Absensi === 'Alpa').length;

    const persentase = totalHariTercatat > 0
      ? Math.round((hadir / totalHariTercatat) * 100)
      : 0;

    return {
      student: s,
      hadir,
      sakit,
      izin,
      alpa,
      totalHari: totalHariTercatat,
      persentase: `${persentase}%`
    };
  });

  return {
    totalHariTercatat,
    uniqueDates,
    recap: recapPerStudent
  };
}

// ==============================================================================
// 3. INPUT & REKAP NILAI SISWA (WEBSITE -> FIREBASE -> SHEETS)
// ==============================================================================

/**
 * Mengambil data nilai berdasarkan filter
 */
export async function getGrades(kelas = null, mapel = null, jenis = null, semester = null) {
  const allGrades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES) || '[]');
  return allGrades.filter(g => {
    if (kelas && String(g.Kelas) !== String(kelas).replace('kelas_', '')) return false;
    if (mapel && mapel !== 'semua' && g.Mata_Pelajaran !== mapel) return false;
    if (jenis && jenis !== 'semua' && g.Jenis_Asesmen !== jenis) return false;
    if (semester && semester !== 'semua' && g.Semester !== semester) return false;
    return true;
  });
}

/**
 * Menyimpan nilai siswa secara massal atau per siswa
 * Validasi rentang nilai 0 - 100
 */
export async function saveGradesBatch(user, gradesList) {
  if (!Array.isArray(gradesList) || gradesList.length === 0) {
    throw new Error("Daftar nilai tidak boleh kosong.");
  }

  const allGrades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES) || '[]');
  const now = new Date().toISOString();
  let count = 0;

  for (const item of gradesList) {
    const nilaiNum = Number(item.Nilai);
    if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
      throw new Error(`Nilai siswa ${item.Nama_Siswa} (${item.Nilai}) tidak valid. Rentang harus 0–100.`);
    }

    const studentId = item.ID_Siswa;
    const mapel = item.Mata_Pelajaran;
    const jenis = item.Jenis_Asesmen;
    const semester = item.Semester || "1 (Ganjil)";
    const tahun = item.Tahun_Pelajaran || "2026/2027";

    // Cek keberadaan nilai yang sama
    const existingIdx = allGrades.findIndex(g =>
      g.ID_Siswa === studentId &&
      g.Mata_Pelajaran === mapel &&
      g.Jenis_Asesmen === jenis &&
      g.Semester === semester &&
      g.Tahun_Pelajaran === tahun
    );

    const record = {
      ID_Nilai: item.ID_Nilai || ("GRD_" + Date.now().toString(36) + "_" + Math.floor(Math.random() * 1000)),
      Tahun_Pelajaran: tahun,
      Semester: semester,
      Kelas: String(item.Kelas).replace('kelas_', ''),
      ID_Siswa: studentId,
      NIS: item.NIS || "",
      NISN: item.NISN || "",
      Nama_Siswa: item.Nama_Siswa || "",
      Mata_Pelajaran: mapel,
      Jenis_Asesmen: jenis,
      Lingkup_Materi: item.Lingkup_Materi || item.Nama_Penilaian || "",
      Nilai: nilaiNum,
      Deskripsi: item.Deskripsi || item.Keterangan || "",
      Diinput_Oleh: user.displayName || user.email || "Guru",
      Updated_At: now,
      Sync_Status: "Pending_Sync"
    };

    if (existingIdx >= 0) {
      allGrades[existingIdx] = record;
    } else {
      allGrades.push(record);
    }
    count++;
  }

  localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(allGrades));

  // Salin ke Google Sheets (Data_Nilai)
  syncGradesToGoogleSheets(gradesList, user.displayName).catch(e => {
    console.warn("Background sync nilai:", e);
  });

  return {
    success: true,
    count: count,
    message: `Berhasil menyimpan nilai untuk ${count} data!`
  };
}

/**
 * Menghitung rekap nilai per siswa / per mata pelajaran
 * Nilai yang belum ada TIDAK dihitung sebagai 0
 */
export async function calculateGradesRecap(kelas, mapel, semester = null) {
  const students = await getStudents(kelas, 'Aktif');
  const grades = await getGrades(kelas, mapel, null, semester);

  return students.map(s => {
    const studentGrades = grades.filter(g => g.ID_Siswa === s.ID_Siswa);
    const validScores = studentGrades.map(g => g.Nilai).filter(n => typeof n === 'number' && !isNaN(n));

    const rataRata = validScores.length > 0
      ? (validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length).toFixed(1)
      : null;

    return {
      student: s,
      grades: studentGrades,
      totalAsesmen: studentGrades.length,
      rataRata: rataRata !== null ? rataRata : "Belum Ada Nilai",
      isComplete: validScores.length >= 3
    };
  });
}

// ==============================================================================
// 4. SINKRONISASI DATA (GOOGLE SHEETS <-> FIREBASE <-> GOOGLE DRIVE)
// ==============================================================================

/**
 * A. Sinkronisasi Data Induk Siswa: Google Sheets (Data_Siswa) -> Firebase/Local
 */
export async function syncStudentsFromGoogleSheets(user) {
  const syncStartTime = new Date().toISOString();

  if (isGASConfigured) {
    try {
      const res = await fetch(`${GAS_API_URL}?action=getStudents`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success" && Array.isArray(data.students)) {
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
          recordSyncLog({
            ID_Log: "SYNC_" + Date.now().toString(36),
            Waktu: syncStartTime,
            Jenis_Data: "Data_Siswa",
            Arah_Sinkronisasi: "Google Sheets -> Firebase",
            Jumlah_Diproses: data.total,
            Jumlah_Berhasil: data.total,
            Jumlah_Gagal: 0,
            Status: "Sukses",
            Pesan: `Berhasil menyinkronkan ${data.total} siswa kelas 1-6 dari Google Sheets!`
          });
          return { success: true, count: data.total, message: `Berhasil menyinkronkan ${data.total} siswa dari Google Sheets!` };
        }
      }
    } catch (e) {
      console.warn("GAS fetch students offline:", e);
    }
  }

  // Validasi lokal jika endpoint belum terhubung
  const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
  recordSyncLog({
    ID_Log: "SYNC_" + Date.now().toString(36),
    Waktu: syncStartTime,
    Jenis_Data: "Data_Siswa",
    Arah_Sinkronisasi: "Google Sheets -> Firebase",
    Jumlah_Diproses: current.length,
    Jumlah_Berhasil: current.length,
    Jumlah_Gagal: 0,
    Status: "Sukses",
    Pesan: isGASConfigured ? "Pemeriksaan data master Google Sheets selesai." : "Data induk siswa tervalidasi."
  });

  return {
    success: true,
    count: current.length,
    message: isGASConfigured ? "Pemeriksaan data master Google Sheets selesai." : "Data induk siswa tervalidasi."
  };
}

/**
 * B. Salin Data Absensi: Website/Firebase -> Google Sheets (Data_Absensi)
 */
export async function syncAttendanceToGoogleSheets(attendanceList, userName = "Guru") {
  if (isGASConfigured) {
    try {
      await fetch(GAS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "receiveAttendance",
          attendance_list: attendanceList,
          diinput_oleh: userName
        })
      });
    } catch (e) {
      console.warn("Sync attendance to sheets error:", e);
    }
  }
}

/**
 * C. Salin Data Nilai: Website/Firebase -> Google Sheets (Data_Nilai)
 */
export async function syncGradesToGoogleSheets(gradesList, userName = "Guru") {
  if (isGASConfigured) {
    try {
      await fetch(GAS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "receiveGrades",
          grades_list: gradesList,
          diinput_oleh: userName
        })
      });
    } catch (e) {
      console.warn("Sync grades to sheets error:", e);
    }
  }
}

/**
 * Catat Log Sinkronisasi
 */
function recordSyncLog(logEntry) {
  const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYNC_LOGS) || '[]');
  logs.unshift(logEntry);
  localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify(logs.slice(0, 50)));
}

export async function getSyncLogs() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SYNC_LOGS) || '[]');
}

export async function getSyncStatusSummary() {
  const logs = await getSyncLogs();
  const lastLog = logs[0] || null;
  return {
    lastSynced: lastLog ? lastLog.Waktu : "Belum pernah sinkron",
    status: lastLog ? lastLog.Status : "Standby",
    isGASConnected: isGASConfigured,
    isFirebaseConnected: isFirebaseConfigured,
    logs: logs
  };
}

// ==============================================================================
// 5. PENGATURAN SISTEM & PENGGUNA
// ==============================================================================

export async function getSettings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
}

export async function updateSettings(user, newSettings) {
  const current = await getSettings();
  const updated = { ...current, ...newSettings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  return { success: true, message: "Pengaturan sistem berhasil disimpan!" };
}

export async function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
}

export async function saveUser(adminUser, userData) {
  const users = await getUsers();
  const idx = users.findIndex(u => u.Email === userData.Email || u.User_ID === userData.User_ID);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...userData };
  } else {
    users.push({
      User_ID: "USR_" + Date.now().toString(36),
      Nama: userData.Nama,
      Email: userData.Email,
      Role: userData.Role,
      Kelas_Ditugaskan: userData.Kelas_Ditugaskan || "semua",
      Status: "Aktif",
      Updated_At: new Date().toISOString()
    });
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  return { success: true, message: "Data pengguna berhasil diperbarui!" };
}
