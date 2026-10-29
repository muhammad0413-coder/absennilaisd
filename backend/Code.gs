/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * GOOGLE APPS SCRIPT BACKEND (backend/Code.gs)
 * ==============================================================================
 * Arsitektur:
 * 1. Google Sheets sebagai Master Data Induk Siswa (Data_Siswa)
 * 2. Cloud Firestore sebagai Database Operasional (Absensi & Nilai)
 * 3. Google Sheets sebagai Salinan Laporan Arsip (Data_Absensi & Data_Nilai)
 * 4. Google Drive untuk Penyimpanan Arsip Dokumen PDF & Laporan
 * ==============================================================================
 */

const CONFIG = {
  SPREADSHEET_NAME: "SISTEM ABSENSI DAN NILAI SD",
  DRIVE_ROOT: "SISTEM SEKOLAH",
  FOLDERS: {
    ABSENSI: "ABSENSI",
    NILAI: "NILAI",
    LAPORAN: "LAPORAN"
  },
  SHEETS: {
    SISWA: "Data_Siswa",
    ABSENSI: "Data_Absensi",
    NILAI: "Data_Nilai",
    PENGATURAN: "Pengaturan",
    PENGGUNA: "Pengguna",
    LOG_SINKRONISASI: "Log_Sinkronisasi"
  }
};

/**
 * Setup Otomatis: Membuat 6 Sheet Resmi dan Struktur Folder Google Drive
 * Jalankan fungsi ini satu kali dari Google Apps Script Editor.
 */
