// ==========================================================================
// SISTEM INFORMASI ABSENSI DAN NILAI SDN KESILIR 02 KECAMATAN WULUHAN
// GOOGLE APPS SCRIPT - BUNDLE KODE LENGKAP SIAP PASANG
// ==========================================================================


// -------------------------------------------------------------
// FILE: apps-script\Config.gs
// -------------------------------------------------------------

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


// -------------------------------------------------------------
// FILE: apps-script\ValidationService.gs
// -------------------------------------------------------------

/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: ValidationService.gs
 * Validasi Skema Data, Masukan Pengguna, dan Konsistensi Nilai
 */

/**
 * Validasi data siswa sebelum disimpan
 */
function validateStudentInput(data) {
  if (!data) throw new Error('Data siswa tidak boleh kosong');

  if (!data.Nama_Lengkap || String(data.Nama_Lengkap).trim().length === 0) {
    throw new Error('Nama lengkap siswa wajib diisi');
  }

  const validClasses = ['1', '2', '3', '4', '5', '6'];
  if (!data.Kelas || !validClasses.includes(String(data.Kelas).trim())) {
    throw new Error('Kelas harus berupa angka 1 sampai 6');
  }

  const validGenders = ['Laki-laki', 'Perempuan', 'L', 'P'];
  if (data.Jenis_Kelamin && !validGenders.includes(String(data.Jenis_Kelamin).trim())) {
    throw new Error('Jenis kelamin harus Laki-laki atau Perempuan');
  }

  const validStatuses = ['Aktif', 'Pindah', 'Lulus', 'Nonaktif'];
  if (data.Status_Siswa && !validStatuses.includes(String(data.Status_Siswa).trim())) {
    throw new Error('Status siswa harus Aktif, Pindah, Lulus, atau Nonaktif');
  }

  return true;
}

/**
 * Validasi status absensi
 */
function validateAttendanceStatus(status) {
  const allowed = ['Hadir', 'Sakit', 'Izin', 'Alpa'];
  if (!allowed.includes(String(status).trim())) {
    throw new Error(`Status absensi '${status}' tidak valid. Harus: Hadir, Sakit, Izin, atau Alpa`);
  }
  return true;
}

/**
 * Validasi skor nilai (0-100)
 */
function validateScore(score) {
  if (score === '' || score === null || score === undefined) {
    return true; // Boleh kosong (belum dinilai)
  }
  const num = Number(score);
  if (isNaN(num) || num < 0 || num > 100) {
    throw new Error(`Nilai harus berupa angka antara 0 hingga 100. Diberikan: ${score}`);
  }
  return true;
}


// -------------------------------------------------------------
// FILE: apps-script\FirebaseService.gs
// -------------------------------------------------------------

/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: FirebaseService.gs
 * Integrasi Backend dengan Firebase Cloud Firestore REST API
 */

/**
 * Mendapatkan URL Firestore REST API untuk dokumen koleksi
 */
function getFirestoreUrl(collectionName, docId) {
  const projectId = getProperty(CONFIG.PROPERTIES.FIREBASE_PROJECT_ID);
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID belum diatur di Script Properties');
  }
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}`;
  return docId ? `${base}/${docId}` : base;
}

/**
 * Menulis atau memperbarui dokumen di Firestore melalui REST API
 */
function firestoreSetDocument(collectionName, docId, dataObject) {
  const apiKey = getProperty(CONFIG.PROPERTIES.FIREBASE_API_KEY);
  let url = getFirestoreUrl(collectionName, docId);
  if (apiKey) url += `?key=${apiKey}`;

  // Konversi objek JS ke format Firestore fields
  const firestoreFields = toFirestoreFields(dataObject);

  const options = {
    method: 'patch',
    contentType: 'application/json',
    payload: JSON.stringify({ fields: firestoreFields }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  if (code >= 200 && code < 300) {
    return JSON.parse(response.getContentText());
  } else {
    throw new Error(`Firestore Error [${code}]: ${response.getContentText()}`);
  }
}

/**
 * Konversi objek JS sederhana ke format value Firestore REST API
 */
function toFirestoreFields(obj) {
  const fields = {};
  for (const key in obj) {
    const val = obj[key];
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(item => ({ stringValue: String(item) })),
        },
      };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
    }
  }
  return fields;
}

/**
 * Memeriksa status koneksi ke Firebase Firestore
 */
function checkFirebaseConnection() {
  const projectId = getProperty(CONFIG.PROPERTIES.FIREBASE_PROJECT_ID);
  const apiKey = getProperty(CONFIG.PROPERTIES.FIREBASE_API_KEY);

  if (!projectId) {
    return {
      connected: false,
      status: 'BELUM_TERHUBUNG',
      message: 'FIREBASE_PROJECT_ID belum dikonfigurasi pada Script Properties.',
    };
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings?key=${apiKey || ''}`;
    const res = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
    const code = res.getResponseCode();

    if (code === 200 || code === 404 || code === 403) {
      // 200 = ok, 404 = koleksi belum ada dokumen (normal), 403 = rules aktif
      return {
        connected: true,
        status: 'TERHUBUNG',
        projectId: projectId,
        httpCode: code,
      };
    } else {
      return {
        connected: false,
        status: 'GAGAL',
        httpCode: code,
        message: res.getContentText(),
      };
    }
  } catch (err) {
    return {
      connected: false,
      status: 'ERROR',
      message: err.toString(),
    };
  }
}


// -------------------------------------------------------------
// FILE: apps-script\DriveService.gs
// -------------------------------------------------------------

/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: DriveService.gs
 * Pengelolaan Berkas, Folder Arsip Google Drive, dan Unggah Foto Profil
 */

/**
 * Membuat hierarki folder Google Drive untuk pengarsipan sekolah
 */
function initializeDriveFolders() {
  let rootFolder;
  const existingRootId = getProperty(CONFIG.PROPERTIES.DRIVE_ROOT_FOLDER_ID);

  if (existingRootId) {
    try {
      rootFolder = DriveApp.getFolderById(existingRootId);
    } catch (e) {
      rootFolder = null;
    }
  }

  if (!rootFolder) {
    const folders = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDERS.ROOT);
    if (folders.hasNext()) {
      rootFolder = folders.next();
    } else {
      rootFolder = DriveApp.createFolder(CONFIG.DRIVE_FOLDERS.ROOT);
    }
    setProperty(CONFIG.PROPERTIES.DRIVE_ROOT_FOLDER_ID, rootFolder.getId());
  }

  const subfolderMap = {};
  const folderNames = Object.values(CONFIG.DRIVE_FOLDERS).filter(name => name !== CONFIG.DRIVE_FOLDERS.ROOT);

  folderNames.forEach(folderName => {
    const existing = rootFolder.getFoldersByName(folderName);
    let subFolder;
    if (existing.hasNext()) {
      subFolder = existing.next();
    } else {
      subFolder = rootFolder.createFolder(folderName);
    }
    subfolderMap[folderName] = subFolder.getId();
  });

  return {
    rootFolderId: rootFolder.getId(),
    subfolders: subfolderMap,
  };
}

/**
 * Mendapatkan subfolder berdasarkan nama kategori
 */
function getTargetFolder(categoryName) {
  const foldersInfo = initializeDriveFolders();
  const folderId = foldersInfo.subfolders[categoryName] || foldersInfo.rootFolderId;
  return DriveApp.getFolderById(folderId);
}

/**
 * Unggah foto profil guru secara aman
 */
function uploadProfilePhotoService(payload, user) {
  if (!payload.fileBase64 || !payload.fileName) {
    throw new Error('Data file foto tidak lengkap');
  }

  const mimeType = payload.mimeType || 'image/jpeg';
  if (!CONFIG.UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    throw new Error('Tipe file tidak diizinkan. Gunakan JPG, PNG, atau WEBP.');
  }

  const bytes = Utilities.base64Decode(payload.fileBase64);
  if (bytes.length > CONFIG.UPLOAD_LIMITS.MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Ukuran foto melebihi batas maksimum 5MB');
  }

  const folder = getTargetFolder(CONFIG.DRIVE_FOLDERS.TEACHER_PHOTOS);
  const safeFileName = `FOTO_${(user.uid || 'GURU').replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().getTime()}.${mimeType.split('/')[1]}`;
  const blob = Utilities.newBlob(bytes, mimeType, safeFileName);
  const file = folder.createFile(blob);

  // Set file permissions: Viewable by anyone with link (agar avatar dapat dirender di web)
  // Folder tetap privat, hanya file foto profil guru yang diizinkan view
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const photoUrl = `https://drive.google.com/uc?id=${file.getId()}`;

  // Update profil guru di Sheet
  updateTeacherProfileService({ Foto_URL: photoUrl }, user);

  writeActivityLog(user, 'UPLOAD_FOTO', 'Foto_Profil', file.getId(), `Mengunggah foto profil baru: ${safeFileName}`);

  return {
    success: true,
    fileId: file.getId(),
    fileName: safeFileName,
    photoUrl: photoUrl,
    sizeBytes: bytes.length,
  };
}

/**
 * Menyimpan arsip dokumen (PDF Laporan, Rekap Excel, Rapor)
 */
