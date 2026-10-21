// 诗阵 Service Worker - 离线缓存
const CACHE_NAME = 'poetry-arena-v42';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=42',
  './scores.js?v=42',
  './rare-chars-db.js?v=42',
  './rare-chars.js?v=42',
  './poetry-extra-tang.js?v=42',
  './poetry-extra-songci.js?v=42',
  './poetry-extra-classic.js?v=42',
  './poetry-db.js?v=42',
  './fly-flower.js?v=42',
  './chain.js?v=42',
  './idiom-db.js?v=42',
  './idiom-chain.js?v=42',
  './word-bank.js?v=42',
  './bomb.js?v=42',
  './bomb-online.js?v=42',
  './daily-challenge.js?v=42',
  './name-generator.js?v=42',
  './app.js?v=42',
  './manifest.json?v=42'
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