function setupDatabaseAndFolders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Skema 6 Sheet Sesuai Spesifikasi Resmi
  const schema = {
    [CONFIG.SHEETS.SISWA]: [
      "ID_Siswa", "NIS", "NISN", "Nama_Lengkap", "Jenis_Kelamin",
      "Tempat_Lahir", "Tanggal_Lahir", "Nama_Orang_Tua", "Alamat",
      "Kelas", "Tahun_Pelajaran", "Status_Siswa", "Updated_At", "Sync_Status"
    ],
    [CONFIG.SHEETS.ABSENSI]: [
      "ID_Absensi", "Tanggal", "Tahun_Pelajaran", "Semester", "Kelas",
      "ID_Siswa", "NIS", "NISN", "Nama_Siswa", "Status_Absensi",
      "Keterangan", "Diinput_Oleh", "Updated_At", "Sync_Status"
    ],
    [CONFIG.SHEETS.NILAI]: [
      "ID_Nilai", "Tahun_Pelajaran", "Semester", "Kelas",
      "ID_Siswa", "NIS", "NISN", "Nama_Siswa", "Mata_Pelajaran",
      "Jenis_Asesmen", "Lingkup_Materi", "Nilai", "Deskripsi",
      "Diinput_Oleh", "Updated_At", "Sync_Status"
    ],
    [CONFIG.SHEETS.PENGATURAN]: [
      "Nama_Pengaturan", "Nilai_Pengaturan", "Updated_At"
    ],
    [CONFIG.SHEETS.PENGGUNA]: [
      "User_ID", "Nama", "Email", "Role", "Kelas_Ditugaskan", "Status", "Updated_At"
    ],
    [CONFIG.SHEETS.LOG_SINKRONISASI]: [
      "ID_Log", "Waktu", "Jenis_Data", "Arah_Sinkronisasi",
      "Jumlah_Diproses", "Jumlah_Berhasil", "Jumlah_Gagal", "Status", "Pesan"
    ]
  };

  // 1. Buat / Validasi Seluruh Sheet
  for (const [sheetName, headers] of Object.entries(schema)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#1e3a8a")
        .setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
  }

  // 2. Data Pengaturan Awal
  const sheetSettings = ss.getSheetByName(CONFIG.SHEETS.PENGATURAN);
  if (sheetSettings.getLastRow() <= 1) {
    const now = new Date().toISOString();
    const defaultSettings = [
      ["nama_sekolah", "SD NEGERI HARAPAN BANGSA", now],
      ["npsn", "20109988", now],
      ["alamat_sekolah", "Jl. Merdeka Belajar No. 45, Jakarta", now],
      ["nama_kepala_sekolah", "Drs. H. Mulyadi, M.Pd.", now],
      ["nip_kepala_sekolah", "197203151998031004", now],
      ["tahun_pelajaran_aktif", "2026/2027", now],
      ["semester_aktif", "1 (Ganjil)", now],
      ["kkm_default", "75", now],
      ["daftar_mata_pelajaran", "Pendidikan Pancasila,Bahasa Indonesia,Matematika,IPAS,PJOK,Seni Budaya,Bahasa Inggris", now]
    ];
    sheetSettings.getRange(2, 1, defaultSettings.length, 3).setValues(defaultSettings);
  }

  // 3. Data Pengguna Awal (Admin, Guru Kelas 1-6, Kepala Sekolah)
  const sheetUsers = ss.getSheetByName(CONFIG.SHEETS.PENGGUNA);
  if (sheetUsers.getLastRow() <= 1) {
    const now = new Date().toISOString();
    const defaultUsers = [
      ["USR_ADM_001", "Administrator Sekolah", "admin@sekolah.id", "admin", "semua", "Aktif", now],
      ["USR_KS_001", "Drs. H. Mulyadi, M.Pd.", "kepsek@sekolah.id", "kepala_sekolah", "semua", "Aktif", now],
      ["USR_GUR_001", "Siti Rahmawati, S.Pd.", "guru1@sekolah.id", "guru", "kelas_1", "Aktif", now],
      ["USR_GUR_002", "Ahmad Fauzi, S.Pd.", "guru2@sekolah.id", "guru", "kelas_2", "Aktif", now],
      ["USR_GUR_003", "Dewi Lestari, S.Pd.", "guru3@sekolah.id", "guru", "kelas_3", "Aktif", now],
      ["USR_GUR_004", "Rendra Saputra, S.Pd.", "guru4@sekolah.id", "guru", "kelas_4", "Aktif", now],
      ["USR_GUR_005", "Nurul Hidayah, S.Pd.", "guru5@sekolah.id", "guru", "kelas_5", "Aktif", now],
      ["USR_GUR_006", "Bambang Sudarmono, M.Pd.", "guru6@sekolah.id", "guru", "kelas_6", "Aktif", now]
    ];
    sheetUsers.getRange(2, 1, defaultUsers.length, 7).setValues(defaultUsers);
  }

  // 4. Data Master Siswa Awal untuk Kelas 1–6 (Jika Masih Kosong)
  const sheetSiswa = ss.getSheetByName(CONFIG.SHEETS.SISWA);
  if (sheetSiswa.getLastRow() <= 1) {
    const now = new Date().toISOString();
    const sampleStudents = [
      ["STD_1001", "1001", "0161234501", "Aditya Pratama", "Laki-laki", "Jakarta", "2019-04-12", "Budi Pratama", "Jl. Dahlia No. 5", "1", "2026/2027", "Aktif", now, "Synced"],
      ["STD_1002", "1002", "0161234502", "Annisa Cantika Putri", "Perempuan", "Bandung", "2019-06-20", "Hendra Putri", "Jl. Mawar No. 12", "1", "2026/2027", "Aktif", now, "Synced"],
      ["STD_2001", "2001", "0151234501", "Bayu Bagaskara", "Laki-laki", "Jakarta", "2018-03-10", "Dedi Bagas", "Jl. Anggrek No. 3", "2", "2026/2027", "Aktif", now, "Synced"],
      ["STD_3001", "3001", "0141234501", "Citra Kirana", "Perempuan", "Bogor", "2017-08-15", "Rudi Kirana", "Jl. Kenanga No. 8", "3", "2026/2027", "Aktif", now, "Synced"],
      ["STD_4001", "4001", "0131234501", "Danu Wijaya", "Laki-laki", "Depok", "2016-11-22", "Wijaya Hadi", "Jl. Melati No. 14", "4", "2026/2027", "Aktif", now, "Synced"],
      ["STD_5001", "5001", "0121234501", "Eka Putri Lestari", "Perempuan", "Jakarta", "2015-05-18", "Lestari Eko", "Jl. Cempaka No. 2", "5", "2026/2027", "Aktif", now, "Synced"],
      ["STD_6001", "6001", "0111234501", "Faris Al-Ghifari", "Laki-laki", "Surabaya", "2014-02-10", "Ghifari Hasan", "Jl. Flamboyan No. 19", "6", "2026/2027", "Aktif", now, "Synced"],
      ["STD_6002", "6002", "0111234502", "Ghea Salsabila", "Perempuan", "Jakarta", "2014-07-25", "Salsabila Ridwan", "Jl. Teratai No. 7", "6", "2026/2027", "Aktif", now, "Synced"]
    ];
    sheetSiswa.getRange(2, 1, sampleStudents.length, 14).setValues(sampleStudents);
  }

  // 5. Inisialisasi Struktur Folder Arsip Google Drive
  const rootFolder = getOrCreateFolder(CONFIG.DRIVE_ROOT);
  const activeYear = "2026_2027";
  for (const subName of Object.values(CONFIG.FOLDERS)) {
    const parentCategory = getOrCreateSubFolder(rootFolder, subName);
    getOrCreateSubFolder(parentCategory, activeYear);
  }

  Logger.log("Inisialisasi 6 Sheet dan Google Drive Selesai!");
  return { status: "success", message: "Inisialisasi 6 Sheet dan Google Drive Selesai!" };
}