function createArchiveService(payload, user) {
  if (!payload.fileBase64 || !payload.fileName) {
    throw new Error('Data berkas arsip tidak lengkap');
  }

  const mimeType = payload.mimeType || 'application/pdf';
  const bytes = Utilities.base64Decode(payload.fileBase64);
  if (bytes.length > CONFIG.UPLOAD_LIMITS.MAX_DOC_SIZE_BYTES) {
    throw new Error('Ukuran berkas melebihi batas 25MB');
  }

  // Tentukan folder tujuan berdasarkan kategori
  let folderCategory = CONFIG.DRIVE_FOLDERS.ADMIN_DOCS;
  if (payload.category === 'attendance') folderCategory = CONFIG.DRIVE_FOLDERS.ATTENDANCE_REPORTS;
  else if (payload.category === 'grades') folderCategory = CONFIG.DRIVE_FOLDERS.GRADE_REPORTS;
  else if (payload.category === 'report_card') folderCategory = CONFIG.DRIVE_FOLDERS.REPORT_CARDS;
  else if (payload.category === 'semester') folderCategory = CONFIG.DRIVE_FOLDERS.SEMESTER_ARCHIVE;

  const folder = getTargetFolder(folderCategory);
  const blob = Utilities.newBlob(bytes, mimeType, payload.fileName);
  const file = folder.createFile(blob);

  // Deskripsi metadata
  const description = `Diunggah oleh: ${user ? user.name : 'Sistem'} | Kategori: ${payload.category || '-'} | Waktu: ${new Date().toISOString()}`;
  file.setDescription(description);

  writeActivityLog(user, 'ARSIP_DOKUMEN', 'Drive_File', file.getId(), `Menyimpan arsip: ${payload.fileName}`);

  return {
    success: true,
    fileId: file.getId(),
    fileName: payload.fileName,
    viewUrl: file.getUrl(),
    downloadUrl: file.getDownloadUrl(),
  };
}


// -------------------------------------------------------------
// FILE: apps-script\SpreadsheetService.gs
// -------------------------------------------------------------

/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: SpreadsheetService.gs
 * Pengelolaan Lembar Kerja Google Sheets & Inisialisasi Database
 */

/**
 * Inisialisasi seluruh 9 Sheet dengan kolom-kolom yang diperlukan
 * Tidak menghapus data lama jika sheet sudah ada
 */
function initializeDatabase() {
  const ss = getSpreadsheet();
  const sheetsDef = [
    {
      name: CONFIG.SHEETS.STUDENTS,
      headers: [
        'ID_Siswa', 'NIS', 'NISN', 'Nama_Lengkap', 'Jenis_Kelamin',
        'Tempat_Lahir', 'Tanggal_Lahir', 'Nama_Orang_Tua', 'Alamat',
        'Kelas', 'Tahun_Pelajaran', 'Status_Siswa', 'Foto_URL',
        'Created_At', 'Updated_At', 'Updated_By', 'Sync_Status'
      ],
      colWidths: [150, 100, 120, 220, 110, 140, 120, 180, 250, 80, 120, 100, 180, 160, 160, 150, 110],
    },
    {
      name: CONFIG.SHEETS.TEACHERS,
      headers: [
        'User_ID', 'Nama_Guru', 'Email', 'NIP', 'Foto_URL',
        'Kelas_Ditugaskan', 'Role', 'Status', 'Created_At', 'Updated_At'
      ],
      colWidths: [150, 200, 200, 150, 180, 130, 100, 100, 160, 160],
    },
    {
      name: CONFIG.SHEETS.ATTENDANCE,
      headers: [
        'ID_Absensi', 'Tanggal', 'Tahun_Pelajaran', 'Semester', 'Kelas',
        'ID_Siswa', 'NIS', 'NISN', 'Nama_Siswa', 'Status_Absensi',
        'Keterangan', 'Diinput_Oleh', 'Updated_At', 'Sync_Status'
      ],
      colWidths: [160, 110, 120, 90, 80, 150, 100, 120, 220, 110, 180, 150, 160, 110],
    },
    {
      name: CONFIG.SHEETS.GRADES,
      headers: [
        'ID_Nilai', 'Tahun_Pelajaran', 'Semester', 'Kelas', 'ID_Siswa',
        'NIS', 'NISN', 'Nama_Siswa', 'Mata_Pelajaran', 'Jenis_Asesmen',
        'Lingkup_Materi', 'Nilai', 'Deskripsi', 'Diinput_Oleh', 'Updated_At', 'Sync_Status'
      ],
      colWidths: [160, 120, 90, 80, 150, 100, 120, 220, 160, 140, 180, 80, 240, 150, 160, 110],
    },
    {
      name: CONFIG.SHEETS.SETTINGS,
      headers: ['Nama_Pengaturan', 'Nilai_Pengaturan', 'Keterangan', 'Updated_At'],
      colWidths: [220, 300, 250, 160],
    },
    {
      name: CONFIG.SHEETS.USERS,
      headers: ['User_ID', 'Nama', 'Email', 'Password', 'Role', 'Kelas_Ditugaskan', 'Status', 'Updated_At'],
      colWidths: [150, 200, 220, 130, 100, 140, 100, 160],
    },
    {
      name: CONFIG.SHEETS.SYNC_LOGS,
      headers: ['ID_Log', 'Waktu', 'Jenis_Data', 'Arah_Sinkronisasi', 'Jumlah_Data', 'Berhasil', 'Gagal', 'Status', 'Pesan'],
      colWidths: [150, 160, 120, 140, 100, 90, 90, 100, 250],
    },
    {
      name: CONFIG.SHEETS.ACTIVITY_LOGS,
      headers: ['ID_Aktivitas', 'Waktu', 'User_ID', 'Nama_Pengguna', 'Aktivitas', 'Jenis_Data', 'ID_Data', 'Keterangan'],
      colWidths: [150, 160, 150, 180, 140, 120, 150, 250],
    },
    {
      name: CONFIG.SHEETS.SYNC_QUEUE,
      headers: ['ID_Transaksi', 'Jenis_Data', 'ID_Data', 'Operasi', 'Payload_JSON', 'Status', 'Percobaan', 'Pesan_Error', 'Created_At', 'Updated_At'],
      colWidths: [160, 120, 150, 100, 250, 100, 90, 200, 160, 160],
    },
    {
      name: CONFIG.SHEETS.MONTHLY_ATTENDANCE,
      headers: [
        'ID_Rekap', 'Tahun_Pelajaran', 'Bulan', 'Kelas', 'NO', 'NIS', 'Nama_Siswa',
        'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10',
        'D11', 'D12', 'D13', 'D14', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20',
        'D21', 'D22', 'D23', 'D24', 'D25', 'D26', 'D27', 'D28', 'D29', 'D30', 'D31',
        'Sakit', 'Izin', 'Alpa', 'Jumlah', 'Keterangan', 'Updated_At'
      ],
      colWidths: [150, 110, 90, 70, 50, 90, 220, ...Array(31).fill(35), 60, 60, 60, 60, 180, 160],
    },
    {
      name: CONFIG.SHEETS.DETAILED_GRADES,
      headers: [
        'ID_Rincian', 'Tahun_Pelajaran', 'Semester', 'Kelas', 'Mata_Pelajaran', 'NO_URUT', 'NO_INDUK', 'Nama_Siswa',
        'LM1_TP1', 'LM1_TP2', 'LM1_TP3', 'LM1_TP4',
        'LM2_TP1', 'LM2_TP2', 'LM2_TP3', 'LM2_TP4',
        'LM3_TP1', 'LM3_TP2', 'LM3_TP3', 'LM3_TP4',
        'LM4_TP1', 'LM4_TP2', 'LM4_TP3', 'LM4_TP4',
        'LM5_TP1', 'LM5_TP2', 'LM5_TP3', 'LM5_TP4',
        'Sumatif_LM1', 'Sumatif_LM2', 'Sumatif_LM3', 'Sumatif_LM4', 'Sumatif_LM5',
        'STS', 'SAS', 'Nilai_Akhir', 'Updated_At'
      ],
      colWidths: [160, 110, 80, 70, 130, 60, 80, 220, ...Array(20).fill(55), ...Array(5).fill(65), 65, 65, 80, 160],
    },
  ];

  const results = [];

  sheetsDef.forEach((def) => {
    let sheet = ss.getSheetByName(def.name);
    let created = false;
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      created = true;
    }

    // Periksa apakah baris pertama kosong
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      sheet.appendRow(def.headers);

      // Styling Header: Navy Background, White Bold Text
      const headerRange = sheet.getRange(1, 1, 1, def.headers.length);
      headerRange.setBackground('#0F2B5C');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      headerRange.setFontFamily('Inter');
      sheet.setFrozenRows(1);

      // Set lebar kolom
      def.colWidths.forEach((width, idx) => {
        sheet.setColumnWidth(idx + 1, width);
      });
    }

    results.push({ name: def.name, status: created ? 'Dibuat baru' : 'Sudah ada' });
  });

  // Seed Data Master Riil SDN Kesilir 02 & Pengguna jika baru/kosong
  seedInitialSchoolData(ss);

  return results;
}

/**
 * Membaca data dari sheet sebagai daftar objek JavaScript
 */
