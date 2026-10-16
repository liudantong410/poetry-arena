// 诗阵 Service Worker - 离线缓存
const CACHE_NAME = 'poetry-arena-v10';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=10',
  './poetry-db.js?v=10',
  './fly-flower.js?v=10',
  './chain.js?v=10',
  './idiom-db.js?v=10',
  './idiom-chain.js?v=10',
  './word-bank.js?v=10',
  './bomb.js?v=10',
  './bomb-online.js?v=10',
  './daily-challenge.js?v=10',
  './app.js?v=10',
  './manifest.json?v=10'
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
        // 只缓存同源请求（PeerJS CDN 不缓存）
        if (e.request.method === 'GET' && e.request.url.startsWith(location.origin)) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
