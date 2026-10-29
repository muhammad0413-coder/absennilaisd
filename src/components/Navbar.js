/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD
 * TOP NAVBAR COMPONENT (src/components/Navbar.js)
 * ==============================================================================
 */

import { getCurrentUser, logout } from '../auth.js';
import { getRoleBadge } from '../permissions.js';
import { toast } from './Toast.js';

export function renderNavbar(pageTitle = "Dashboard", isOnline = true) {
  const user = getCurrentUser();
  const roleBadge = user ? getRoleBadge(user.role) : null;

  return `
    <header class="topbar no-print">
      <div class="topbar-left">
        <button class="btn btn-outline btn-sm mobile-menu-toggle" id="btn-toggle-sidebar" style="display: none; padding: 6px 10px;">
          ☰
        </button>
        <h1 class="page-title">${pageTitle}</h1>
      </div>

      <div class="topbar-right">
        <!-- Status Indikator -->
        <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: var(--slate-500); padding: 4px 8px; border-radius: var(--radius-full); background: var(--slate-100);">
          <span class="status-pill ${isOnline ? 'online' : 'offline'}"></span>
          <span>${isOnline ? 'Terhubung' : 'Offline'}</span>
        </div>

        ${user ? `
          <!-- Info Pengguna & Logout -->
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="text-align: right; display: none; @media(min-width: 640px){display: block;}">
              <div style="font-size: 0.84rem; font-weight: 600; color: var(--slate-900);">${user.displayName}</div>
              <span class="badge ${roleBadge.class}">${roleBadge.label}</span>
            </div>

            <button class="btn btn-outline btn-sm" id="btn-logout" title="Keluar / Logout" style="color: var(--accent-rose); border-color: var(--accent-rose-light);">
              🚪 Keluar
            </button>
          </div>
        ` : `
          <!-- Tombol Login Gembok untuk Halaman Publik Siswa -->
          <a href="#login" class="btn btn-outline btn-sm" title="Login Guru / Admin" style="display: flex; align-items: center; gap: 0.4rem;">
            🔒 <span>Login Staf</span>
          </a>
        `}
      </div>
    </header>
  `;
}

export function attachNavbarEvents() {
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.onclick = async () => {
      await logout();
      toast.info("Anda telah keluar dari akun.");
      window.location.hash = '#student';
    };
  }

  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  if (btnToggleSidebar) {
    btnToggleSidebar.onclick = () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) sidebar.classList.toggle('open');
    };
  }
}