function readSheetData(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet ${sheetName} tidak ditemukan`);

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return []; // Hanya header atau kosong

  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0];
  const items = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    // Abaikan jika baris kosong sepenuhnya
    if (row.every(cell => cell === '' || cell === null)) continue;

    const item = {};
    headers.forEach((header, c) => {
      let val = row[c];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
      }
      item[header] = val;
    });
    items.push(item);
  }

  return items;
}

/**
 * Menambahkan atau mengupdate baris berdasarkan kolom ID dengan LockService
 */
function upsertRow(sheetName, idColumnName, idValue, rowObject) {
  const lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);

  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet ${sheetName} tidak ditemukan`);

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const idColIdx = headers.indexOf(idColumnName);

    if (idColIdx === -1) {
      throw new Error(`Kolom ID ${idColumnName} tidak ditemukan di sheet ${sheetName}`);
    }

    let targetRowIndex = -1;
    if (lastRow > 1) {
      const idValues = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < idValues.length; i++) {
        if (String(idValues[i][0]).trim() === String(idValue).trim()) {
          targetRowIndex = i + 2;
          break;
        }
      }
    }

    // Bangun baris data sesuai urutan header
    const rowData = headers.map(header => {
      return rowObject[header] !== undefined ? rowObject[header] : '';
    });

    if (targetRowIndex > 0) {
      sheet.getRange(targetRowIndex, 1, 1, headers.length).setValues([rowData]);
      return { operation: 'updated', rowIndex: targetRowIndex };
    } else {
      sheet.appendRow(rowData);
      return { operation: 'inserted', rowIndex: sheet.getLastRow() };
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * Inisialisasi Data Master Awal SDN Kesilir 02 & Akun Pengguna
 */
function seedInitialSchoolData(ss) {
  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

  // 1. Inisialisasi Akun Pengguna di Sheet 'Pengguna'
  const userSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (userSheet && userSheet.getLastRow() <= 1) {
    const defaultUsers = [
      ['usr_admin_kesilir', 'Administrator SDN Kesilir 02', 'admin@sdnkesilir02.sch.id', 'admin123', 'admin', '1,2,3,4,5,6', 'Aktif', now],
      ['usr_guru1_suci', 'Suci Ayu Ningrum, S.Pd', 'suci@sdnkesilir02.sch.id', 'guru123', 'guru', '1', 'Aktif', now],
      ['usr_kepsek_abdullah', 'Abdullah Mahsar, S.Pd', 'abdullah@sdnkesilir02.sch.id', 'kepsek123', 'kepsek', '1,2,3,4,5,6', 'Aktif', now],
    ];
    userSheet.getRange(2, 1, defaultUsers.length, defaultUsers[0].length).setValues(defaultUsers);
  }

  // 2. Inisialisasi 17 Data Siswa Riil Kelas 1 SDN Kesilir 02
  const studentSheet = ss.getSheetByName(CONFIG.SHEETS.STUDENTS);
  if (studentSheet && studentSheet.getLastRow() <= 1) {
    const studentRows = [
      ['SD-1-1001', '1001', '0182345001', 'ADREENA FARESTA HADIONO', 'Perempuan', 'Jember', '2019-02-14', 'Hadiono', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1002', '1002', '0182345002', 'AKSEL DELLAN MAURIZ', 'Laki-laki', 'Jember', '2019-05-20', 'Mauriz', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1003', '1003', '0182345003', 'ALJAZ ALZAM PUTRA SUSILO', 'Laki-laki', 'Jember', '2019-03-10', 'Susilo', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1004', '1004', '0182345004', 'ALYONA PUTRI BELINDA', 'Perempuan', 'Jember', '2019-07-22', 'Belinda', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1005', '1005', '0182345005', 'ANDARA ARSY SYAHILA', 'Perempuan', 'Jember', '2019-01-18', 'Syahila', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1006', '1006', '0182345006', 'APRILIA NURIANAH', 'Perempuan', 'Jember', '2019-04-12', 'Nurianah', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1007', '1007', '0182345007', 'AQILA ZALFA PRASETYO', 'Perempuan', 'Jember', '2019-06-30', 'Prasetyo', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1008', '1008', '0182345008', 'DELVITA ALMADILATUS SHOLIKAH', 'Perempuan', 'Jember', '2019-09-05', 'Sholikah', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1009', '1009', '0182345009', 'KANIYA ARSYILA ZHAFIRA', 'Perempuan', 'Jember', '2019-11-14', 'Zhafira', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1010', '1010', '0182345010', 'KEVIN MELVIANO PUTRA', 'Laki-laki', 'Jember', '2019-04-03', 'Melviano', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1011', '1011', '0182345011', 'MUHAMMAD LUQMAN HAKIM', 'Laki-laki', 'Jember', '2019-08-11', 'Hakim', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1012', '1012', '0182345012', 'MUHAMMAD RAFKA ALDEBARAN PRAMANA', 'Laki-laki', 'Jember', '2019-10-15', 'Pramana', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1013', '1013', '0182345013', 'NABILLA KHANAYA PUTRI PRANATA', 'Perempuan', 'Jember', '2019-12-01', 'Pranata', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1014', '1014', '0182345014', 'PUTRI AYLEN NATHANIA', 'Perempuan', 'Jember', '2019-02-28', 'Nathania', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1015', '1015', '0182345015', 'SYADDAD AISY AL BUKHORY', 'Laki-laki', 'Jember', '2019-07-07', 'Bukhory', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1016', '1016', '0182345016', 'SYAFIRA PUTRI HAFIDZAH', 'Perempuan', 'Jember', '2019-05-19', 'Hafidzah', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
      ['SD-1-1017', '1017', '0182345017', 'ZAHRATUL MEI ANANTA', 'Perempuan', 'Jember', '2019-05-27', 'Ananta', 'Kesilir, Wuluhan, Jember', '1', '2026/2027', 'Aktif', '', now, now, 'Sistem', 'synced'],
    ];
    studentSheet.getRange(2, 1, studentRows.length, studentRows[0].length).setValues(studentRows);
  }

  // 3. Inisialisasi Data Guru
  const teacherSheet = ss.getSheetByName(CONFIG.SHEETS.TEACHERS);
  if (teacherSheet && teacherSheet.getLastRow() <= 1) {
    const teacherRows = [
      ['usr_guru1_suci', 'Suci Ayu Ningrum, S.Pd', 'suci@sdnkesilir02.sch.id', '199410142023212000', '', '1', 'guru', 'Aktif', now, now],
      ['usr_kepsek_abdullah', 'Abdullah Mahsar, S.Pd', 'abdullah@sdnkesilir02.sch.id', '198306012014121000', '', '1,2,3,4,5,6', 'kepsek', 'Aktif', now, now],
    ];
    teacherSheet.getRange(2, 1, teacherRows.length, teacherRows[0].length).setValues(teacherRows);
  }
}

/**
 * Menyimpan Rincian Nilai Semester (Format Gambar 2) ke Google Sheets
 */
function saveDetailedGradesService(payload, user) {
  const classId = String(payload.classId || payload.class || '1').trim();
  const subject = String(payload.subject || 'Matematika').trim();
  const semester = String(payload.semester || '1').trim();
  const grades = payload.grades || [];

  if (!Array.isArray(grades) || grades.length === 0) {
    throw new Error('Data rincian nilai kosong');
  }

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  let saved = 0;

  grades.forEach((g, idx) => {
    const studentId = g.studentId;
    const rincianId = `DTL-GRD-${classId}-S${semester}-${subject.replace(/\s+/g, '_')}-${studentId}`;

    const row = {
      ID_Rincian: rincianId,
      Tahun_Pelajaran: g.schoolYear || '2026/2027',
      Semester: semester,
      Kelas: classId,
      Mata_Pelajaran: subject,
      NO_URUT: idx + 1,
      NO_INDUK: g.nis || '',
      Nama_Siswa: g.studentName || '',
      LM1_TP1: g.formatif?.lm1?.tp1 ?? '',
      LM1_TP2: g.formatif?.lm1?.tp2 ?? '',
      LM1_TP3: g.formatif?.lm1?.tp3 ?? '',
      LM1_TP4: g.formatif?.lm1?.tp4 ?? '',
      LM2_TP1: g.formatif?.lm2?.tp1 ?? '',
      LM2_TP2: g.formatif?.lm2?.tp2 ?? '',
      LM2_TP3: g.formatif?.lm2?.tp3 ?? '',
      LM2_TP4: g.formatif?.lm2?.tp4 ?? '',
      LM3_TP1: g.formatif?.lm3?.tp1 ?? '',
      LM3_TP2: g.formatif?.lm3?.tp2 ?? '',
      LM3_TP3: g.formatif?.lm3?.tp3 ?? '',
      LM3_TP4: g.formatif?.lm3?.tp4 ?? '',
      LM4_TP1: g.formatif?.lm4?.tp1 ?? '',
      LM4_TP2: g.formatif?.lm4?.tp2 ?? '',
      LM4_TP3: g.formatif?.lm4?.tp3 ?? '',
      LM4_TP4: g.formatif?.lm4?.tp4 ?? '',
      LM5_TP1: g.formatif?.lm5?.tp1 ?? '',
      LM5_TP2: g.formatif?.lm5?.tp2 ?? '',
      LM5_TP3: g.formatif?.lm5?.tp3 ?? '',
      LM5_TP4: g.formatif?.lm5?.tp4 ?? '',
      Sumatif_LM1: g.sumatifLM?.lm1 ?? '',
      Sumatif_LM2: g.sumatifLM?.lm2 ?? '',
      Sumatif_LM3: g.sumatifLM?.lm3 ?? '',
      Sumatif_LM4: g.sumatifLM?.lm4 ?? '',
      Sumatif_LM5: g.sumatifLM?.lm5 ?? '',
      STS: g.sts ?? '',
      SAS: g.sas ?? '',
      Nilai_Akhir: g.finalScore ?? '',
      Updated_At: now,
    };

    upsertRow(CONFIG.SHEETS.DETAILED_GRADES, 'ID_Rincian', rincianId, row);
    saved++;
  });

  // Sambungkan langsung sinkronisasi ke Firebase Firestore jika FIREBASE_PROJECT_ID aktif
  try {
    const cacheKey = `detailed_grades_${classId}_${subject}_S${semester}`;
    firestoreSetDocument('detailedGrades', cacheKey, {
      classId: classId,
      subject: subject,
      semester: semester,
      updatedAt: now,
      grades: grades,
    });
  } catch (fbErr) {
    Logger.log('Sinkronisasi Firestore dilewati / konfigurasi belum diisi: ' + fbErr.message);
  }

  writeActivityLog(user, 'SIMPAN_RINCIAN_NILAI', 'Nilai', `${classId} - ${subject}`, `Menyimpan ${saved} nilai siswa`);
  return { success: true, count: saved };
}

/**
 * Menyimpan Rekap Absensi Bulanan (Format Gambar 1) ke Google Sheets
 */
function saveMonthlyAttendanceService(payload, user) {
  const classId = String(payload.class || payload.classId || '1').trim();
  const month = String(payload.month || new Date().toISOString().slice(0, 7)).trim();
  const schoolYear = String(payload.schoolYear || '2026/2027').trim();
  const days = payload.days || {};
  const notes = payload.notes || {};
  const students = readSheetData(CONFIG.SHEETS.STUDENTS).filter(s => String(s.Kelas) === classId);

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  let saved = 0;

  students.forEach((s, idx) => {
    const studentId = s.ID_Siswa;
    const rekapId = `ATT-MNTH-${classId}-${month}-${studentId}`;
    const studentDays = days[studentId] || {};

    let sCount = 0;
    let iCount = 0;
    let aCount = 0;

    const row = {
      ID_Rekap: rekapId,
      Tahun_Pelajaran: schoolYear,
      Bulan: month,
      Kelas: classId,
      NO: idx + 1,
      NIS: s.NIS || '',
      Nama_Siswa: s.Nama_Lengkap || '',
      Keterangan: notes[studentId] || '',
      Updated_At: now,
    };

    for (let d = 1; d <= 31; d++) {
      const val = studentDays[d] || '';
      row[`D${d}`] = val;
      const vUpper = String(val).toUpperCase();
      if (vUpper === 'S') sCount++;
      else if (vUpper === 'I') iCount++;
      else if (vUpper === 'A') aCount++;
    }

    row['Sakit'] = sCount;
    row['Izin'] = iCount;
    row['Alpa'] = aCount;
    row['Jumlah'] = sCount + iCount + aCount;

    upsertRow(CONFIG.SHEETS.MONTHLY_ATTENDANCE, 'ID_Rekap', rekapId, row);
    saved++;
  });

  // Sambungkan langsung sinkronisasi ke Firebase Firestore jika FIREBASE_PROJECT_ID aktif
  try {
    const cacheKey = `attendance_sheet_${classId}_${month}`;
    firestoreSetDocument('monthlyAttendance', cacheKey, {
      month: month,
      class: classId,
      schoolYear: schoolYear,
      days: days,
      notes: notes,
      updatedAt: now,
    });
  } catch (fbErr) {
    Logger.log('Sinkronisasi Firestore dilewati: ' + fbErr.message);
  }

  writeActivityLog(user, 'SIMPAN_ABSEN_BULANAN', 'Absensi', `${classId} - ${month}`, `Menyimpan rekap absensi ${saved} siswa`);
  return { success: true, count: saved };
}


// -------------------------------------------------------------
// FILE: apps-script\LogService.gs
// -------------------------------------------------------------

/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: LogService.gs
 * Pencatatan Riwayat Sinkronisasi, Log Aktivitas Audit, dan Manajemen Profil Guru
 */

/**
 * Mencatat log sinkronisasi
 */
function writeSyncLog(dataType, direction, total, success, failed, status, message) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.SYNC_LOGS);
    if (!sheet) return;

    const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    const logId = 'LOG-' + Utilities.getUuid().substring(0, 8);

    sheet.appendRow([
      logId,
      now,
      dataType,
      direction,
      total,
      success,
      failed,
      status,
      message,
    ]);
  } catch (err) {
    Logger.log('Gagal menulis Sync Log: ' + err.message);
  }
}

