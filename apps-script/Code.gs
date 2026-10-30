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
