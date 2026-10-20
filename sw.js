// 诗阵 Service Worker - 离线缓存
const CACHE_NAME = 'poetry-arena-v28';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=28',
  './scores.js?v=28',
  './rare-chars-db.js?v=28',
  './rare-chars.js?v=28',
  './poetry-extra-tang.js?v=28',
  './poetry-extra-songci.js?v=28',
  './poetry-extra-classic.js?v=28',
  './poetry-db.js?v=28',
  './fly-flower.js?v=28',
  './chain.js?v=28',
  './idiom-db.js?v=28',
  './idiom-chain.js?v=28',
  './word-bank.js?v=28',
  './bomb.js?v=28',
  './bomb-online.js?v=28',
  './daily-challenge.js?v=28',
  './app.js?v=28',
  './manifest.json?v=28'
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