// Helper Drive Folder
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}

function getOrCreateSubFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : parentFolder.createFolder(folderName);
}

/**
 * Endpoint HTTP GET: Mengambil Data Siswa Induk untuk Sinkronisasi ke Firebase
 */
function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action;

    if (action === "getStudents") {
      return createJsonResponse(getStudentsFromMaster(params.kelas));
    }

    if (action === "getSettings") {
      return createJsonResponse(getSettingsData());
    }

    if (action === "getSyncLogs") {
      return createJsonResponse(getSyncLogsData());
    }

    return createJsonResponse({
      app: "SISTEM ABSENSI DAN NILAI SD",
      status: "online",
      classes: [1, 2, 3, 4, 5, 6],
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse({ error: err.toString() }, 500);
  }
}

/**
 * Endpoint HTTP POST: Menerima Data Absensi, Nilai, dan Arsip dari Website
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Kunci 30 detik untuk mencegah konflik penulisan konkuren
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter || {};
    }

    const action = payload.action;

    switch (action) {
      // 1. Terima Salinan Absensi dari Website -> Simpan ke Sheet Data_Absensi
      case "receiveAttendance":
        return createJsonResponse(saveAttendanceToSheet(payload.attendance_list, payload.diinput_oleh));

      // 2. Terima Salinan Nilai dari Website -> Simpan ke Sheet Data_Nilai
      case "receiveGrades":
        return createJsonResponse(saveGradesToSheet(payload.grades_list, payload.diinput_oleh));

      // 3. Simpan Dokumen Arsip ke Google Drive
      case "archiveDocument":
        return createJsonResponse(saveArchiveDocument(payload));

      // 4. Catat Log Sinkronisasi
      case "writeSyncLog":
        return createJsonResponse(writeSyncLogEntry(payload));

      default:
        return createJsonResponse({ error: "Aksi tidak dikenal: " + action }, 404);
    }
  } catch (err) {
    return createJsonResponse({ error: "Gagal memproses data: " + err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * 1. Mengambil Data Induk Siswa dari Sheet Data_Siswa
 * (Google Sheets adalah SUMBER UTAMA data siswa)
 */
function getStudentsFromMaster(filterKelas) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.SISWA);
  if (!sheet) return { error: "Sheet Data_Siswa tidak ditemukan." };

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { students: [] };

  const headers = values[0];
  const students = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowKelas = String(row[9]).trim(); // Kolom Kelas

    if (!filterKelas || rowKelas === String(filterKelas).replace('kelas_', '')) {
      const studentObj = {};
      for (let h = 0; h < headers.length; h++) {
        let val = row[h];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
        }
        studentObj[headers[h]] = val !== undefined ? String(val).trim() : "";
      }
      students.push(studentObj);
    }
  }

  return {
    status: "success",
    total: students.length,
    students: students
  };
}

/**
 * 2. Menyimpan Salinan Absensi ke Sheet Data_Absensi
 * (Website/Firebase -> Google Sheets) dengan pencegahan duplikasi
 */
