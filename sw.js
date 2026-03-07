const CACHE_NAME = 'fitti-v4';
const URLS_TO_CACHE = [
  './trainingsplan.html',
  './index.html',
  './gerichte.json',
  './fonts/spacegrotesk-latin.woff2',
  './fonts/spacegrotesk-latin-ext.woff2',
  './fonts/spacegrotesk-vietnamese.woff2',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isHTML = event.request.destination === 'document' || url.pathname.endsWith('.html');
  const isJSON = url.pathname.endsWith('.json') && url.origin === self.location.origin;
  const isSameOrigin = url.origin === self.location.origin;

  if ((isHTML || isJSON) && isSameOrigin) {
    // Network-first für HTML: immer aktuelle Version, Cache als Offline-Fallback
    event.respondWith(
      fetch(event.request)
        .then(r => {
          const clone = r.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return r;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first für externe Ressourcen (Fonts etc.)
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