/**
 * Mencatat aktivitas pengguna untuk audit trail
 */
function writeActivityLog(user, activity, dataType, dataId, details) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVITY_LOGS);
    if (!sheet) return;

    const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    const actId = 'ACT-' + Utilities.getUuid().substring(0, 8);
    const userId = user ? (user.uid || user.email) : 'SISTEM';
    const userName = user ? (user.name || user.email) : 'Sistem';

    sheet.appendRow([
      actId,
      now,
      userId,
      userName,
      activity,
      dataType,
      dataId,
      details,
    ]);
  } catch (err) {
    Logger.log('Gagal menulis Activity Log: ' + err.message);
  }
}

/**
 * Mengambil profil guru berdasarkan Email
 */
function getUserProfileByEmail(email) {
  if (!email) return null;
  const users = readSheetData(CONFIG.SHEETS.USERS);
  const target = users.find(u => String(u.Email).toLowerCase() === String(email).toLowerCase());
  if (target) {
    return {
      uid: target.User_ID,
      nama: target.Nama,
      email: target.Email,
      role: target.Role,
      kelasDitugaskan: target.Kelas_Ditugaskan,
      status: target.Status,
    };
  }
  return null;
}

/**
 * Memperbarui profil guru (hanya milik sendiri)
 */
function updateTeacherProfileService(payload, user) {
  if (!user) throw new Error('Pengguna tidak terautentikasi');

  const teachers = readSheetData(CONFIG.SHEETS.TEACHERS);
  const current = teachers.find(t => t.Email === user.email || t.User_ID === user.uid);

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const teacherId = current ? current.User_ID : (user.uid || Utilities.getUuid().substring(0, 8));

  const updatedTeacher = {
    User_ID: teacherId,
    Nama_Guru: payload.Nama_Guru || (current ? current.Nama_Guru : user.name),
    Email: user.email,
    NIP: payload.NIP || (current ? current.NIP : ''),
    Foto_URL: payload.Foto_URL || (current ? current.Foto_URL : ''),
    Kelas_Ditugaskan: current ? current.Kelas_Ditugaskan : (user.assignedClasses ? user.assignedClasses.join(',') : ''),
    Role: current ? current.Role : (user.role || ROLES.TEACHER),
    Status: current ? current.Status : 'Aktif',
    Created_At: current ? current.Created_At : now,
    Updated_At: now,
  };

  upsertRow(CONFIG.SHEETS.TEACHERS, 'User_ID', teacherId, updatedTeacher);

  // Perbarui juga di Sheet Pengguna
  const userRow = {
    User_ID: teacherId,
    Nama: updatedTeacher.Nama_Guru,
    Email: user.email,
    Role: updatedTeacher.Role,
    Kelas_Ditugaskan: updatedTeacher.Kelas_Ditugaskan,
    Status: updatedTeacher.Status,
    Updated_At: now,
  };
  upsertRow(CONFIG.SHEETS.USERS, 'User_ID', teacherId, userRow);

  return { success: true, teacher: updatedTeacher };
}

/**
 * Mengambil daftar seluruh pengguna (Admin Only)
 */
function getUsersService(user) {
  if (user.role !== ROLES.ADMIN) {
    throw new Error('Hanya administrator yang diizinkan mengakses data seluruh pengguna');
  }
  return readSheetData(CONFIG.SHEETS.USERS);
}

/**
 * Menyimpan pengguna baru atau update (Admin Only)
 */
function saveUserService(payload, user) {
  if (user.role !== ROLES.ADMIN) {
    throw new Error('Hanya administrator yang diizinkan mengelola akun pengguna');
  }

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const userId = payload.User_ID || Utilities.getUuid().substring(0, 8);

  const existingUsers = readSheetData(CONFIG.SHEETS.USERS);
  const existing = existingUsers.find(u => u.User_ID === userId || u.Email === payload.Email);

  const row = {
    User_ID: userId,
    Nama: payload.Nama,
    Email: payload.Email,
    Password: payload.Password || (existing ? existing.Password : '123456'),
    Role: payload.Role,
    Kelas_Ditugaskan: payload.Kelas_Ditugaskan || '',
    Status: payload.Status || 'Aktif',
    Updated_At: now,
  };

  upsertRow(CONFIG.SHEETS.USERS, 'User_ID', userId, row);
  writeActivityLog(user, 'SIMPAN_USER', 'Pengguna', userId, `Menyimpan akun pengguna: ${payload.Email} (Role: ${payload.Role})`);

  return { success: true, user: row };
}


// -------------------------------------------------------------
// FILE: apps-script\Authentication.gs
// -------------------------------------------------------------

/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: Authentication.gs
 * Keamanan, Verifikasi Token Firebase, dan Role-Based Access Control (RBAC)
 */

const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'guru',
  PRINCIPAL: 'kepsek',
};

/**
 * Memvalidasi kredensial request (Token Firebase atau API Secret Key)
 * @param {Object} headers Request headers atau payload
 * @return {Object} { isValid: boolean, user: Object|null, error: string|null }
 */