function saveAttendanceToSheet(attendanceList, diinputOleh) {
  if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
    return { error: "Daftar absensi kosong." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.ABSENSI);
  const rows = sheet.getDataRange().getValues();
  const now = new Date().toISOString();

  let insertedCount = 0;
  let updatedCount = 0;

  for (const item of attendanceList) {
    const cleanDate = formatDateString(item.Tanggal || item.tanggal);
    const studentId = item.ID_Siswa || item.student_id;
    const kelas = String(item.Kelas || item.kelas || "").replace('kelas_', '');

    let foundRowIndex = -1;

    // Cek apakah absensi siswa pada tanggal tersebut sudah ada
    for (let r = 1; r < rows.length; r++) {
      if (rows[r][5] === studentId && formatDateString(rows[r][1]) === cleanDate) {
        foundRowIndex = r + 1;
        break;
      }
    }

    const attendanceId = item.ID_Absensi || item.attendance_id || ("ATT_" + cleanDate.replace(/-/g, '') + "_" + studentId);

    if (foundRowIndex > 0) {
      // Update data yang ada
      sheet.getRange(foundRowIndex, 10).setValue(item.Status_Absensi || item.status_absensi);
      sheet.getRange(foundRowIndex, 11).setValue(item.Keterangan || item.keterangan || "");
      sheet.getRange(foundRowIndex, 12).setValue(diinputOleh || item.diinput_oleh || "Guru");
      sheet.getRange(foundRowIndex, 13).setValue(now);
      sheet.getRange(foundRowIndex, 14).setValue("Synced");
      updatedCount++;
    } else {
      // Tambah baris baru
      sheet.appendRow([
        attendanceId,
        cleanDate,
        item.Tahun_Pelajaran || item.tahun_pelajaran || "2026/2027",
        item.Semester || item.semester || "1 (Ganjil)",
        kelas,
        studentId,
        String(item.NIS || item.nis || ""),
        String(item.NISN || item.nisn || ""),
        item.Nama_Siswa || item.nama_siswa || "",
        item.Status_Absensi || item.status_absensi || "Hadir",
        item.Keterangan || item.keterangan || "",
        diinputOleh || item.diinput_oleh || "Guru",
        now,
        "Synced"
      ]);
      insertedCount++;
    }
  }

  writeSyncLogEntry({
    jenis_data: "ABSENSI",
    arah: "Firebase -> Sheets",
    proses: attendanceList.length,
    berhasil: insertedCount + updatedCount,
    gagal: 0,
    status: "Sukses",
    pesan: `Menyimpan absensi: ${insertedCount} baru, ${updatedCount} diperbarui`
  });

  return {
    status: "success",
    inserted: insertedCount,
    updated: updatedCount,
    message: "Data absensi berhasil disalin ke Google Sheets!"
  };
}

/**
 * 3. Menyimpan Salinan Nilai ke Sheet Data_Nilai
 * (Website/Firebase -> Google Sheets)
 */
