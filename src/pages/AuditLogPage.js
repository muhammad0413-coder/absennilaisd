/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * AUDIT LOG & AKTIVITAS SISTEM (src/pages/AuditLogPage.js)
 * ==============================================================================
 */

import { getAuditLogs } from '../services.js';
import { exportToCSV } from '../components/ReportPrint.js';
import { toast } from '../components/Toast.js';

export async function renderAuditLogPage() {
  const logs = await getAuditLogs();

  return `
    <div class="page-content">
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title">📜 Log Audit Aktivitas Pengguna</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Jejak audit permanen pencatatan data siswa, absensi, nilai, profil, dan operasi sistem.
            </p>
          </div>

          <button class="btn btn-outline btn-sm" id="btn-export-audit-csv">
            📥 Ekspor Log CSV
          </button>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table" id="table-audit-logs">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Pengguna / Email</th>
                <th>Role</th>
                <th>Aksi</th>
                <th>Jenis Data</th>
                <th>Keterangan / Rincian</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">
                    Belum ada log aktivitas tercatat.
                  </td>
                </tr>
              ` : logs.map(l => `
                <tr>
                  <td style="white-space: nowrap; font-size: 0.8rem; color: #64748b;">
                    ${new Date(l.waktu).toLocaleString('id-ID')}
                  </td>
                  <td><strong>${l.nama_pengguna}</strong></td>
                  <td><span class="badge ${l.role === 'admin' ? 'badge-danger' : 'badge-info'}">${l.role}</span></td>
                  <td><code>${l.aksi}</code></td>
                  <td><span class="badge badge-neutral">${l.jenis_data}</span></td>
                  <td style="font-size: 0.82rem; color: #334155;">${l.keterangan || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function attachAuditLogEvents() {
  const btnExport = document.getElementById('btn-export-audit-csv');
  if (btnExport) {
    btnExport.onclick = async () => {
      const logs = await getAuditLogs();
      exportToCSV("AuditLog_SD_HarapanBangsa", logs);
      toast.success("Log audit berhasil diekspor ke CSV!");
    };
  }
}
