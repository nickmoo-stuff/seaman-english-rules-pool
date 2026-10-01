const CACHE_NAME = 'seamen-pwa-v0143b';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './dialogue.js',
  './about.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './assets/portraits/holly.webp',
  './assets/portraits/sweaty-simon.webp',
  './assets/portraits/tornado-mick.webp',
  './assets/portraits/deckhand-dave.webp',
  './assets/portraits/captain-blackball.webp',
  './assets/portraits/darth-vaper.webp',
  './assets/portraits/ol-cyclops.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('seamen-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isMusic(url) {
  return url.pathname.includes('/assets/music/');
}

function isCoreCode(url) {
  return url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/style.css') ||
    url.pathname.endsWith('/game.js') ||
    url.pathname.endsWith('/dialogue.js') ||
    url.pathname.endsWith('/about.js') ||
    url.pathname.endsWith('/manifest.webmanifest');
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isMusic(url)) return;

  if (request.mode === 'navigate' || isCoreCode(url)) {
    event.respondWith(
      fetch(request, {cache:'no-store'})
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
