const CACHE = 'system-rpg-v2';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/icon-maskable.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Навигация и бандлы Vite: сеть важнее кэша, иначе телефон залипает на старом коде.
  const isNavigate = request.mode === 'navigate';
  const isAppAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'worker');

  if (isNavigate || isAppAsset) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            const key = isNavigate ? '/index.html' : request;
            caches.open(CACHE).then((c) => c.put(key, copy));
          }
          return res;
        })
        .catch(() => caches.match(isNavigate ? '/index.html' : request)),
    );
    return;
  }

  // Остальная статика (иконки и т.п.): cache-first.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok || res.type === 'opaque') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
