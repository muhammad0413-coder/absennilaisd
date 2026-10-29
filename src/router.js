/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * CLIENT-SIDE ROUTER & ACCESS GUARD (src/router.js)
 * ==============================================================================
 */

import { getCurrentUser } from './auth.js';
import { isAdmin, isTeacher } from './permissions.js';
import { renderNavbar, attachNavbarEvents } from './components/Navbar.js';
import { renderSidebar } from './components/Sidebar.js';
import { toast } from './components/Toast.js';

// Import Pages
import { renderStudentPublicPage, attachStudentPublicEvents } from './pages/StudentPublicPage.js';
import { renderLoginPage, attachLoginEvents } from './pages/LoginPage.js';
import { renderAdminDashboard, attachAdminDashboardEvents } from './pages/AdminDashboard.js';
import { renderTeacherDashboard, attachTeacherDashboardEvents } from './pages/TeacherDashboard.js';
import { renderTeacherProfile, attachTeacherProfileEvents } from './pages/TeacherProfile.js';
import { renderAttendancePage, attachAttendanceEvents } from './pages/AttendancePage.js';
import { renderGradesPage, attachGradesEvents } from './pages/GradesPage.js';
import { renderSchedulePage, attachScheduleEvents } from './pages/SchedulePage.js';
import { renderAnnouncementsPage, attachAnnouncementsEvents } from './pages/AnnouncementsPage.js';
import { renderSyncStatusPage, attachSyncStatusEvents } from './pages/SyncStatusPage.js';
import { renderAuditLogPage, attachAuditLogEvents } from './pages/AuditLogPage.js';
import { renderSettingsPage, attachSettingsEvents } from './pages/SettingsPage.js';

