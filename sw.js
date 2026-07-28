/* ==========================================================================
   ExpenseTracker Pro — Service Worker
   Caches the app shell so the app opens and works fully offline once
   installed. Uses a cache-first strategy for same-origin app files and
   network-first (with cache fallback) for third-party CDN assets.
   ========================================================================== */

const CACHE_VERSION = 'etp-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/style.css',
  './css/responsive.css',
  './css/animation.css',
  './css/dashboard.css',
  './css/transaction.css',
  './css/analytics.css',
  './css/reports.css',
  './css/settings.css',
  './js/storage.js',
  './js/helper.js',
  './js/validation.js',
  './js/theme.js',
  './js/app.js',
  './js/transaction.js',
  './js/dashboard.js',
  './js/analytics.js',
  './js/report.js',
  './js/category.js',
  './js/settings.js',
  './js/export.js',
  './pages/dashboard.html',
  './pages/dashboard',
  './pages/transactions.html',
  './pages/transactions',
  './pages/analytics.html',
  './pages/analytics',
  './pages/reports.html',
  './pages/reports',
  './pages/categories.html',
  './pages/categories',
  './pages/settings.html',
  './pages/settings',
  './pages/about.html',
  './pages/about',
  './assets/favicon/icon-192.png',
  './assets/favicon/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch((err) => {
      console.error('SW install cache error', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    // Cache-first for our own app shell files
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => caches.match('./pages/dashboard'));
      })
    );
  } else {
    // Network-first for CDN assets (fonts, bootstrap, chart.js) with cache fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
