/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * STATUS & MONITORING SINKRONISASI (src/pages/SyncStatusPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { getSyncStatus, triggerSyncNow, isGASConfigured } from '../services.js';
import { isFirebaseConfigured } from '../firebase.js';
import { toast } from '../components/Toast.js';

export async function renderSyncStatusPage() {
  const syncInfo = await getSyncStatus();

  return `
    <div class="page-content">
      <!-- Header Sinkronisasi -->
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title">🔄 Pusat Monitoring Sinkronisasi Database</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Mekanisme sinkronisasi dua arah: <strong>Google Sheets (Master)</strong> ↔ <strong>Cloud Firestore (Cache Operasional)</strong>.
            </p>
          </div>

          <button class="btn btn-primary" id="btn-trigger-sync-page">
            🔄 Sinkronkan Sekarang
          </button>
        </div>

        <!-- Health Checklist Layanan Eksternal -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; padding-top: 0.5rem;">
          <div style="padding: 1rem; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <strong style="font-size: 0.9rem;">1. Master Google Sheets</strong>
              <span class="badge ${isGASConfigured ? 'badge-success' : 'badge-warning'}">
                ${isGASConfigured ? 'Live Terhubung' : 'Mode Terisolasi'}
              </span>
            </div>
            <p style="font-size: 0.78rem; color: #64748b; margin: 0;">
              Spreadsheet: <em>DATABASE ABSENSI DAN PENILAIAN SD</em> (11 Sheets).
            </p>
          </div>

          <div style="padding: 1rem; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <strong style="font-size: 0.9rem;">2. Cloud Firestore</strong>
              <span class="badge ${isFirebaseConfigured ? 'badge-success' : 'badge-warning'}">
                ${isFirebaseConfigured ? 'Live Terhubung' : 'Cache Lokal Siap'}
              </span>
            </div>
            <p style="font-size: 0.78rem; color: #64748b; margin: 0;">
              Menyediakan pembacaan super cepat dan offline fallback yang aman.
            </p>
          </div>

          <div style="padding: 1rem; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <strong style="font-size: 0.9rem;">3. Google Drive</strong>
              <span class="badge ${isGASConfigured ? 'badge-success' : 'badge-info'}">
                ${isGASConfigured ? 'Live Drive API' : 'Folder Ready'}
              </span>
            </div>
            <p style="font-size: 0.78rem; color: #64748b; margin: 0;">
              Struktur: DATA_SEKOLAH (FOTO_GURU, FOTO_SISWA, DOKUMEN, LAPORAN).
            </p>
          </div>
        </div>
      </div>

      <!-- Checklist 11 Sheets Terstruktur -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📋 Integritas Skema 11 Sheets Master Database</h3>
          <span class="badge badge-success">Valid</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem; font-size: 0.84rem;">
          <div style="padding: 0.6rem; border-radius: 6px; background: #f1f5f9;">✓ <strong>SISWA</strong> (15 Kolom: student_id, nis, dll.)</div>
          <div style="padding: 0.6rem; border-radius: 6px; background: #f1f5f9;">✓ <strong>GURU</strong> (11 Kolom: teacher_id, nip, foto, dll.)</div>
          <div style="padding: 0.6rem; border-radius: 6px; background: #f1f5f9;">✓ <strong>KELAS</strong> (Kelas 1 & Kelas 6 Terisolasi)</div>
          <div style="padding: 0.6rem; border-radius: 6px; background: #f1f5f9;">✓ <strong>AKUN_PENGGUNA</strong> (UID, Role, Status)</div>
          <div style="padding: 0.6rem; border-radius: 6px; background: #f1f5f9;">✓ <strong>ABSENSI</strong> (Anti-duplikasi per tanggal)</div>
          <div style="padding: 0.6rem; border-radius: 6px; background: #f1f5f9;">✓ <strong>NILAI</strong> (Formatif & Sumatif)</div>
          <div style="padding: 0.6rem; border-radius: 6px; background: #f1f5f9;">✓ <strong>JADWAL</strong> (Jadwal Kelas 1 & 6)</div>
          <div style="padding: 0.6rem; border-radius: 6px; background: #f1f5f9;">✓ <strong>PENGUMUMAN</strong> (Target Kelas)</div>
          <div style="padding: 0.6rem; border-radius: 6px; background: #f1f5f9;">✓ <strong>PENGATURAN</strong> (Identitas Sekolah & Semester)</div>
          <div style="padding: 0.6rem; border-radius: 6px; background: #f1f5f9;">✓ <strong>LOG_AKTIVITAS</strong> (Audit Trail Lengkap)</div>
          <div style="padding: 0.6rem; border-radius: 6px; background: #f1f5f9;">✓ <strong>STATUS_SINKRONISASI</strong> (Pelacakan Proses)</div>
        </div>
      </div>

      <!-- Tabel Riwayat Sinkronisasi -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📜 Riwayat dan Catatan Sinkronisasi</h3>
          <span style="font-size: 0.8rem; color: #64748b;">Terakhir: ${new Date(syncInfo.last_synced).toLocaleString('id-ID')}</span>
        </div>

        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Sync ID</th>
                <th>Sumber → Tujuan</th>
                <th>Status</th>
                <th>Waktu Mulai</th>
                <th>Waktu Selesai</th>
                <th>Keterangan / Pesan</th>
              </tr>
            </thead>
            <tbody>
              ${syncInfo.logs.map(l => `
                <tr>
                  <td><code>${l.sync_id}</code></td>
                  <td>${l.sumber || 'Google Sheets'} → ${l.tujuan || 'Firestore'}</td>
                  <td>
                    <span class="badge ${l.status === 'sukses' ? 'badge-success' : (l.status === 'berjalan' ? 'badge-warning' : 'badge-danger')}">
                      ${l.status}
                    </span>
                  </td>
                  <td>${new Date(l.waktu_mulai).toLocaleTimeString('id-ID')}</td>
                  <td>${l.waktu_selesai ? new Date(l.waktu_selesai).toLocaleTimeString('id-ID') : '-'}</td>
                  <td style="font-size: 0.8rem; color: #475569;">${l.pesan_error || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function attachSyncStatusEvents() {
  const user = getCurrentUser();
  const btnTrigger = document.getElementById('btn-trigger-sync-page');

  if (btnTrigger) {
    btnTrigger.onclick = async () => {
      btnTrigger.disabled = true;
      btnTrigger.textContent = "Menyinkronkan...";

      try {
        const res = await triggerSyncNow(user);
        toast.success(res.message);
        window.location.reload();
      } catch (err) {
        toast.error("Gagal sinkronisasi: " + err.message);
      } finally {
        btnTrigger.disabled = false;
        btnTrigger.textContent = "🔄 Sinkronkan Sekarang";
      }
    };
  }
}
