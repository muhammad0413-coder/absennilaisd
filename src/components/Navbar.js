/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * TOP NAVBAR COMPONENT (src/components/Navbar.js)
 * ==============================================================================
 */

import { getCurrentUser, logout } from '../auth.js';
import { getRoleBadge } from '../permissions.js';
import { openProfileModal } from './ProfileModal.js';
import { toast } from './Toast.js';

export function renderNavbar(pageTitle = "Dashboard", isOnline = true) {
  const user = getCurrentUser();
  const roleBadge = user ? getRoleBadge(user) : null;

  return `
    <header class="topbar no-print">
      <div class="topbar-left">
        <button class="btn btn-outline btn-sm mobile-menu-toggle" id="btn-toggle-sidebar" style="padding: 6px 10px;">
          ☰
        </button>
        <h1 class="page-title">${pageTitle}</h1>
      </div>

      <div class="topbar-right">
        <!-- Status Indikator Jaringan -->
        <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: var(--slate-500); padding: 4px 10px; border-radius: var(--radius-full); background: var(--slate-100);">
          <span class="status-pill ${isOnline ? 'online' : 'offline'}"></span>
          <span>${isOnline ? 'Online' : 'Offline'}</span>
        </div>

        ${user ? `
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div style="text-align: right; display: none;" class="desktop-user-info">
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--slate-900);">${user.displayName}</div>
              <span class="badge ${roleBadge.class}">${roleBadge.label}</span>
            </div>

            <button class="btn btn-outline btn-sm" id="btn-navbar-profile" title="Ubah Nama, Email, NIP Profil Guru" style="font-size: 0.8rem; font-weight: 600;">
              👤 Profil
            </button>

            <button class="btn btn-outline btn-sm" id="btn-navbar-logout" title="Keluar / Logout" style="color: var(--accent-rose); border-color: var(--accent-rose-light);">
              🚪 Keluar
            </button>
          </div>
        ` : `
          <a href="#login" class="btn btn-primary btn-sm">
            🔒 Masuk
          </a>
        `}
      </div>
    </header>
  `;
}

export function attachNavbarEvents() {
  const btnProfile = document.getElementById('btn-navbar-profile');
  if (btnProfile) {
    btnProfile.onclick = () => openProfileModal();
  }

  const btnSidebarProfile = document.getElementById('btn-sidebar-profile');
  if (btnSidebarProfile) {
    btnSidebarProfile.onclick = () => openProfileModal();
  }

  const btnLogout = document.getElementById('btn-navbar-logout');
  if (btnLogout) {
    btnLogout.onclick = async () => {
      await logout();
      toast.info("Anda telah keluar dari sistem.");
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