function authenticateRequest(authHeader, apiSecretHeader) {
  // 1. Cek bypass dengan API Secret Key (Digunakan untuk sinkronisasi server-to-server)
  const configuredSecret = getProperty(CONFIG.PROPERTIES.API_SECRET_KEY);
  if (configuredSecret && apiSecretHeader && apiSecretHeader === configuredSecret) {
    return {
      isValid: true,
      authType: 'API_SECRET',
      user: {
        uid: 'SYSTEM_SYNC_ADMIN',
        email: 'system@sekolah.sch.id',
        role: ROLES.ADMIN,
        name: 'System Sync Service',
      },
    };
  }

  // 2. Cek Firebase ID Token jika diberikan
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.substring(7);
    const verification = verifyFirebaseIdToken(idToken);
    if (verification.isValid) {
      // Ambil detail role pengguna dari database lokal/Spreadsheet untuk mencegah spoofing role
      const userProfile = getUserProfileByEmail(verification.user.email);
      if (userProfile && userProfile.status === 'Aktif') {
        return {
          isValid: true,
          authType: 'FIREBASE_TOKEN',
          user: {
            uid: verification.user.localId || verification.user.uid,
            email: verification.user.email,
            name: userProfile.nama || verification.user.displayName,
            role: userProfile.role || ROLES.TEACHER,
            assignedClasses: userProfile.kelasDitugaskan ? String(userProfile.kelasDitugaskan).split(',').map(s => s.trim()) : [],
          },
        };
      } else if (!userProfile) {
        // Fallback jika user belum ada di sheet tetapi token valid dari Firebase Auth
        return {
          isValid: true,
          authType: 'FIREBASE_TOKEN_NEW',
          user: {
            uid: verification.user.localId || verification.user.uid,
            email: verification.user.email,
            name: verification.user.displayName || 'Pengguna',
            role: ROLES.TEACHER,
            assignedClasses: [],
          },
        };
      } else {
        return { isValid: false, error: 'Akun dinonaktifkan oleh administrator.' };
      }
    } else {
      return { isValid: false, error: 'Token autentikasi tidak valid atau sudah kedaluwarsa: ' + verification.error };
    }
  }

  return { isValid: false, error: 'Autentikasi gagal: Token Bearer atau API Secret tidak ditemukan.' };
}

/**
 * Memverifikasi Firebase ID Token melalui Google Identity Toolkit REST API
 */
