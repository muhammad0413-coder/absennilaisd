/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * SIDEBAR NAVIGATION COMPONENT (src/components/Sidebar.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin, isHeadmaster, isTeacher, getRoleBadge, CLASS_LABELS } from '../permissions.js';

export function renderSidebar(currentRoute = '#dashboard') {
  const user = getCurrentUser();
  if (!user) return '';

  const roleBadge = getRoleBadge(user);
  const userIsAdmin = isAdmin(user);
  const userIsKepsek = isHeadmaster(user);
  const userIsGuru = isTeacher(user);

  let navLinks = '';

  // 1. Dashboard (Semua role)
  navLinks += `
    <a href="#dashboard" class="sidebar-nav-link ${currentRoute === '#dashboard' || currentRoute === '' ? 'active' : ''}">
      <span>📊</span> <span>Dashboard</span>
    </a>
    <a href="#student" class="sidebar-nav-link ${currentRoute === '#student' ? 'active' : ''}">
      <span>🌐</span> <span>Lihat Portal Siswa</span>
    </a>
  `;

  // 2. Data Siswa (Semua role - Read-only di website)
  navLinks += `
    <a href="#students" class="sidebar-nav-link ${currentRoute === '#students' ? 'active' : ''}">
      <span>👥</span> <span>Data Siswa ${userIsGuru ? `(${CLASS_LABELS[user.kelas_id]})` : '(K1–K6)'}</span>
    </a>
  `;

  // 3 & 4. Absensi Harian & Rekap Absensi
  if (userIsAdmin || userIsGuru) {
    navLinks += `
      <div class="sidebar-nav-label">Presensi</div>
      <a href="#attendance" class="sidebar-nav-link ${currentRoute === '#attendance' ? 'active' : ''}">
        <span>📅</span> <span>Absensi Harian</span>
      </a>
      <a href="#attendance-recap" class="sidebar-nav-link ${currentRoute === '#attendance-recap' ? 'active' : ''}">
        <span>📈</span> <span>Rekap Absensi</span>
      </a>
    `;
  } else if (userIsKepsek) {
    navLinks += `
      <div class="sidebar-nav-label">Presensi</div>
      <a href="#attendance-recap" class="sidebar-nav-link ${currentRoute === '#attendance-recap' ? 'active' : ''}">
        <span>📈</span> <span>Rekap Absensi K1–K6</span>
      </a>
    `;
  }

  // 5 & 6. Input Nilai & Rekap Nilai
  if (userIsAdmin || userIsGuru) {
    navLinks += `
      <div class="sidebar-nav-label">Penilaian</div>
      <a href="#grades-input" class="sidebar-nav-link ${currentRoute === '#grades-input' ? 'active' : ''}">
        <span>✏️</span> <span>Input Nilai</span>
      </a>
      <a href="#grades-recap" class="sidebar-nav-link ${currentRoute === '#grades-recap' ? 'active' : ''}">
        <span>📝</span> <span>Rekap Nilai Siswa</span>
      </a>
    `;
  } else if (userIsKepsek) {
    navLinks += `
      <div class="sidebar-nav-label">Penilaian</div>
      <a href="#grades-recap" class="sidebar-nav-link ${currentRoute === '#grades-recap' ? 'active' : ''}">
        <span>📝</span> <span>Rekap Nilai K1–K6</span>
      </a>
    `;
  }

  // 7. Cetak Laporan (Semua role)
  navLinks += `
    <div class="sidebar-nav-label">Pelaporan Resmi</div>
    <a href="#reports" class="sidebar-nav-link ${currentRoute === '#reports' ? 'active' : ''}">
      <span>🖨️</span> <span>Cetak Laporan</span>
    </a>
  `;

  // 8, 9, 10. Menu Khusus Administrator
  if (userIsAdmin) {
    navLinks += `
      <div class="sidebar-nav-label">Administrasi Sistem</div>
      <a href="#sync" class="sidebar-nav-link ${currentRoute === '#sync' ? 'active' : ''}">
        <span>🔄</span> <span>Sinkronisasi Data</span>
      </a>
      <a href="#users" class="sidebar-nav-link ${currentRoute === '#users' ? 'active' : ''}">
        <span>🔐</span> <span>Pengguna & Hak Akses</span>
      </a>
      <a href="#settings" class="sidebar-nav-link ${currentRoute === '#settings' ? 'active' : ''}">
        <span>⚙️</span> <span>Pengaturan Sistem</span>
      </a>
    `;
  }

  return `
    <aside class="sidebar no-print">
      <div class="sidebar-header">
        <div class="sidebar-brand-icon">SD</div>
        <div>
          <div class="sidebar-brand-title">SI Absen &amp; Nilai</div>
          <div class="sidebar-brand-sub">Kelas 1 – 6 Terpadu</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        ${navLinks}
      </nav>

      <div class="sidebar-user">
        <div class="sidebar-user-avatar">
          ${user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
        </div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${user.displayName}</div>
          <div class="sidebar-user-role">
            <span class="badge ${roleBadge.class}" style="font-size: 0.68rem; padding: 1px 6px;">
              ${roleBadge.label}
            </span>
          </div>
        </div>
      </div>
    </aside>
  `;
}
