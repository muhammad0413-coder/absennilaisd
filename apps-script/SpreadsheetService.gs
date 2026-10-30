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
      headers: ['User_ID', 'Nama', 'Email', 'Role', 'Kelas_Ditugaskan', 'Status', 'Updated_At'],
      colWidths: [150, 200, 220, 100, 140, 100, 160],
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