function verifyFirebaseIdToken(idToken) {
  const firebaseApiKey = getProperty(CONFIG.PROPERTIES.FIREBASE_API_KEY);
  if (!firebaseApiKey) {
    // Mode dev/toleran jika belum diisi API key
    return { isValid: true, user: { email: 'admin@sekolah.sch.id', uid: 'admin_dev' } };
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`;
  const payload = { idToken: idToken };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const responseCode = response.getResponseCode();
    const result = JSON.parse(response.getContentText());

    if (responseCode === 200 && result.users && result.users.length > 0) {
      return { isValid: true, user: result.users[0] };
    } else {
      const errorMsg = result.error ? result.error.message : 'Unknown verification error';
      return { isValid: false, error: errorMsg };
    }
  } catch (err) {
    return { isValid: false, error: err.toString() };
  }
}

/**
 * Memastikan pengguna memiliki izin untuk memodifikasi kelas tertentu
 */
function authorizeClassAccess(user, targetClass) {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true; // Admin punya hak akses ke semua kelas 1-6
  if (user.role === ROLES.TEACHER) {
    if (!targetClass) return false;
    const target = String(targetClass).trim();
    return user.assignedClasses && user.assignedClasses.includes(target);
  }
  return false;
}

/**
 * Melakukan autentikasi langsung menggunakan Email/Username dan Password dari Google Sheets
 * Memungkinkan Guru dan Pengguna baru dibuat atau diubah langsung di Google Sheet 'Pengguna'
 */
function authenticateUserService(payload) {
  if (!payload) throw new Error('Data login tidak boleh kosong');
  const loginKey = String(payload.email || payload.username || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();

  if (!loginKey) throw new Error('Email atau nama pengguna wajib diisi');
  if (!password) throw new Error('Kata sandi wajib diisi');

  const ss = getSpreadsheet();
  let userSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (!userSheet || userSheet.getLastRow() <= 1) {
    initializeDatabase();
  }

  const users = readSheetData(CONFIG.SHEETS.USERS);
  const matched = users.find(u => {
    const email = String(u.Email || '').trim().toLowerCase();
    const uid = String(u.User_ID || '').trim().toLowerCase();
    const prefix = email.split('@')[0];
    return email === loginKey || uid === loginKey || prefix === loginKey;
  });

  if (!matched) {
    throw new Error('Akun tidak ditemukan. Pastikan akun sudah didaftarkan pada sheet Pengguna di Google Sheets.');
  }

  if (String(matched.Status || '').toLowerCase() === 'nonaktif') {
    throw new Error('Akun Anda dinonaktifkan oleh Administrator.');
  }

  const storedPass = String(matched.Password || '').trim();
  if (storedPass && storedPass !== password) {
    throw new Error('Kata sandi yang Anda masukkan salah. Periksa kolom Password pada sheet Pengguna di Google Sheets.');
  }

  const assignedClasses = matched.Kelas_Ditugaskan
    ? String(matched.Kelas_Ditugaskan).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const userProfile = {
    uid: matched.User_ID,
    name: matched.Nama,
    email: matched.Email,
    role: matched.Role || ROLES.TEACHER,
    assignedClasses: assignedClasses,
    active: true,
  };

  writeActivityLog(userProfile, 'LOGIN', 'Pengguna', matched.User_ID, 'Login berhasil melalui web');

  return { user: userProfile };
}


// -------------------------------------------------------------
// FILE: apps-script\StudentService.gs
// -------------------------------------------------------------

/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: StudentService.gs
 * Manajemen Data Siswa (CRUD, Validasi, dan Otorisasi Kelas)
 */

/**
 * Mendapatkan daftar siswa
 * @param {Object} filters { class, status, schoolYear }
 * @param {Object} user User yang sedang login
 */
function getStudentsService(filters, user) {
  const allStudents = readSheetData(CONFIG.SHEETS.STUDENTS);

  return allStudents.filter(s => {
    // 1. Otorisasi Peran: Guru hanya dapat melihat kelas binaannya
    if (user && user.role === ROLES.TEACHER) {
      if (!user.assignedClasses || !user.assignedClasses.includes(String(s.Kelas).trim())) {
        return false;
      }
    }

    // 2. Filter opsional
    if (filters) {
      if (filters.class && String(s.Kelas).trim() !== String(filters.class).trim()) return false;
      if (filters.status && String(s.Status_Siswa).toLowerCase() !== String(filters.status).toLowerCase()) return false;
      if (filters.schoolYear && String(s.Tahun_Pelajaran) !== String(filters.schoolYear)) return false;
    }

    return true;
  });
}

/**
 * Menambah siswa baru
 */
function addStudentService(payload, user) {
  // Validasi otorisasi
  if (!authorizeClassAccess(user, payload.Kelas)) {
    throw new Error('Anda tidak memiliki izin menambah siswa di kelas ' + payload.Kelas);
  }

  // Validasi field wajib
  validateStudentInput(payload);

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const studentId = payload.ID_Siswa || ('SD-' + payload.Kelas + '-' + (payload.NIS || Utilities.getUuid().substring(0, 8)));

  // Cek duplikasi NIS / ID
  const existing = readSheetData(CONFIG.SHEETS.STUDENTS);
  const isDuplicate = existing.some(s => s.ID_Siswa === studentId || (payload.NIS && s.NIS === payload.NIS));
  if (isDuplicate) {
    throw new Error('Siswa dengan ID atau NIS tersebut sudah terdaftar!');
  }

  const row = {
    ID_Siswa: studentId,
    NIS: payload.NIS || '',
    NISN: payload.NISN || '',
    Nama_Lengkap: payload.Nama_Lengkap,
    Jenis_Kelamin: payload.Jenis_Kelamin,
    Tempat_Lahir: payload.Tempat_Lahir || '',
    Tanggal_Lahir: payload.Tanggal_Lahir || '',
    Nama_Orang_Tua: payload.Nama_Orang_Tua || '',
    Alamat: payload.Alamat || '',
    Kelas: String(payload.Kelas),
    Tahun_Pelajaran: payload.Tahun_Pelajaran || '2026/2027',
    Status_Siswa: payload.Status_Siswa || 'Aktif',
    Foto_URL: payload.Foto_URL || '',
    Created_At: now,
    Updated_At: now,
    Updated_By: user ? (user.name || user.email) : 'Sistem',
    Sync_Status: 'synced',
  };

  upsertRow(CONFIG.SHEETS.STUDENTS, 'ID_Siswa', studentId, row);
  writeActivityLog(user, 'TAMBAH_SISWA', 'Siswa', studentId, `Menambah siswa: ${payload.Nama_Lengkap} di kelas ${payload.Kelas}`);

  return { success: true, studentId: studentId, student: row };
}

/**
 * Memperbarui data siswa
 */
function updateStudentService(payload, user) {
  if (!payload.ID_Siswa) throw new Error('ID_Siswa wajib disertakan');

  const existing = readSheetData(CONFIG.SHEETS.STUDENTS);
  const current = existing.find(s => s.ID_Siswa === payload.ID_Siswa);
  if (!current) throw new Error('Data siswa tidak ditemukan');

  // Pastikan guru memiliki akses ke kelas siswa saat ini maupun kelas tujuan
  if (!authorizeClassAccess(user, current.Kelas) || (payload.Kelas && !authorizeClassAccess(user, payload.Kelas))) {
    throw new Error('Anda tidak memiliki izin mengubah data siswa di kelas ini');
  }

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const updatedRow = {
    ...current,
    ...payload,
    Updated_At: now,
    Updated_By: user ? (user.name || user.email) : 'Sistem',
    Sync_Status: 'synced',
  };

  upsertRow(CONFIG.SHEETS.STUDENTS, 'ID_Siswa', payload.ID_Siswa, updatedRow);
  writeActivityLog(user, 'UPDATE_SISWA', 'Siswa', payload.ID_Siswa, `Mengubah data siswa: ${updatedRow.Nama_Lengkap}`);

  return { success: true, student: updatedRow };
}

/**
 * Menonaktifkan siswa (bukan hapus permanen)
 */
function deactivateStudentService(studentId, status, reason, user) {
  const existing = readSheetData(CONFIG.SHEETS.STUDENTS);
  const current = existing.find(s => s.ID_Siswa === studentId);
  if (!current) throw new Error('Siswa tidak ditemukan');

  if (!authorizeClassAccess(user, current.Kelas)) {
    throw new Error('Anda tidak memiliki izin menonaktifkan siswa di kelas ' + current.Kelas);
  }

  const newStatus = status || 'Nonaktif';
  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  current.Status_Siswa = newStatus;
  current.Updated_At = now;
  current.Updated_By = user ? (user.name || user.email) : 'Sistem';

  upsertRow(CONFIG.SHEETS.STUDENTS, 'ID_Siswa', studentId, current);
  writeActivityLog(user, 'STATUS_SISWA', 'Siswa', studentId, `Mengubah status siswa menjadi ${newStatus}. Alasan: ${reason || '-'}`);

  return { success: true, message: `Status siswa berhasil diubah menjadi ${newStatus}` };
}


// -------------------------------------------------------------
// FILE: apps-script\AttendanceService.gs
// -------------------------------------------------------------

/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: AttendanceService.gs
 * Pengelolaan Absensi Harian, Rekapitulasi, dan Sinkronisasi Absensi
 */

const ATTENDANCE_STATUS = {
  PRESENT: 'Hadir',
  SICK: 'Sakit',
  PERMIT: 'Izin',
  ABSENT: 'Alpa',
};

/**
 * Menyimpan data absensi massal atau per siswa
 * @param {Array} records Array of attendance records
 * @param {Object} user User yang sedang login
 */
function receiveAttendanceService(records, user) {
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error('Data absensi kosong');
  }

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  let savedCount = 0;
  let failedCount = 0;
  const errors = [];

  records.forEach((item, index) => {
    try {
      // Validasi izin kelas
      if (!authorizeClassAccess(user, item.Kelas || item.class)) {
        throw new Error(`Tidak memiliki izin untuk kelas ${item.Kelas || item.class}`);
      }

      const classVal = String(item.Kelas || item.class).trim();
      const studentId = String(item.ID_Siswa || item.studentId).trim();
      const dateVal = String(item.Tanggal || item.date).trim();
      const statusVal = item.Status_Absensi || item.status || ATTENDANCE_STATUS.PRESENT;

      // Unique ID: ATT-{Kelas}-{Tanggal}-{ID_Siswa}
      const attendanceId = item.ID_Absensi || item.attendanceId || `ATT-${classVal}-${dateVal}-${studentId}`;

      const row = {
        ID_Absensi: attendanceId,
        Tanggal: dateVal,
        Tahun_Pelajaran: item.Tahun_Pelajaran || item.schoolYear || '2026/2027',
        Semester: String(item.Semester || item.semester || '1'),
        Kelas: classVal,
        ID_Siswa: studentId,
        NIS: item.NIS || item.nis || '',
        NISN: item.NISN || item.nisn || '',
        Nama_Siswa: item.Nama_Siswa || item.studentName || '',
        Status_Absensi: statusVal,
        Keterangan: item.Keterangan || item.notes || '',
        Diinput_Oleh: user ? (user.name || user.email) : (item.Diinput_Oleh || 'Sistem'),
        Updated_At: now,
        Sync_Status: 'synced',
      };

      upsertRow(CONFIG.SHEETS.ATTENDANCE, 'ID_Absensi', attendanceId, row);
      savedCount++;
    } catch (err) {
      failedCount++;
      errors.push(`Baris ${index + 1}: ${err.message}`);
    }
  });

  writeActivityLog(
    user,
    'SIMPAN_ABSENSI',
    'Absensi',
    `Kelas ${records[0].Kelas || records[0].class} - ${records[0].Tanggal || records[0].date}`,
    `Menyimpan absensi: ${savedCount} berhasil, ${failedCount} gagal`
  );

  return {
    success: failedCount === 0,
    savedCount: savedCount,
    failedCount: failedCount,
    errors: errors,
  };
}

/**
 * Menghitung rekapitulasi kehadiran berdasarkan rentang tanggal atau bulan
 */
function getAttendanceReportService(filters, user) {
  const allRecords = readSheetData(CONFIG.SHEETS.ATTENDANCE);
  const allStudents = readSheetData(CONFIG.SHEETS.STUDENTS);

  // Filter kelas berdasarkan hak akses
  const targetClass = filters.class ? String(filters.class).trim() : null;
  if (user && user.role === ROLES.TEACHER) {
    if (!targetClass || !user.assignedClasses.includes(targetClass)) {
      throw new Error('Anda tidak memiliki akses melihat rekap kelas ini');
    }
  }

  // Filter siswa aktif kelas target
  const classStudents = allStudents.filter(s => {
    if (targetClass && String(s.Kelas).trim() !== targetClass) return false;
    return s.Status_Siswa === 'Aktif';
  });

  // Filter catatan absensi
  const filteredRecords = allRecords.filter(r => {
    if (targetClass && String(r.Kelas).trim() !== targetClass) return false;
    if (filters.schoolYear && String(r.Tahun_Pelajaran) !== String(filters.schoolYear)) return false;
    if (filters.semester && String(r.Semester) !== String(filters.semester)) return false;
    if (filters.startDate && r.Tanggal < filters.startDate) return false;
    if (filters.endDate && r.Tanggal > filters.endDate) return false;
    if (filters.month) {
      // format YYYY-MM
      if (!String(r.Tanggal).startsWith(filters.month)) return false;
    }
    return true;
  });

  // Agregasi per siswa
  const studentMap = {};
  classStudents.forEach(s => {
    studentMap[s.ID_Siswa] = {
      studentId: s.ID_Siswa,
      nis: s.NIS,
      nisn: s.NISN,
      name: s.Nama_Lengkap,
      class: s.Kelas,
      present: 0,
      sick: 0,
      permit: 0,
      absent: 0,
      totalDays: 0,
      attendanceRate: 0,
    };
  });

  filteredRecords.forEach(r => {
    const sId = r.ID_Siswa;
    if (studentMap[sId]) {
      studentMap[sId].totalDays += 1;
      const status = String(r.Status_Absensi).toLowerCase();
      if (status === 'hadir') studentMap[sId].present += 1;
      else if (status === 'sakit') studentMap[sId].sick += 1;
      else if (status === 'izin') studentMap[sId].permit += 1;
      else if (status === 'alpa') studentMap[sId].absent += 1;
    }
  });

  // Hitung persentase kehadiran: (Hadir / Total Hari Tercatat) * 100
  // Hari tanpa data tidak dianggap alpa
  const report = Object.values(studentMap).map(item => {
    const rate = item.totalDays > 0 ? Math.round((item.present / item.totalDays) * 1000) / 10 : 0;
    item.attendanceRate = rate;
    return item;
  });

  return {
    class: targetClass,
    filters: filters,
    totalStudents: classStudents.length,
    studentsReport: report,
  };
}


// -------------------------------------------------------------
// FILE: apps-script\GradeService.gs
// -------------------------------------------------------------

/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: GradeService.gs
 * Pengelolaan Input Nilai, Rekap Nilai, dan Rapor Siswa
 */

const ASSESSMENT_TYPES = {
  FORMATIVE: 'Formatif',
  SUMMATIVE_MATERIAL: 'Sumatif Lingkup Materi',
  SUMMATIVE_MID: 'Sumatif Tengah Semester',
  SUMMATIVE_FINAL: 'Sumatif Akhir Semester',
};

/**
 * Menyimpan data nilai massal atau per siswa
 */
function receiveGradesService(records, user) {
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error('Data nilai kosong');
  }

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  let savedCount = 0;
  let failedCount = 0;
  const errors = [];

  records.forEach((item, index) => {
    try {
      const classVal = String(item.Kelas || item.class).trim();
      if (!authorizeClassAccess(user, classVal)) {
        throw new Error(`Tidak memiliki izin untuk kelas ${classVal}`);
      }

      // Validasi skor jika diisi: rentang 0-100. Nilai kosong tidak dianggap nol.
      const rawScore = item.Nilai !== undefined ? item.Nilai : item.score;
      let scoreVal = '';
      if (rawScore !== '' && rawScore !== null && rawScore !== undefined) {
        const num = Number(rawScore);
        if (isNaN(num) || num < 0 || num > 100) {
          throw new Error(`Nilai harus berupa angka antara 0 dan 100. Ditemukan: ${rawScore}`);
        }
        scoreVal = num;
      }

      const studentId = String(item.ID_Siswa || item.studentId).trim();
      const subject = String(item.Mata_Pelajaran || item.subject).trim();
      const assessmentType = String(item.Jenis_Asesmen || item.assessmentType).trim();
      const material = String(item.Lingkup_Materi || item.material || 'Umum').trim();
      const schoolYear = String(item.Tahun_Pelajaran || item.schoolYear || '2026/2027').trim();
      const semester = String(item.Semester || item.semester || '1').trim();

      // Mencegah duplikasi: ID unik berbasis entitas
      // ID: GRD-{Tahun}-{Sem}-{Kelas}-{MataPelajaran}-{JenisAsesmen}-{Materi}-{ID_Siswa}
      const safeSubject = subject.replace(/\s+/g, '_');
      const safeType = assessmentType.replace(/\s+/g, '_');
      const safeMat = material.replace(/\s+/g, '_');
      const gradeId = item.ID_Nilai || item.gradeId || `GRD-${schoolYear.replace('/', '-')}-S${semester}-${classVal}-${safeSubject}-${safeType}-${safeMat}-${studentId}`;

      const row = {
        ID_Nilai: gradeId,
        Tahun_Pelajaran: schoolYear,
        Semester: semester,
        Kelas: classVal,
        ID_Siswa: studentId,
        NIS: item.NIS || item.nis || '',
        NISN: item.NISN || item.nisn || '',
        Nama_Siswa: item.Nama_Siswa || item.studentName || '',
        Mata_Pelajaran: subject,
        Jenis_Asesmen: assessmentType,
        Lingkup_Materi: material,
        Nilai: scoreVal,
        Deskripsi: item.Deskripsi || item.description || '',
        Diinput_Oleh: user ? (user.name || user.email) : (item.Diinput_Oleh || 'Sistem'),
        Updated_At: now,
        Sync_Status: 'synced',
      };

      upsertRow(CONFIG.SHEETS.GRADES, 'ID_Nilai', gradeId, row);
      savedCount++;
    } catch (err) {
      failedCount++;
      errors.push(`Baris ${index + 1}: ${err.message}`);
    }
  });

  writeActivityLog(
    user,
    'SIMPAN_NILAI',
    'Nilai',
    `Kelas ${records[0].Kelas || records[0].class} - ${records[0].Mata_Pelajaran || records[0].subject}`,
    `Menyimpan nilai: ${savedCount} berhasil, ${failedCount} gagal`
  );

  return {
    success: failedCount === 0,
    savedCount: savedCount,
    failedCount: failedCount,
    errors: errors,
  };
}

/**
 * Mendapatkan rekapitulasi nilai untuk analisis rapor
 */
function getGradesReportService(filters, user) {
  const allGrades = readSheetData(CONFIG.SHEETS.GRADES);
  const targetClass = filters.class ? String(filters.class).trim() : null;

  if (user && user.role === ROLES.TEACHER) {
    if (!targetClass || !user.assignedClasses.includes(targetClass)) {
      throw new Error('Anda tidak memiliki izin melihat nilai kelas ini');
    }
  }

  const filtered = allGrades.filter(g => {
    if (targetClass && String(g.Kelas).trim() !== targetClass) return false;
    if (filters.schoolYear && String(g.Tahun_Pelajaran) !== String(filters.schoolYear)) return false;
    if (filters.semester && String(g.Semester) !== String(filters.semester)) return false;
    if (filters.subject && String(g.Mata_Pelajaran).toLowerCase() !== String(filters.subject).toLowerCase()) return false;
    if (filters.assessmentType && String(g.Jenis_Asesmen) !== String(filters.assessmentType)) return false;
    if (filters.studentId && String(g.ID_Siswa) !== String(filters.studentId)) return false;
    return true;
  });

  return {
    class: targetClass,
    filters: filters,
    totalRecords: filtered.length,
    grades: filtered,
  };
}


// -------------------------------------------------------------
// FILE: apps-script\SyncService.gs
// -------------------------------------------------------------

/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: SyncService.gs
 * Mesin Sinkronisasi Dua Arah, Pengelolaan Antrean, dan Penanganan Konflik
 */

/**
 * Sinkronisasi Siswa dari Google Sheets ke Firebase Firestore
 */
function syncStudentsToFirebaseService(user) {
  const students = readSheetData(CONFIG.SHEETS.STUDENTS);
  let successCount = 0;
  let failCount = 0;
  const errors = [];

  students.forEach((student, idx) => {
    try {
      if (!student.ID_Siswa) return;
      const docPayload = {
        studentId: String(student.ID_Siswa),
        nis: String(student.NIS || ''),
        nisn: String(student.NISN || ''),
        name: String(student.Nama_Lengkap || ''),
        gender: String(student.Jenis_Kelamin || ''),
        birthPlace: String(student.Tempat_Lahir || ''),
        birthDate: String(student.Tanggal_Lahir || ''),
        parentName: String(student.Nama_Orang_Tua || ''),
        address: String(student.Alamat || ''),
        class: String(student.Kelas || ''),
        schoolYear: String(student.Tahun_Pelajaran || '2026/2027'),
        status: String(student.Status_Siswa || 'Aktif'),
        photoURL: String(student.Foto_URL || ''),
        source: 'google_sheets',
        syncStatus: 'synced',
        updatedAt: student.Updated_At || new Date().toISOString(),
      };

      firestoreSetDocument('students', student.ID_Siswa, docPayload);
      successCount++;
    } catch (err) {
      failCount++;
      errors.push(`Siswa ${student.Nama_Lengkap || idx}: ${err.message}`);
    }
  });

  const logStatus = failCount === 0 ? 'BERHASIL' : (successCount > 0 ? 'SEBAGIAN' : 'GAGAL');
  const message = `Sinkronisasi Siswa: ${successCount} sukses, ${failCount} gagal.`;

  writeSyncLog('Siswa', 'Sheets -> Firebase', students.length, successCount, failCount, logStatus, message);

  return {
    success: failCount === 0,
    total: students.length,
    successCount: successCount,
    failedCount: failCount,
    errors: errors,
    status: logStatus,
    message: message,
  };
}

/**
 * Mendapatkan Status Terpadu Empat Pilar (Firebase, Sheets, Apps Script, Drive)
 */
function getComprehensiveSyncStatus() {
  const ss = getSpreadsheet();
  const sheetsOk = ss !== null;
  const firebaseCheck = checkFirebaseConnection();

  let driveOk = false;
  let driveMessage = '';
  try {
    const rootId = getProperty(CONFIG.PROPERTIES.DRIVE_ROOT_FOLDER_ID);
    if (rootId) {
      DriveApp.getFolderById(rootId);
      driveOk = true;
      driveMessage = 'Terhubung ke Google Drive';
    } else {
      driveMessage = 'Root folder belum diinisialisasi';
    }
  } catch (e) {
    driveOk = false;
    driveMessage = e.toString();
  }

  // Ambil antrean sinkronisasi tertunda
  const queue = readSheetData(CONFIG.SHEETS.SYNC_QUEUE);
  const pendingQueue = queue.filter(q => q.Status === 'PENDING' || q.Status === 'FAILED');

  // Ambil log terakhir
  const logs = readSheetData(CONFIG.SHEETS.SYNC_LOGS);
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

  return {
    timestamp: new Date().toISOString(),
    services: {
      firebase: {
        connected: firebaseCheck.connected,
        status: firebaseCheck.status,
        message: firebaseCheck.message || 'Cloud Firestore siap',
      },
      sheets: {
        connected: sheetsOk,
        status: sheetsOk ? 'TERHUBUNG' : 'GAGAL',
        name: ss ? ss.getName() : 'Tidak ditemukan',
      },
      appsScript: {
        connected: true,
        status: 'TERHUBUNG',
        version: CONFIG.VERSION,
      },
      googleDrive: {
        connected: driveOk,
        status: driveOk ? 'TERHUBUNG' : 'MENUNGGU_KONFIGURASI',
        message: driveMessage,
      },
    },
    pendingQueueCount: pendingQueue.length,
    lastSync: lastLog ? {
      time: lastLog.Waktu,
      type: lastLog.Jenis_Data,
      direction: lastLog.Arah_Sinkronisasi,
      status: lastLog.Status,
      message: lastLog.Pesan,
    } : null,
  };
}

/**
 * Mencoba ulang transaksi yang gagal di antrean
 */
function retryFailedSyncService(user) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.SYNC_QUEUE);
  if (!sheet) return { message: 'Sheet antrean tidak ditemukan' };

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { message: 'Tidak ada antrean tertunda' };

  const queue = readSheetData(CONFIG.SHEETS.SYNC_QUEUE);
  let retriedCount = 0;
  let resolvedCount = 0;

  queue.forEach((item, idx) => {
    if (item.Status === 'FAILED' || item.Status === 'PENDING') {
      retriedCount++;
      try {
        const payload = JSON.parse(item.Payload_JSON);
        if (item.Jenis_Data === 'Siswa') {
          if (item.Operasi === 'TAMBAH' || item.Operasi === 'UPDATE') {
            upsertRow(CONFIG.SHEETS.STUDENTS, 'ID_Siswa', item.ID_Data, payload);
          }
        } else if (item.Jenis_Data === 'Absensi') {
          upsertRow(CONFIG.SHEETS.ATTENDANCE, 'ID_Absensi', item.ID_Data, payload);
        } else if (item.Jenis_Data === 'Nilai') {
          upsertRow(CONFIG.SHEETS.GRADES, 'ID_Nilai', item.ID_Data, payload);
        }

        // Tandai selesai di antrean
        const rowIdx = idx + 2;
        sheet.getRange(rowIdx, 6).setValue('RESOLVED');
        sheet.getRange(rowIdx, 10).setValue(Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss'));
        resolvedCount++;
      } catch (err) {
        const rowIdx = idx + 2;
        const attempts = Number(item.Percobaan || 0) + 1;
        sheet.getRange(rowIdx, 7).setValue(attempts);
        sheet.getRange(rowIdx, 8).setValue(err.message);
      }
    }
  });

  return {
    totalRetried: retriedCount,
    resolved: resolvedCount,
    stillPending: retriedCount - resolvedCount,
  };
}


// -------------------------------------------------------------
// FILE: apps-script\ApiRouter.gs
// -------------------------------------------------------------

/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: ApiRouter.gs
 * Dispatcher Endpoint & JSON Response Handler
 */

/**
 * Membuat respons JSON standar
 */
function createJsonResponse(data, message, success, errorCode, requestId) {
  const reqId = requestId || ('REQ-' + Utilities.getUuid().substring(0, 8));
  const output = {
    success: success !== undefined ? success : true,
    message: message || (success ? 'Data berhasil diproses' : 'Operasi gagal'),
    data: data || null,
    errorCode: errorCode || null,
    requestId: reqId,
    timestamp: new Date().toISOString(),
  };

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Menangani seluruh permintaan masuk
 */
function handleApiRoute(e, method) {
  const requestId = 'REQ-' + Utilities.getUuid().substring(0, 8);

  try {
    // Parsing parameter
    let params = {};
    let payload = {};

    if (e && e.parameter) {
      params = e.parameter;
    }

    if (method === 'POST' && e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        return createJsonResponse(null, 'Payload bukan format JSON yang valid', false, 'INVALID_JSON', requestId);
      }
    }

    const action = params.action || payload.action;
    if (!action) {
      return createJsonResponse(null, 'Parameter action wajib disertakan', false, 'MISSING_ACTION', requestId);
    }

    // Endpoint publik / test
    if (action === 'testConnection') {
      const syncStatus = getComprehensiveSyncStatus();
      return createJsonResponse(syncStatus, 'Koneksi ke Apps Script & Database Berhasil', true, null, requestId);
    }

    if (action === 'initializeDatabase') {
      const initResult = initializeDatabase();
      initializeDriveFolders();
      return createJsonResponse(initResult, 'Inisialisasi Database Sheet & Drive Berhasil', true, null, requestId);
    }

    // Login langsung dengan kredensial dari sheet 'Pengguna' Google Sheets
    if (action === 'authenticateUser') {
      const authResult = authenticateUserService(payload);
      return createJsonResponse(authResult, 'Autentikasi akun berhasil', true, null, requestId);
    }

    // Verifikasi Autentikasi untuk aksi lainnya
    const authHeader = (e && e.headers && (e.headers.Authorization || e.headers.authorization)) || payload.authHeader;
    const apiSecret = (e && e.headers && (e.headers['X-Api-Secret'] || e.headers['x-api-secret'])) || payload.apiSecret;

    const auth = authenticateRequest(authHeader, apiSecret);
    if (!auth.isValid) {
      return createJsonResponse(null, auth.error || 'Akses ditolak: Autentikasi diperlukan', false, 'UNAUTHORIZED', requestId);
    }

    const user = auth.user;

    // Routing berdasarkan Action
    switch (action) {
      case 'getDashboardData': {
        const status = getComprehensiveSyncStatus();
        const students = readSheetData(CONFIG.SHEETS.STUDENTS);
        const teachers = readSheetData(CONFIG.SHEETS.TEACHERS);
        const activeStudents = students.filter(s => s.Status_Siswa === 'Aktif');

        const classCounts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };
        activeStudents.forEach(s => {
          const c = String(s.Kelas);
          if (classCounts[c] !== undefined) classCounts[c]++;
        });

        return createJsonResponse({
          totalStudents: students.length,
          activeStudents: activeStudents.length,
          inactiveStudents: students.length - activeStudents.length,
          totalTeachers: teachers.length,
          classCounts: classCounts,
          systemStatus: status,
        }, 'Data Dashboard berhasil dimuat', true, null, requestId);
      }

      case 'getStudents':
        return createJsonResponse(getStudentsService(params, user), 'Daftar siswa berhasil diambil', true, null, requestId);

      case 'addStudent':
        return createJsonResponse(addStudentService(payload.student || payload, user), 'Siswa berhasil ditambahkan', true, null, requestId);

      case 'updateStudent':
        return createJsonResponse(updateStudentService(payload.student || payload, user), 'Siswa berhasil diperbarui', true, null, requestId);

      case 'deactivateStudent':
        return createJsonResponse(
          deactivateStudentService(payload.studentId, payload.status, payload.reason, user),
          'Status siswa berhasil diubah',
          true,
          null,
          requestId
        );

      case 'saveAttendance':
      case 'receiveAttendance':
        return createJsonResponse(
          receiveAttendanceService(payload.records || payload.data, user),
          'Absensi berhasil disimpan ke Google Sheets',
          true,
          null,
          requestId
        );

      case 'saveMonthlyAttendance':
        return createJsonResponse(
          saveMonthlyAttendanceService(payload, user),
          'Rekap absensi bulanan berhasil disimpan ke Google Sheets & Firebase',
          true,
          null,
          requestId
        );

      case 'getAttendanceReport':
        return createJsonResponse(
          getAttendanceReportService(params.class ? params : payload, user),
          'Rekapitulasi absensi berhasil dihitung',
          true,
          null,
          requestId
        );

      case 'saveGrades':
      case 'receiveGrades':
        return createJsonResponse(
          receiveGradesService(payload.records || payload.data, user),
          'Nilai berhasil disimpan ke Google Sheets',
          true,
          null,
          requestId
        );

      case 'saveDetailedGrades':
        return createJsonResponse(
          saveDetailedGradesService(payload, user),
          'Rincian nilai semester berhasil disimpan ke Google Sheets & Firebase',
          true,
          null,
          requestId
        );

      case 'getGradesReport':
        return createJsonResponse(
          getGradesReportService(params.class ? params : payload, user),
          'Rekapitulasi nilai berhasil diambil',
          true,
          null,
          requestId
        );

      case 'uploadProfilePhoto':
        return createJsonResponse(
          uploadProfilePhotoService(payload, user),
          'Foto profil guru berhasil diunggah ke Google Drive',
          true,
          null,
          requestId
        );

      case 'createArchive':
        return createJsonResponse(
          createArchiveService(payload, user),
          'Laporan berhasil diarsipkan ke Google Drive',
          true,
          null,
          requestId
        );

      case 'syncStudents':
        return createJsonResponse(
          syncStudentsToFirebaseService(user),
          'Sinkronisasi siswa ke Firebase selesai',
          true,
          null,
          requestId
        );

      case 'getSyncStatus':
        return createJsonResponse(
          getComprehensiveSyncStatus(),
          'Status sinkronisasi berhasil diambil',
          true,
          null,
          requestId
        );

      case 'retryFailedSync':
        return createJsonResponse(
          retryFailedSyncService(user),
          'Percobaan ulang antrean selesai',
          true,
          null,
          requestId
        );

      case 'getUsers':
        return createJsonResponse(getUsersService(user), 'Daftar pengguna berhasil diambil', true, null, requestId);

      case 'saveUser':
        return createJsonResponse(saveUserService(payload, user), 'Akun pengguna berhasil disimpan', true, null, requestId);

      case 'updateTeacherProfile':
        return createJsonResponse(updateTeacherProfileService(payload, user), 'Profil guru berhasil diperbarui', true, null, requestId);

      default:
        return createJsonResponse(null, `Action '${action}' tidak dikenali`, false, 'UNKNOWN_ACTION', requestId);
    }
  } catch (err) {
    return createJsonResponse(null, err.message || err.toString(), false, 'INTERNAL_SERVER_ERROR', requestId);
  }
}


// -------------------------------------------------------------
// FILE: apps-script\Code.gs
// -------------------------------------------------------------

/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: Code.gs
 * Titik Masuk Utama Google Apps Script Web App
 */

/**
 * Menangani permintaan HTTP GET
 */
function doGet(e) {
  return handleApiRoute(e, 'GET');
}

/**
 * Menangani permintaan HTTP POST
 */
function doPost(e) {
  return handleApiRoute(e, 'POST');
}

/**
 * Fungsi uji coba langsung dari editor Apps Script
 */
function testConnection() {
  const result = getComprehensiveSyncStatus();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * Fungsi pembantu inisialisasi dari menu editor Apps Script
 */
function runInitialization() {
  const result = initializeDatabase();
  const driveResult = initializeDriveFolders();
  Logger.log('Inisialisasi Sheet: ' + JSON.stringify(result));
  Logger.log('Inisialisasi Drive: ' + JSON.stringify(driveResult));
}

/**
 * Trigger otomatis periodik (contoh setiap 1 jam atau harian)
 * Dapat diaktifkan melalui menu Triggers di script.google.com
 */
function scheduledSyncTrigger() {
  Logger.log('Memulai sinkronisasi otomatis terjadwal...');
  const user = { uid: 'SCHEDULED_TRIGGER', email: 'trigger@system', role: 'admin', name: 'Auto Sync' };
  try {
    const syncRes = syncStudentsToFirebaseService(user);
    const retryRes = retryFailedSyncService(user);
    Logger.log('Selesai sinkronisasi terjadwal: ' + JSON.stringify({ sync: syncRes, retry: retryRes }));
  } catch (e) {
    Logger.log('Gagal menjalankan trigger terjadwal: ' + e.message);
  }
}

