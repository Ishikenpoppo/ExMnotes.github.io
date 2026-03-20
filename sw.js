/* ExMnotes Service Worker — cache-first strategy */
const CACHE_NAME = 'exmnotes-v2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/tokens.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/graph.css',
  './css/transitions.css',
  './js/app.js',
  './js/router.js',
  './js/i18n.js',
  './js/store.js',
  './js/db/idb.js',
  './js/data/schema.js',
  './js/views/home.js',
  './js/views/capture.js',
  './js/views/library.js',
  './js/views/graph.js',
  './js/views/review.js',
  './js/components/bottomBar.js',
  './js/components/modal.js',
  './js/components/toast.js',
  './js/components/noteCard.js',
  './js/components/noteEditor.js',
  './js/components/graphRenderer.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Precache assets individually to avoid total failure on missing optional files
      await Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn('[SW] Could not precache:', url, err))
        )
      );
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin resources
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
        return response;
      }).catch(() => {
        // Fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
