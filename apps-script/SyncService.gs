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
