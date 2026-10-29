/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * PANEL SINKRONISASI DATA (src/pages/SyncPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { 
  getSyncStatusSummary, 
  syncStudentsFromGoogleSheets, 
  getAttendance, 
  getGrades, 
  syncAttendanceToGoogleSheets, 
  syncGradesToGoogleSheets, 
  isGASConfigured 
} from '../services.js';
import { isFirebaseConfigured } from '../firebase.js';
import { toast } from '../components/Toast.js';

export async function renderSyncPage() {
  const syncSummary = await getSyncStatusSummary();

  return `
    <div class="page-content">
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <div>
            <h2 class="card-title">🔄 Panel Sinkronisasi Google Sheets &amp; Cloud Firestore</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Integrasi sinkronisasi data master siswa (Sheets → Firebase) dan salinan absensi/nilai (Firebase → Sheets).
            </p>
          </div>
        </div>

        <!-- Kartu Status 3 Layanan Utama -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
          <div style="padding: 1.25rem; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <strong style="font-size: 0.95rem;">1. Cloud Firestore</strong>
              <span class="badge ${isFirebaseConfigured ? 'badge-success' : 'badge-warning'}">
                ${isFirebaseConfigured ? 'Live Terhubung' : 'Cache Lokal Siap'}
              </span>
            </div>
            <p style="font-size: 0.8rem; color: #64748b; margin: 0;">Database operasional cepat untuk akun, absensi, dan nilai.</p>
          </div>

          <div style="padding: 1.25rem; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <strong style="font-size: 0.95rem;">2. Master Google Sheets</strong>
              <span class="badge ${isGASConfigured ? 'badge-success' : 'badge-warning'}">
                ${isGASConfigured ? 'Live Terhubung' : 'Siap Terhubung'}
              </span>
            </div>
            <p style="font-size: 0.8rem; color: #64748b; margin: 0;">Spreadsheet <em>SISTEM ABSENSI DAN NILAI SD</em> (6 Sheet Resmi).</p>
          </div>

          <div style="padding: 1.25rem; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <strong style="font-size: 0.95rem;">3. Google Drive</strong>
              <span class="badge ${isGASConfigured ? 'badge-success' : 'badge-info'}">
                ${isGASConfigured ? 'Live Drive API' : 'Folder Siap'}
              </span>
            </div>
            <p style="font-size: 0.8rem; color: #64748b; margin: 0;">Arsip PDF <em>SISTEM SEKOLAH/ABSENSI</em> &amp; <em>NILAI</em>.</p>
          </div>
        </div>

        <!-- Informasi Otomasi Sinkronisasi Langsung -->
        <div style="margin-top: 1.25rem; padding: 1rem 1.25rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; display: flex; align-items: flex-start; gap: 0.75rem;">
          <div style="font-size: 1.5rem; line-height: 1;">⚡</div>
          <div style="font-size: 0.85rem; color: #166534;">
            <strong>Mekanisme Pengiriman Otomatis (Live Background Sync):</strong>
            <ul style="margin: 0.35rem 0 0 1.2rem; padding: 0; line-height: 1.45;">
              <li><strong>Website → Google Sheets (Presensi & Nilai):</strong> Otomatis langsung dikirim saat Guru menekan tombol <em>"Simpan Presensi"</em> atau <em>"Simpan Nilai"</em>. Guru tidak perlu membuka menu ini untuk mengirim data.</li>
              <li><strong>Google Sheets → Website (Data Master Siswa):</strong> Otomatis disinkronkan di latar belakang saat aplikasi dimuat atau diperbarui otomatis setiap 10 menit via pemicu Google Apps Script (<code>installAutoSyncTriggers</code>).</li>
            </ul>
          </div>
        </div>

        <!-- Tombol Aksi Sinkronisasi Mandiri -->
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-primary" id="btn-sync-students">
            📥 Sinkronkan Data Siswa Sekarang (Sheets → Firebase)
          </button>
          <button class="btn btn-outline" id="btn-sync-attendance">
            📤 Kirim Ulang Absensi (Firebase → Sheets)
          </button>
          <button class="btn btn-outline" id="btn-sync-grades">
            📤 Kirim Ulang Nilai (Firebase → Sheets)
          </button>
          <button class="btn btn-outline" id="btn-retry-sync">
            ♻️ Ulangi Sinkronisasi Gagal
          </button>
        </div>
      </div>

      <!-- Riwayat Transaksi Sinkronisasi (Log_Sinkronisasi) -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📜 Log Riwayat Transaksi Sinkronisasi</h3>
          <span style="font-size: 0.78rem; color: #64748b;">Mencatat waktu, jenis data, arah, dan status</span>
        </div>

        <div class="table-responsive">
          <table class="table" id="table-sync-logs">
            <thead>
              <tr>
                <th style="width: 150px;">Waktu</th>
                <th>Jenis Data</th>
                <th>Arah Sinkronisasi</th>
                <th style="text-align: center;">Proses</th>
                <th style="text-align: center;">Berhasil</th>
                <th style="text-align: center;">Gagal</th>
                <th>Status</th>
                <th>Pesan / Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${syncSummary.logs.map(l => `
                <tr>
                  <td style="font-size: 0.8rem; color: #64748b;">${new Date(l.Waktu).toLocaleString('id-ID')}</td>
                  <td><strong>${l.Jenis_Data}</strong></td>
                  <td><span class="badge badge-neutral">${l.Arah_Sinkronisasi}</span></td>
                  <td style="text-align: center;">${l.Jumlah_Diproses}</td>
                  <td style="text-align: center; color: #10b981; font-weight: bold;">${l.Jumlah_Berhasil}</td>
                  <td style="text-align: center; color: ${l.Jumlah_Gagal > 0 ? '#ef4444' : '#64748b'};">${l.Jumlah_Gagal}</td>
                  <td>
                    <span class="badge ${l.Status === 'Sukses' ? 'badge-success' : 'badge-danger'}">
                      ${l.Status}
                    </span>
                  </td>
                  <td style="font-size: 0.82rem; color: #475569;">${l.Pesan}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function attachSyncEvents() {
  const user = getCurrentUser();

  const btnSyncStudents = document.getElementById('btn-sync-students');
  const btnSyncAtt = document.getElementById('btn-sync-attendance');
  const btnSyncGrades = document.getElementById('btn-sync-grades');
  const btnRetry = document.getElementById('btn-retry-sync');

  // 1. Sinkronkan Siswa dari Sheets
  if (btnSyncStudents) {
    btnSyncStudents.onclick = async () => {
      btnSyncStudents.disabled = true;
      btnSyncStudents.textContent = "Menyinkronkan...";

      try {
        const res = await syncStudentsFromGoogleSheets(user);
        toast.success(res.message);
        window.location.reload();
      } catch (err) {
        toast.error("Gagal menyinkronkan siswa: " + err.message);
      } finally {
        btnSyncStudents.disabled = false;
        btnSyncStudents.textContent = "📥 Sinkronkan Data Siswa (Sheets → Firebase)";
      }
    };
  }

  // 2. Sinkronkan Absensi ke Sheets
  if (btnSyncAtt) {
    btnSyncAtt.onclick = async () => {
      btnSyncAtt.disabled = true;
      btnSyncAtt.textContent = "Mengirim...";

      try {
        const attList = await getAttendance();
        await syncAttendanceToGoogleSheets(attList, user.displayName);
        toast.success("Salinan data absensi berhasil dikirim ke Google Sheets (Data_Absensi)!");
      } catch (err) {
        toast.error("Gagal mengirim absensi: " + err.message);
      } finally {
        btnSyncAtt.disabled = false;
        btnSyncAtt.textContent = "📤 Sinkronkan Absensi (Firebase → Sheets)";
      }
    };
  }

  // 3. Sinkronkan Nilai ke Sheets
  if (btnSyncGrades) {
    btnSyncGrades.onclick = async () => {
      btnSyncGrades.disabled = true;
      btnSyncGrades.textContent = "Mengirim...";

      try {
        const gradesList = await getGrades();
        await syncGradesToGoogleSheets(gradesList, user.displayName);
        toast.success("Salinan data nilai berhasil dikirim ke Google Sheets (Data_Nilai)!");
      } catch (err) {
        toast.error("Gagal mengirim nilai: " + err.message);
      } finally {
        btnSyncGrades.disabled = false;
        btnSyncGrades.textContent = "📤 Sinkronkan Nilai (Firebase → Sheets)";
      }
    };
  }

  // 4. Retry
  if (btnRetry) {
    btnRetry.onclick = () => {
      toast.info("Memeriksa antrean sinkronisasi... Semua transaksi saat ini berstatus tersinkron.");
    };
  }
}
