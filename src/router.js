/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * CLIENT-SIDE ROUTER & ACCESS GUARD (src/router.js)
 * ==============================================================================
 */

import { getCurrentUser } from './auth.js';
import { isAdmin, isHeadmaster, isTeacher } from './permissions.js';
import { renderNavbar, attachNavbarEvents } from './components/Navbar.js';
import { renderSidebar } from './components/Sidebar.js';
import { toast } from './components/Toast.js';

// Import Pages
import { renderLoginPage, attachLoginEvents } from './pages/LoginPage.js';
import { renderDashboardPage } from './pages/DashboardPage.js';
import { renderStudentsPage, attachStudentsEvents } from './pages/StudentsPage.js';
import { renderAttendanceDailyPage, attachAttendanceDailyEvents } from './pages/AttendanceDailyPage.js';
import { renderAttendanceRecapPage, attachAttendanceRecapEvents } from './pages/AttendanceRecapPage.js';
import { renderGradesInputPage, attachGradesInputEvents } from './pages/GradesInputPage.js';
import { renderGradesRecapPage, attachGradesRecapEvents } from './pages/GradesRecapPage.js';
import { renderReportsPage, attachReportsEvents } from './pages/ReportsPage.js';
import { renderSyncPage, attachSyncEvents } from './pages/SyncPage.js';
import { renderUsersPage, attachUsersEvents } from './pages/UsersPage.js';
import { renderSettingsPage, attachSettingsEvents } from './pages/SettingsPage.js';

export async function navigateTo(hash = window.location.hash || '#dashboard') {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  const user = getCurrentUser();
  const cleanHash = hash.split('?')[0] || '#dashboard';

  // 1. Jika belum login, hanya boleh akses `#login`
  if (!user) {
    if (cleanHash !== '#login') {
      window.location.hash = '#login';
      return;
    }
    appContainer.innerHTML = renderLoginPage();
    attachLoginEvents();
    return;
  }

  // 2. Jika sudah login tetapi membuka `#login`, arahkan ke `#dashboard`
  if (cleanHash === '#login' || cleanHash === '') {
    window.location.hash = '#dashboard';
    return;
  }

  // 3. Proteksi Akses Berdasarkan Role
  const adminOnlyRoutes = ['#sync', '#users', '#settings'];
  if (adminOnlyRoutes.includes(cleanHash) && !isAdmin(user)) {
    toast.error("Akses Ditolak: Fitur ini hanya dapat diakses oleh Administrator.");
    window.location.hash = '#dashboard';
    return;
  }

  // Kepala Sekolah tidak boleh mengakses formulir tulis langsung (input)
  if (isHeadmaster(user) && (cleanHash === '#attendance' || cleanHash === '#grades-input')) {
    toast.warning("Kepala Sekolah memiliki hak akses monitoring & laporan.");
    window.location.hash = cleanHash === '#attendance' ? '#attendance-recap' : '#grades-recap';
    return;
  }

  // 4. Render Halaman Sesuai Route
  let pageTitle = "Dashboard";
  let contentHtml = "";
  let attachEvents = () => {};

  switch (cleanHash) {
    case '#dashboard':
      pageTitle = "Dashboard Sistem";
      contentHtml = await renderDashboardPage();
      break;

    case '#students':
      pageTitle = "Data Induk Siswa (Kelas 1–6)";
      contentHtml = await renderStudentsPage();
      attachEvents = attachStudentsEvents;
      break;

    case '#attendance':
      pageTitle = "Absensi Harian Siswa";
      contentHtml = await renderAttendanceDailyPage();
      attachEvents = attachAttendanceDailyEvents;
      break;

    case '#attendance-recap':
      pageTitle = "Rekapitulasi Kehadiran Siswa";
      contentHtml = await renderAttendanceRecapPage();
      attachEvents = attachAttendanceRecapEvents;
      break;

    case '#grades-input':
      pageTitle = "Input Nilai Siswa";
      contentHtml = await renderGradesInputPage();
      attachEvents = attachGradesInputEvents;
      break;

    case '#grades-recap':
      pageTitle = "Rekapitulasi Nilai Siswa";
      contentHtml = await renderGradesRecapPage();
      attachEvents = attachGradesRecapEvents;
      break;

    case '#reports':
      pageTitle = "Pusat Cetak Laporan Resmi";
      contentHtml = await renderReportsPage();
      attachEvents = attachReportsEvents;
      break;

    case '#sync':
      pageTitle = "Panel Sinkronisasi Data";
      contentHtml = await renderSyncPage();
      attachEvents = attachSyncEvents;
      break;

    case '#users':
      pageTitle = "Pengguna & Hak Akses";
      contentHtml = await renderUsersPage();
      attachEvents = attachUsersEvents;
      break;

    case '#settings':
      pageTitle = "Pengaturan Kurikulum & Sekolah";
      contentHtml = await renderSettingsPage();
      attachEvents = attachSettingsEvents;
      break;

    default:
      pageTitle = "Halaman Tidak Ditemukan";
      contentHtml = `
        <div class="page-content">
          <div class="card" style="text-align: center; padding: 3rem;">
            <h2>404 - Halaman Tidak Ditemukan</h2>
            <p style="color: #64748b; margin: 1rem 0;">Tautan <code>${cleanHash}</code> tidak dikenali sistem.</p>
            <a href="#dashboard" class="btn btn-primary">Kembali ke Dashboard</a>
          </div>
        </div>
      `;
      break;
  }

  // Demo Banner Notice jika akun demonstrasi aktif
  const demoBannerHtml = user?.is_demo ? `
    <div class="demo-banner no-print">
      <span>🧪 <strong>Mode Pengujian / Demo:</strong> Menggunakan akun (${user.email} - ${user.displayName}). Perubahan tersimpan secara interaktif.</span>
      <span style="font-size: 0.72rem; background: rgba(0,0,0,0.08); padding: 2px 8px; border-radius: 4px;">DEMO ACTIVE</span>
    </div>
  ` : '';

  appContainer.innerHTML = `
    <div class="app-container">
      ${renderSidebar(cleanHash)}
      <div class="main-content">
        ${demoBannerHtml}
        ${renderNavbar(pageTitle, navigator.onLine)}
        ${contentHtml}
      </div>
    </div>
  `;

  attachNavbarEvents();
  attachEvents();
}
