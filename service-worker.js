const CACHE_NAME = 'led-v3';
const FILES_TO_CACHE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Ağ öncelikli strateji
self.addEventListener('fetch', e => {
  // NodeMCU isteklerini (led, status) asla önbellekten verme
  if (e.request.url.includes('/led') || e.request.url.includes('/status')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
