/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * DASHBOARD ADMINISTRATOR UTAMA (src/pages/AdminDashboard.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { 
  getStudents, 
  getAttendance, 
  getGrades, 
  getSyncStatus, 
  triggerSyncNow, 
  getAuditLogs, 
  getSettings 
} from '../services.js';
import { toast } from '../components/Toast.js';

export async function renderAdminDashboard() {
  const user = getCurrentUser();
  const settings = await getSettings();

  const studentsK1 = await getStudents('kelas_1');
  const studentsK6 = await getStudents('kelas_6');
  const activeK1 = studentsK1.filter(s => s.status_aktif === 'aktif').length;
  const activeK6 = studentsK6.filter(s => s.status_aktif === 'aktif').length;

  const todayStr = new Date().toISOString().substring(0, 10);
  const attendanceK1 = await getAttendance('kelas_1', todayStr);
  const attendanceK6 = await getAttendance('kelas_6', todayStr);

  const gradesK1 = await getGrades('kelas_1');
  const gradesK6 = await getGrades('kelas_6');

  const syncInfo = await getSyncStatus();
  const auditLogs = await getAuditLogs();

  return `
    <div class="page-content">
      <!-- Banner Admin -->
      <div class="card" style="background: linear-gradient(135deg, #0f172a, #1e3a8a); color: white; border: none; padding: 1.75rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span class="badge badge-danger">Administrator Pusat</span>
              <span style="font-size: 0.8rem; color: #94a3b8;">${settings.npsn ? `NPSN: ${settings.npsn}` : ''}</span>
            </div>
            <h2 style="font-size: 1.6rem; font-weight: 800; margin: 0; line-height: 1.2;">
              ${settings.nama_sekolah || "SD NEGERI HARAPAN BANGSA"}
            </h2>
            <p style="font-size: 0.85rem; opacity: 0.85; margin: 4px 0 0 0;">
              Pusat Kendali Terpadu Kelas 1 & Kelas 6 | Google Sheets, Cloud Firestore & Google Drive
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem;" class="no-print">
            <button class="btn btn-accent btn-sm" id="btn-admin-sync-now">
              🔄 Sinkronkan Sekarang
            </button>
            <a href="#settings" class="btn btn-outline btn-sm" style="color: white; border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.1);">
              ⚙️ Pengaturan
            </a>
          </div>
        </div>
      </div>

      <!-- Ringkasan Statistik Kelas 1 & Kelas 6 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">1️⃣</div>
          <div>
            <div class="stat-val">${activeK1}</div>
            <div class="stat-label">Siswa Aktif Kelas 1</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon amber">6️⃣</div>
          <div>
            <div class="stat-val">${activeK6}</div>
            <div class="stat-label">Siswa Aktif Kelas 6</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon green">📅</div>
          <div>
            <div class="stat-val">${attendanceK1.length + attendanceK6.length}</div>
            <div class="stat-label">Presensi Hari Ini (K1 + K6)</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon purple">📝</div>
          <div>
            <div class="stat-val">${gradesK1.length + gradesK6.length}</div>
            <div class="stat-label">Total Nilai Masuk</div>
          </div>
        </div>
      </div>

      <!-- Status Sinkronisasi Realtime & Integrasi -->
      <div class="card" style="border-left: 5px solid #10b981;">
        <div class="card-header" style="margin-bottom: 0.5rem; padding-bottom: 0.5rem;">
          <h4 class="card-title">🔄 Status Sinkronisasi Database (Sheets ↔ Firestore)</h4>
          <span class="badge badge-success">Terpantau Aktif</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; font-size: 0.85rem; color: #475569; padding-top: 0.5rem;">
          <div>
            <span style="color: #64748b; display: block; font-size: 0.75rem;">DATABASE UTAMA (MASTER)</span>
            <strong style="color: #0f172a;">Google Sheets (11 Sheets Terverifikasi)</strong>
          </div>
          <div>
            <span style="color: #64748b; display: block; font-size: 0.75rem;">CACHE CEPAT & REALTIME</span>
            <strong style="color: #0f172a;">Cloud Firestore & Service Worker</strong>
          </div>
          <div>
            <span style="color: #64748b; display: block; font-size: 0.75rem;">SINKRONISASI TERAKHIR</span>
            <strong style="color: #0f172a;">${new Date(syncInfo.last_synced).toLocaleString('id-ID')}</strong>
          </div>
        </div>
      </div>

      <!-- Dua Kolom: Pintasan Manajemen & Audit Log Terbaru -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; @media(max-width: 800px){grid-template-columns: 1fr;}">
        <!-- Modul Pintasan Admin -->
        <div class="card">
          <div class="card-header">
            <h4 class="card-title">⚡ Menu Akses Cepat Admin</h4>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            <a href="#students" class="btn btn-outline" style="justify-content: flex-start; text-align: left; padding: 0.75rem 1rem;">
              👥 <strong>Kelola Data Siswa</strong> - Tambah, edit, dan mutasi siswa K1 & K6
            </a>
            <a href="#attendance" class="btn btn-outline" style="justify-content: flex-start; text-align: left; padding: 0.75rem 1rem;">
              📅 <strong>Rekap Presensi Sekolah</strong> - Cek kehadiran harian & bulanan
            </a>
            <a href="#grades" class="btn btn-outline" style="justify-content: flex-start; text-align: left; padding: 0.75rem 1rem;">
              📝 <strong>Rekapitulasi Nilai</strong> - Publikasi nilai formatif & sumatif
            </a>
            <a href="#schedule" class="btn btn-outline" style="justify-content: flex-start; text-align: left; padding: 0.75rem 1rem;">
              ⏱️ <strong>Jadwal Pelajaran</strong> - Atur jam mengajar guru K1 & K6
            </a>
            <a href="#sync" class="btn btn-outline" style="justify-content: flex-start; text-align: left; padding: 0.75rem 1rem;">
              🔄 <strong>Panel Sinkronisasi Detail</strong> - Monitor riwayat Sheets-Firestore
            </a>
          </div>
        </div>

        <!-- Log Aktivitas Terbaru -->
        <div class="card">
          <div class="card-header">
            <h4 class="card-title">📜 Log Aktivitas Terbaru</h4>
            <a href="#logs" style="font-size: 0.8rem; color: #2563eb; text-decoration: none;">Lihat Semua →</a>
          </div>
          <div style="max-height: 280px; overflow-y: auto;">
            ${auditLogs.length === 0 ? `
              <p style="color: #64748b; font-size: 0.85rem; text-align: center; padding: 1.5rem 0;">Belum ada aktivitas tercatat.</p>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 0.6rem;">
                ${auditLogs.slice(0, 5).map(l => `
                  <div style="padding: 0.65rem 0.85rem; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 0.8rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                      <strong style="color: #0f172a;">${l.aksi}</strong>
                      <span style="font-size: 0.72rem; color: #64748b;">${new Date(l.waktu).toLocaleTimeString('id-ID')}</span>
                    </div>
                    <div style="color: #475569;">${l.keterangan || '-'}</div>
                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">Oleh: ${l.nama_pengguna} (${l.role})</div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachAdminDashboardEvents() {
  const user = getCurrentUser();
  const btnSync = document.getElementById('btn-admin-sync-now');

  if (btnSync) {
    btnSync.onclick = async () => {
      btnSync.disabled = true;
      btnSync.textContent = "Menyinkronkan...";

      try {
        const res = await triggerSyncNow(user);
        toast.success(res.message);
        // Refresh dashboard view
        window.location.reload();
      } catch (err) {
        toast.error("Gagal sinkronisasi: " + err.message);
      } finally {
        btnSync.disabled = false;
        btnSync.textContent = "🔄 Sinkronkan Sekarang";
      }
    };
  }
}