export async function navigateTo(hash = window.location.hash || '#student') {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  const user = getCurrentUser();
  const cleanHash = hash.split('?')[0];

  // ============================================================================
  // ROUTE ACCESS GUARDS
  // ============================================================================

  // Halaman Publik Siswa
  if (cleanHash === '#student' || cleanHash === '' || cleanHash === '#') {
    appContainer.innerHTML = await renderStudentPublicPage(null);
    attachStudentPublicEvents(null);
    return;
  }
  if (cleanHash === '#student-kelas_1') {
    appContainer.innerHTML = await renderStudentPublicPage('kelas_1');
    attachStudentPublicEvents('kelas_1');
    return;
  }
  if (cleanHash === '#student-kelas_6') {
    appContainer.innerHTML = await renderStudentPublicPage('kelas_6');
    attachStudentPublicEvents('kelas_6');
    return;
  }

  // Halaman Login
  if (cleanHash === '#login') {
    if (user) {
      // Jika sudah login, alihkan ke dashboard masing-masing
      window.location.hash = isAdmin(user) ? '#admin-dashboard' : '#teacher-dashboard';
      return;
    }
    appContainer.innerHTML = renderLoginPage();
    attachLoginEvents();
    return;
  }

  // Rute Terproteksi: Memerlukan Autentikasi
  if (!user) {
    toast.warning("Silakan masuk terlebih dahulu untuk mengakses menu staf.");
    window.location.hash = '#login';
    return;
  }

  // Pengalihan Umum `#dashboard`
  if (cleanHash === '#dashboard') {
    window.location.hash = isAdmin(user) ? '#admin-dashboard' : '#teacher-dashboard';
    return;
  }

  // Proteksi Menu Khusus Admin
  const adminOnlyRoutes = ['#admin-dashboard', '#sync', '#logs', '#settings', '#teachers', '#classes', '#accounts', '#documents'];
  if (adminOnlyRoutes.includes(cleanHash) && !isAdmin(user)) {
    toast.error("Akses Ditolak: Anda tidak memiliki izin administratif.");
    window.location.hash = '#teacher-dashboard';
    return;
  }

  // ============================================================================
  // RENDER APPS SHELL (SIDEBAR + TOPBAR + PAGE CONTENT)
  // ============================================================================
  let pageTitle = "Dashboard";
  let contentHtml = "";
  let attachEvents = () => {};

  switch (cleanHash) {
    case '#admin-dashboard':
      pageTitle = "Dashboard Administrator";
      contentHtml = await renderAdminDashboard();
      attachEvents = attachAdminDashboardEvents;
      break;

    case '#teacher-dashboard':
      pageTitle = `Dashboard ${user.kelas_id === 'kelas_1' ? 'Kelas 1' : 'Kelas 6'}`;
      contentHtml = await renderTeacherDashboard();
      attachEvents = attachTeacherDashboardEvents;
      break;

    case '#students':
      if (isAdmin(user)) {
        // Admin melihat dashboard data siswa menyeluruh
        pageTitle = "Pengelolaan Siswa (Kelas 1 & Kelas 6)";
        contentHtml = await renderTeacherDashboard(); // Reusable student table engine
        attachEvents = attachTeacherDashboardEvents;
      } else {
        pageTitle = `Data Siswa ${user.kelas_id === 'kelas_1' ? 'Kelas 1' : 'Kelas 6'}`;
        contentHtml = await renderTeacherDashboard();
        attachEvents = attachTeacherDashboardEvents;
      }
      break;

    case '#profile':
      pageTitle = "Profil Guru & Ganti Foto";
      contentHtml = await renderTeacherProfile();
      attachEvents = attachTeacherProfileEvents;
      break;

    case '#attendance':
      pageTitle = "Presensi & Kehadiran Siswa";
      contentHtml = await renderAttendancePage();
      attachEvents = attachAttendanceEvents;
      break;

    case '#grades':
      pageTitle = "Penilaian Siswa Kurikulum Merdeka";
      contentHtml = await renderGradesPage();
      attachEvents = attachGradesEvents;
      break;

    case '#schedule':
      pageTitle = "Jadwal Pelajaran Sekolah";
      contentHtml = await renderSchedulePage();
      attachEvents = attachScheduleEvents;
      break;

    case '#announcements':
      pageTitle = "Pengumuman Sekolah & Kelas";
      contentHtml = await renderAnnouncementsPage();
      attachEvents = attachAnnouncementsEvents;
      break;

    case '#reports':
      pageTitle = "Cetak Laporan Akademik";
      // Defaults to attendance with print buttons
      contentHtml = await renderAttendancePage();
      attachEvents = attachAttendanceEvents;
      break;

    case '#sync':
      pageTitle = "Status Sinkronisasi Database";
      contentHtml = await renderSyncStatusPage();
      attachEvents = attachSyncStatusEvents;
      break;

    case '#logs':
      pageTitle = "Log Audit Aktivitas Sistem";
      contentHtml = await renderAuditLogPage();
      attachEvents = attachAuditLogEvents;
      break;

    case '#settings':
      pageTitle = "Pengaturan Identitas Sekolah";
      contentHtml = await renderSettingsPage();
      attachEvents = attachSettingsEvents;
      break;

    default:
      pageTitle = "Halaman Tidak Ditemukan";
      contentHtml = `
        <div class="page-content">
          <div class="card" style="text-align: center; padding: 3rem;">
            <h2>404 - Halaman Tidak Ditemukan</h2>
            <p style="color: #64748b; margin: 1rem 0;">Halaman dengan tautan <code>${cleanHash}</code> tidak ditemukan.</p>
            <a href="#dashboard" class="btn btn-primary">Kembali ke Dashboard</a>
          </div>
        </div>
      `;
      break;
  }

  // Demo Banner Notice jika akun demonstrasi aktif
  const demoBannerHtml = user?.is_demo ? `
    <div class="demo-banner no-print">
      <span>⚠️ <strong>Mode Demonstrasi:</strong> Akun pengujian (${user.email}) aktif. Semua perubahan tersimpan interaktif di database lokal & terisolasi.</span>
      <span style="font-size: 0.75rem; background: rgba(0,0,0,0.08); padding: 2px 8px; border-radius: 4px;">DEMO VERIFIED</span>
    </div>
  ` : '';

  // Render Full Protected App Layout
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

  // Attach navbar & page-specific event handlers
  attachNavbarEvents();
  attachEvents();
}
