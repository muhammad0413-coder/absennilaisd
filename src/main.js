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

// 1. Bersihkan & Hapus Service Worker Lama agar pembaruan selalu tampil langsung
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  }).catch(() => {});
}

if ('caches' in window) {
  caches.keys().then((names) => {
    for (let name of names) {
      caches.delete(name);
    }
  }).catch(() => {});
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
