/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD
 * SIDEBAR NAVIGATION COMPONENT (src/components/Sidebar.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin, isTeacher, getRoleBadge } from '../permissions.js';

export function renderSidebar(currentRoute = '') {
  const user = getCurrentUser();
  if (!user) return ''; // Tidak tampilkan sidebar untuk siswa/publik

  const roleBadge = getRoleBadge(user.role);
  const userIsAdmin = isAdmin(user);
  const teacherClass = user.kelas_id === 'kelas_1' ? 'Kelas 1' : 'Kelas 6';

  let navItems = '';

  if (userIsAdmin) {
    // Menu Lengkap Administrator (14 Menu)
    navItems = `
      <div class="sidebar-nav-label">Utama</div>
      <a href="#admin-dashboard" class="sidebar-nav-link ${currentRoute === '#admin-dashboard' || currentRoute === '' ? 'active' : ''}">
        <span>📊</span> <span>Dashboard</span>
      </a>
      <a href="#students" class="sidebar-nav-link ${currentRoute === '#students' ? 'active' : ''}">
        <span>👥</span> <span>Data Siswa (K1 & K6)</span>
      </a>
      <a href="#teachers" class="sidebar-nav-link ${currentRoute === '#teachers' ? 'active' : ''}">
        <span>👨‍🏫</span> <span>Data Guru</span>
      </a>
      <a href="#classes" class="sidebar-nav-link ${currentRoute === '#classes' ? 'active' : ''}">
        <span>🏫</span> <span>Data Kelas</span>
      </a>

      <div class="sidebar-nav-label">Akademik</div>
      <a href="#attendance" class="sidebar-nav-link ${currentRoute === '#attendance' ? 'active' : ''}">
        <span>📅</span> <span>Absensi Siswa</span>
      </a>
      <a href="#grades" class="sidebar-nav-link ${currentRoute === '#grades' ? 'active' : ''}">
        <span>📝</span> <span>Penilaian Siswa</span>
      </a>
      <a href="#schedule" class="sidebar-nav-link ${currentRoute === '#schedule' ? 'active' : ''}">
        <span>⏱️</span> <span>Jadwal Pelajaran</span>
      </a>
      <a href="#announcements" class="sidebar-nav-link ${currentRoute === '#announcements' ? 'active' : ''}">
        <span>📢</span> <span>Pengumuman</span>
      </a>
      <a href="#reports" class="sidebar-nav-link ${currentRoute === '#reports' ? 'active' : ''}">
        <span>🖨️</span> <span>Cetak Laporan</span>
      </a>

      <div class="sidebar-nav-label">Sistem & Sinkronisasi</div>
      <a href="#documents" class="sidebar-nav-link ${currentRoute === '#documents' ? 'active' : ''}">
        <span>📁</span> <span>Foto & Dokumen Drive</span>
      </a>
      <a href="#accounts" class="sidebar-nav-link ${currentRoute === '#accounts' ? 'active' : ''}">
        <span>🔐</span> <span>Akun Pengguna</span>
      </a>
      <a href="#sync" class="sidebar-nav-link ${currentRoute === '#sync' ? 'active' : ''}">
        <span>🔄</span> <span>Sinkronisasi Data</span>
      </a>
      <a href="#logs" class="sidebar-nav-link ${currentRoute === '#logs' ? 'active' : ''}">
        <span>📜</span> <span>Log Aktivitas</span>
      </a>
      <a href="#settings" class="sidebar-nav-link ${currentRoute === '#settings' ? 'active' : ''}">
        <span>⚙️</span> <span>Pengaturan Sistem</span>
      </a>
    `;
  } else if (isTeacher(user)) {
    // Menu Terisolasi Khusus Guru (Hanya Kelas Yang Ditugaskan)
    navItems = `
      <div class="sidebar-nav-label">Kelas Saya (${teacherClass})</div>
      <a href="#teacher-dashboard" class="sidebar-nav-link ${currentRoute === '#teacher-dashboard' || currentRoute === '' ? 'active' : ''}">
        <span>📊</span> <span>Dashboard ${teacherClass}</span>
      </a>
      <a href="#students" class="sidebar-nav-link ${currentRoute === '#students' ? 'active' : ''}">
        <span>👥</span> <span>Siswa ${teacherClass}</span>
      </a>
      <a href="#attendance" class="sidebar-nav-link ${currentRoute === '#attendance' ? 'active' : ''}">
        <span>📅</span> <span>Absensi ${teacherClass}</span>
      </a>
      <a href="#grades" class="sidebar-nav-link ${currentRoute === '#grades' ? 'active' : ''}">
        <span>📝</span> <span>Nilai Siswa</span>
      </a>
      <a href="#schedule" class="sidebar-nav-link ${currentRoute === '#schedule' ? 'active' : ''}">
        <span>⏱️</span> <span>Jadwal ${teacherClass}</span>
      </a>
      <a href="#announcements" class="sidebar-nav-link ${currentRoute === '#announcements' ? 'active' : ''}">
        <span>📢</span> <span>Pengumuman</span>
      </a>
      <a href="#reports" class="sidebar-nav-link ${currentRoute === '#reports' ? 'active' : ''}">
        <span>🖨️</span> <span>Cetak Laporan</span>
      </a>

      <div class="sidebar-nav-label">Akun Saya</div>
      <a href="#profile" class="sidebar-nav-link ${currentRoute === '#profile' ? 'active' : ''}">
        <span>👤</span> <span>Profil & Ganti Foto</span>
      </a>
    `;
  }

  // Tautan Kembali ke Tampilan Siswa
  navItems += `
    <div style="margin-top: auto; padding-top: 1rem;">
      <a href="#student" class="sidebar-nav-link" style="color: var(--primary-400); background: rgba(2, 132, 199, 0.15);">
        <span>🎒</span> <span>Lihat Halaman Siswa</span>
      </a>
    </div>
  `;

  return `
    <aside class="sidebar no-print">
      <div class="sidebar-header">
        <div class="sidebar-brand-icon">SD</div>
        <div>
          <div class="sidebar-brand-title">SI Absen & Nilai</div>
          <div class="sidebar-brand-sub">SD Harapan Bangsa</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        ${navItems}
      </nav>

      <div class="sidebar-user">
        <div class="sidebar-user-avatar">
          ${user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
        </div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${user.displayName}</div>
          <div class="sidebar-user-role">${roleBadge.label}</div>
        </div>
      </div>
    </aside>
  `;
}
