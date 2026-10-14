// 诗阵 Service Worker - 离线缓存
const CACHE_NAME = 'poetry-arena-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/poetry-db.js',
  './js/fly-flower.js',
  './js/chain.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(resp => {
        // 只缓存同源请求
        if (e.request.url.startsWith(location.origin)) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
