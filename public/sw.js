// Service Worker for Sistem Informasi Absensi & Penilaian SD
const CACHE_NAME = 'sd-absen-nilai-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Install: Cache essential shell assets only (never cache private student data)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for dynamic content / API / Firestore, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Do not intercept or cache POST/PUT/DELETE requests or Firebase/Google API calls
  if (
    event.request.method !== 'GET' ||
    requestUrl.origin.includes('firestore.googleapis.com') ||
    requestUrl.origin.includes('identitytoolkit.googleapis.com') ||
    requestUrl.origin.includes('script.google.com') ||
    requestUrl.origin.includes('googleusercontent.com')
  ) {
    return;
  }

  // Handle static app shell with stale-while-revalidate
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
      }).catch(() => {
        // If offline and request is HTML navigation, fallback to cached index.html
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});
