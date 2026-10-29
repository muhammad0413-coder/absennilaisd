// Service Worker for Sistem Informasi Absensi & Penilaian SD SDN KESILIR 02
const CACHE_NAME = 'sd-kesilir02-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/logo-kanan.png',
  '/logo-kiri.png'
];

// Install: Cache essential shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate: Clean up all old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy:
// For navigation (HTML), always NETWORK-FIRST to ensure user sees latest updates immediately.
// For offline fallback, use cached index.html.
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass non-GET, Firebase, external APIs
  if (
    event.request.method !== 'GET' ||
    requestUrl.origin.includes('firestore.googleapis.com') ||
    requestUrl.origin.includes('identitytoolkit.googleapis.com') ||
    requestUrl.origin.includes('script.google.com') ||
    requestUrl.origin.includes('googleusercontent.com')
  ) {
    return;
  }

  const isNavigation = event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
