/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * DASHBOARD MODERN (src/pages/DashboardPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin, isHeadmaster, isTeacher, CLASS_LABELS } from '../permissions.js';
import { getStudents, getAttendance, getGrades, getSyncStatusSummary, getSettings } from '../services.js';

export async function renderDashboardPage() {
  const user = getCurrentUser();
  const settings = await getSettings();
  const syncStatus = await getSyncStatusSummary();

  const userIsGuru = isTeacher(user);
  const activeClass = userIsGuru ? user.kelas_id : null;

  // Ambil data siswa
  const allStudents = await getStudents(activeClass, 'semua');
  const activeStudents = allStudents.filter(s => s.Status_Siswa === 'Aktif');

  // Kehadiran hari ini
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayAttendance = await getAttendance(activeClass, todayStr);
  const hadirCount = todayAttendance.filter(a => a.Status_Absensi === 'Hadir').length;
  const sakitCount = todayAttendance.filter(a => a.Status_Absensi === 'Sakit').length;
  const izinCount = todayAttendance.filter(a => a.Status_Absensi === 'Izin').length;
  const alpaCount = todayAttendance.filter(a => a.Status_Absensi === 'Alpa').length;

  const totalTercatatHariIni = todayAttendance.length;
  const persentaseKehadiranHariIni = totalTercatatHariIni > 0
    ? Math.round((hadirCount / totalTercatatHariIni) * 100)
    : 0;

  // Nilai
  const allGrades = await getGrades(activeClass);

  // Distribusi siswa per kelas (1-6)
  const classCounts = {};
  for (let c = 1; c <= 6; c++) {
    const kKey = `kelas_${c}`;
    classCounts[kKey] = allStudents.filter(s => String(s.Kelas) === String(c) && s.Status_Siswa === 'Aktif').length;
  }

  return `
    <div class="page-content">
      <!-- Header Banner Identitas Sekolah -->
      <div class="card" style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: white; border: none; padding: 1.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span class="badge badge-info">Tahun Ajaran: ${settings.tahun_pelajaran_aktif || '2026/2027'}</span>
              <span class="badge badge-warning">Semester: ${settings.semester_aktif || '1 (Ganjil)'}</span>
            </div>
            <h2 style="font-size: 1.6rem; font-weight: 800; margin: 0; line-height: 1.2;">
              ${settings.nama_sekolah || "SD NEGERI HARAPAN BANGSA"}
            </h2>
            <p style="font-size: 0.85rem; opacity: 0.85; margin: 4px 0 0 0;">
              Sistem Manajemen Absensi &amp; Nilai Siswa Terpadu Kelas 1 sampai Kelas 6
            </p>
          </div>

          <div style="text-align: right;" class="no-print">
            <span style="font-size: 0.75rem; opacity: 0.75; display: block;">Peran Akses Anda:</span>
            <strong style="font-size: 1rem; color: #38bdf8;">
              ${userIsGuru ? `Wali ${CLASS_LABELS[user.kelas_id]}` : (isHeadmaster(user) ? 'Kepala Sekolah' : 'Administrator')}
            </strong>
          </div>
        </div>
      </div>

      <!-- Ringkasan Statistik Siswa & Kehadiran Hari Ini -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">👥</div>
          <div>
            <div class="stat-val">${activeStudents.length}</div>
            <div class="stat-label">Siswa Aktif ${userIsGuru ? CLASS_LABELS[user.kelas_id] : '(Kelas 1–6)'}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon green">✓</div>
          <div>
            <div class="stat-val">${hadirCount}</div>
            <div class="stat-label">Hadir Hari Ini (${persentaseKehadiranHariIni}%)</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon amber">🏥</div>
          <div>
            <div class="stat-val">${sakitCount + izinCount}</div>
            <div class="stat-label">Sakit &amp; Izin Hari Ini</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon rose">⚠️</div>
          <div>
            <div class="stat-val">${alpaCount}</div>
            <div class="stat-label">Alpa Hari Ini</div>
          </div>
        </div>
      </div>

      <!-- Distribusi Siswa Per Jenjang Kelas (Khusus Admin & Kepala Sekolah) -->
      ${!userIsGuru ? `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🏫 Jumlah Siswa Aktif per Jenjang Kelas</h3>
            <span class="badge badge-neutral">Total: ${activeStudents.length} Siswa</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.75rem; @media(max-width: 768px){grid-template-columns: repeat(3, 1fr);}">
            ${[1, 2, 3, 4, 5, 6].map(c => `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem; text-align: center;">
                <div style="font-size: 0.8rem; font-weight: 600; color: #64748b; margin-bottom: 0.25rem;">KELAS ${c}</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: #1e3a8a;">${classCounts[`kelas_${c}`] || 0}</div>
                <div style="font-size: 0.72rem; color: #94a3b8;">Siswa Aktif</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Status Sinkronisasi & Alur Data -->
      <div class="card" style="border-left: 5px solid #10b981;">
        <div class="card-header">
          <h4 class="card-title">🔄 Status Sinkronisasi Google Sheets &amp; Cloud Firestore</h4>
          <span class="badge badge-success">${syncStatus.status}</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; font-size: 0.85rem;">
          <div>
            <span style="color: #64748b; display: block; font-size: 0.75rem;">SUMBER MASTER DATA SISWA</span>
            <strong style="color: #0f172a;">Google Sheets (Sheet Data_Siswa)</strong>
            <span style="display: block; font-size: 0.75rem; color: #0284c7;">Input manual oleh Admin di Spreadsheet</span>
          </div>
          <div>
            <span style="color: #64748b; display: block; font-size: 0.75rem;">DATABASE OPERASIONAL &amp; REALTIME</span>
            <strong style="color: #0f172a;">Cloud Firestore (attendance, grades)</strong>
            <span style="display: block; font-size: 0.75rem; color: #059669;">Input cepat oleh Guru di Website</span>
          </div>
          <div>
            <span style="color: #64748b; display: block; font-size: 0.75rem;">SALINAN ARSIP LAPORAN</span>
            <strong style="color: #0f172a;">Google Sheets &amp; Google Drive</strong>
            <span style="display: block; font-size: 0.75rem; color: #475569;">Data_Absensi &amp; Data_Nilai</span>
          </div>
          <div>
            <span style="color: #64748b; display: block; font-size: 0.75rem;">WAKTU SINKRONISASI TERAKHIR</span>
            <strong style="color: #0f172a;">${new Date(syncStatus.lastSynced).toLocaleString('id-ID')}</strong>
          </div>
        </div>
      </div>

      <!-- Pintasan Cepat Menu -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;">
        <a href="#attendance" class="card" style="padding: 1.25rem; text-decoration: none; color: inherit; display: flex; align-items: center; gap: 1rem; margin-bottom: 0;">
          <div class="stat-icon green">📅</div>
          <div>
            <strong style="font-size: 0.95rem; color: #0f172a; display: block;">Absensi Harian</strong>
            <span style="font-size: 0.78rem; color: #64748b;">Catat kehadiran siswa hari ini</span>
          </div>
        </a>

        <a href="#grades-input" class="card" style="padding: 1.25rem; text-decoration: none; color: inherit; display: flex; align-items: center; gap: 1rem; margin-bottom: 0;">
          <div class="stat-icon purple">✏️</div>
          <div>
            <strong style="font-size: 0.95rem; color: #0f172a; display: block;">Input Nilai Siswa</strong>
            <span style="font-size: 0.78rem; color: #64748b;">Formatif &amp; Sumatif per mapel</span>
          </div>
        </a>

        <a href="#reports" class="card" style="padding: 1.25rem; text-decoration: none; color: inherit; display: flex; align-items: center; gap: 1rem; margin-bottom: 0;">
          <div class="stat-icon blue">🖨️</div>
          <div>
            <strong style="font-size: 0.95rem; color: #0f172a; display: block;">Cetak Laporan</strong>
            <span style="font-size: 0.78rem; color: #64748b;">Format resmi A4/F4 dengan kop</span>
          </div>
        </a>
      </div>
    </div>
  `;
}
