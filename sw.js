// 诗阵 Service Worker - 离线缓存
const CACHE_NAME = 'poetry-arena-v36';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=36',
  './scores.js?v=36',
  './rare-chars-db.js?v=36',
  './rare-chars.js?v=36',
  './poetry-extra-tang.js?v=36',
  './poetry-extra-songci.js?v=36',
  './poetry-extra-classic.js?v=36',
  './poetry-db.js?v=36',
  './fly-flower.js?v=36',
  './chain.js?v=36',
  './idiom-db.js?v=36',
  './idiom-chain.js?v=36',
  './word-bank.js?v=36',
  './bomb.js?v=36',
  './bomb-online.js?v=36',
  './daily-challenge.js?v=36',
  './name-generator.js?v=36',
  './app.js?v=36',
  './manifest.json?v=36'
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
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // 同源静态资源动态缓存（字体等）
        if (resp.ok && new URL(e.request.url).origin === self.location.origin) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
