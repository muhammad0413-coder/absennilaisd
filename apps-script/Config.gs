/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: Config.gs
 * Pengaturan dan Konfigurasi Sistem Google Apps Script
 */

const CONFIG = {
  APP_NAME: 'Sistem Informasi Absensi dan Nilai SD',
  VERSION: '1.0.0',
  TIMEZONE: 'Asia/Jakarta',

  // Nama Sheet Master
  SHEETS: {
    STUDENTS: 'Data_Siswa',
    TEACHERS: 'Data_Guru',
    ATTENDANCE: 'Data_Absensi',
    GRADES: 'Data_Nilai',
    SETTINGS: 'Pengaturan',
    USERS: 'Pengguna',
    SYNC_LOGS: 'Log_Sinkronisasi',
    ACTIVITY_LOGS: 'Log_Aktivitas',
    SYNC_QUEUE: 'Antrean_Sinkronisasi',
    MONTHLY_ATTENDANCE: 'Rekap_Absensi_Bulanan',
    DETAILED_GRADES: 'Rincian_Nilai_Semester',
  },

  // Struktur Folder Google Drive
  DRIVE_FOLDERS: {
    ROOT: 'SISTEM INFORMASI SEKOLAH',
    TEACHER_PHOTOS: 'FOTO_GURU',
    STUDENT_PHOTOS: 'FOTO_SISWA',
    ATTENDANCE_REPORTS: 'LAPORAN_ABSENSI',
    GRADE_REPORTS: 'LAPORAN_NILAI',
    REPORT_CARDS: 'RAPOR',
    SEMESTER_ARCHIVE: 'ARSIP_SEMESTER',
    ADMIN_DOCS: 'DOKUMEN_ADMINISTRASI',
  },

  // Skrip Properties Keys
  PROPERTIES: {
    SPREADSHEET_ID: 'SPREADSHEET_ID',
    DRIVE_ROOT_FOLDER_ID: 'DRIVE_ROOT_FOLDER_ID',
    FIREBASE_PROJECT_ID: 'FIREBASE_PROJECT_ID',
    FIREBASE_API_KEY: 'FIREBASE_API_KEY',
    API_SECRET_KEY: 'API_SECRET_KEY',
  },

  // Batasan Upload
  UPLOAD_LIMITS: {
    MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
    MAX_DOC_SIZE_BYTES: 25 * 1024 * 1024, // 25MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_DOC_TYPES: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },

  // Lock Timeout (milliseconds)
  LOCK_TIMEOUT_MS: 30000,
};

/**
 * Mendapatkan nilai dari Script Properties
 */
function getProperty(key) {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty(key);
}

/**
 * Menyimpan konfigurasi ke Script Properties
 */
function setProperty(key, value) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(key, value);
}

/**
 * Mengambil Spreadsheet Master yang aktif
 * Mendukung pembukaan lewat SPREADSHEET_ID atau langsung dari spreadsheet aktif (Bound Script)
 */
function getSpreadsheet() {
  const sheetId = getProperty(CONFIG.PROPERTIES.SPREADSHEET_ID);
  if (sheetId && sheetId.trim() !== '') {
    try {
      return SpreadsheetApp.openById(sheetId.trim());
    } catch (e) {
      Logger.log('Gagal membuka spreadsheet via ID: ' + e.message);
    }
  }

  // ID Google Sheets Master SDN Kesilir 02
  const DEFAULT_SPREADSHEET_ID = '1OR9Ez_f1TUw_NS8Hlg3TLqB3ciZvu9cUWdcghyIPqAM';
  try {
    return SpreadsheetApp.openById(DEFAULT_SPREADSHEET_ID);
  } catch (e) {
    Logger.log('Gagal membuka spreadsheet default: ' + e.message);
  }

  // Jika skrip terikat langsung pada Google Sheet (Bound Script via Ekstensi > Apps Script)
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {
    // Standalone script
  }

  throw new Error('SPREADSHEET_ID tidak dapat ditemukan.');
}
