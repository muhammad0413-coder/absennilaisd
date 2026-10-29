/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * APPLICATION BOOTSTRAP (src/main.js)
 * ==============================================================================
 */

import './style.css';
import { onAuthChanged } from './auth.js';
import { navigateTo } from './router.js';
import { toast } from './components/Toast.js';
import { fetchLatestStudentsIfConfigured } from './services.js';

// 1. Registrasi Progressive Web App (PWA) Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker aktif terdaftar:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Gagal mendaftarkan Service Worker:', err);
      });
  });
}

// 2. Monitoring Status Jaringan Online / Offline
window.addEventListener('online', () => {
  toast.success("Koneksi internet kembali terhubung.");
  fetchLatestStudentsIfConfigured().catch(() => {});
  navigateTo(window.location.hash);
});

window.addEventListener('offline', () => {
  toast.warning("Koneksi internet terputus. Sistem berjalan dalam mode offline.");
  navigateTo(window.location.hash);
});

// 3. Routing Listener (Hash Change)
window.addEventListener('hashchange', () => {
  navigateTo(window.location.hash);
});

// 4. Auth State Listener
onAuthChanged(() => {
  navigateTo(window.location.hash || '');
});

// 5. Initial Mount (Booting Langsung Tanpa Menunggu jika DOM sudah siap)
function bootApp() {
  navigateTo(window.location.hash || '');
  fetchLatestStudentsIfConfigured().catch(() => {});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}