function saveGradesToSheet(gradesList, diinputOleh) {
  if (!Array.isArray(gradesList) || gradesList.length === 0) {
    return { error: "Daftar nilai kosong." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.NILAI);
  const rows = sheet.getDataRange().getValues();
  const now = new Date().toISOString();

  let insertedCount = 0;
  let updatedCount = 0;

  for (const item of gradesList) {
    const studentId = item.ID_Siswa || item.student_id;
    const mapel = item.Mata_Pelajaran || item.mata_pelajaran;
    const jenis = item.Jenis_Asesmen || item.jenis_penilaian;
    const semester = item.Semester || item.semester || "1 (Ganjil)";
    const tahun = item.Tahun_Pelajaran || item.tahun_pelajaran || "2026/2027";
    const kelas = String(item.Kelas || item.kelas || "").replace('kelas_', '');

    let foundRowIndex = -1;

    // Periksa duplikasi berdasarkan Siswa + Mapel + Jenis Asesmen + Semester + Tahun
    for (let r = 1; r < rows.length; r++) {
      if (
        rows[r][4] === studentId &&
        rows[r][8] === mapel &&
        rows[r][9] === jenis &&
        rows[r][2] === semester &&
        rows[r][1] === tahun
      ) {
        foundRowIndex = r + 1;
        break;
      }
    }

    const gradeId = item.ID_Nilai || item.grade_id || ("GRD_" + Date.now().toString(36) + "_" + Math.floor(Math.random() * 100));

    if (foundRowIndex > 0) {
      sheet.getRange(foundRowIndex, 10).setValue(item.Lingkup_Materi || item.lingkup_materi || item.nama_penilaian || "");
      sheet.getRange(foundRowIndex, 12).setValue(Number(item.Nilai || item.nilai || 0));
      sheet.getRange(foundRowIndex, 13).setValue(item.Deskripsi || item.deskripsi || item.keterangan || "");
      sheet.getRange(foundRowIndex, 14).setValue(diinputOleh || item.diinput_oleh || "Guru");
      sheet.getRange(foundRowIndex, 15).setValue(now);
      sheet.getRange(foundRowIndex, 16).setValue("Synced");
      updatedCount++;
    } else {
      sheet.appendRow([
        gradeId,
        tahun,
        semester,
        kelas,
        studentId,
        String(item.NIS || item.nis || ""),
        String(item.NISN || item.nisn || ""),
        item.Nama_Siswa || item.nama_siswa || "",
        mapel,
        jenis,
        item.Lingkup_Materi || item.lingkup_materi || item.nama_penilaian || "",
        Number(item.Nilai || item.nilai || 0),
        item.Deskripsi || item.deskripsi || item.keterangan || "",
        diinputOleh || item.diinput_oleh || "Guru",
        now,
        "Synced"
      ]);
      insertedCount++;
    }
  }

  writeSyncLogEntry({
    jenis_data: "NILAI",
    arah: "Firebase -> Sheets",
    proses: gradesList.length,
    berhasil: insertedCount + updatedCount,
    gagal: 0,
    status: "Sukses",
    pesan: `Menyimpan nilai: ${insertedCount} baru, ${updatedCount} diperbarui`
  });

  return {
    status: "success",
    inserted: insertedCount,
    updated: updatedCount,
    message: "Data nilai berhasil disalin ke Google Sheets!"
  };
}

/**
 * 4. Menyimpan Dokumen / PDF ke Folder Google Drive Terorganisasi
 */
function saveArchiveDocument(payload) {
  if (!payload.file_name || !payload.base64_data || !payload.category) {
    return { error: "Parameter dokumen tidak lengkap." };
  }

  const category = (payload.category || "LAPORAN").toUpperCase();
  const yearFolder = (payload.tahun_pelajaran || "2026_2027").replace(/\//g, '_');

  const rootFolder = getOrCreateFolder(CONFIG.DRIVE_ROOT);
  const categoryFolder = getOrCreateSubFolder(rootFolder, category);
  const targetFolder = getOrCreateSubFolder(categoryFolder, yearFolder);

  const bytes = Utilities.base64Decode(payload.base64_data.replace(/^data:.*?;base64,/, ""));
  const mimeType = payload.mime_type || "application/pdf";
  const blob = Utilities.newBlob(bytes, mimeType, payload.file_name);
  const file = targetFolder.createFile(blob);

  return {
    status: "success",
    file_id: file.getId(),
    file_name: payload.file_name,
    view_url: file.getUrl(),
    message: "Dokumen berhasil diarsipkan ke Google Drive!"
  };
}

/**
 * 5. Menulis Entri ke Sheet Log_Sinkronisasi
 */
function writeSyncLogEntry(entry) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.LOG_SINKRONISASI);
    if (!sheet) return;

    const logId = "LOG_" + Date.now().toString(36);
    sheet.appendRow([
      logId,
      new Date().toISOString(),
      entry.jenis_data || "UMUM",
      entry.arah || "SINKRONISASI",
      entry.proses || 0,
      entry.berhasil || 0,
      entry.gagal || 0,
      entry.status || "Sukses",
      entry.pesan || ""
    ]);
    return { status: "success", log_id: logId };
  } catch (e) {
    Logger.log("Gagal mencatat log: " + e.toString());
  }
}

/**
 * Helper: Ambil Data Pengaturan
 */
function getSettingsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PENGATURAN);
  const rows = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < rows.length; i++) {
    settings[rows[i][0]] = rows[i][1];
  }
  return settings;
}

/**
 * Helper: Ambil Log Sinkronisasi
 */
function getSyncLogsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.LOG_SINKRONISASI);
  const rows = sheet.getDataRange().getValues();
  const logs = [];
  for (let i = 1; i < rows.length; i++) {
    logs.push({
      log_id: rows[i][0],
      waktu: rows[i][1],
      jenis_data: rows[i][2],
      arah: rows[i][3],
      proses: rows[i][4],
      berhasil: rows[i][5],
      gagal: rows[i][6],
      status: rows[i][7],
      pesan: rows[i][8]
    });
  }
  return logs.reverse().slice(0, 50);
}

function formatDateString(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(val).substring(0, 10);
}

function createJsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
