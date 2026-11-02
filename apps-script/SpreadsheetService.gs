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
