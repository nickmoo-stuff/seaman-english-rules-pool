const CACHE = 'seamen-pool-v0.13.0-shell-v2';
const CACHE_PREFIX = 'seamen-pool-';
const SHELL = [
  './', './index.html', './style.css', './game.js', './dialogue.js', './about.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './assets/portraits/darth-vaper.webp', './assets/portraits/holly.webp',
  './assets/portraits/captain-blackball.webp', './assets/portraits/tornado-mick.webp',
  './assets/portraits/sweaty-simon.webp', './assets/portraits/deckhand-dave.webp',
  './assets/portraits/ol-cyclops.webp'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Force a fresh copy of the app shell when a new service worker installs.
    await Promise.all(SHELL.map(async url => {
      try {
        const response = await fetch(new Request(url, { cache: 'reload' }));
        if (response && response.ok) await cache.put(url, response);
      } catch (_) {
        // A missing optional asset must not prevent the updated worker installing.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (_) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl, { ignoreSearch: true });
      if (fallback) return fallback;
    }
    throw _;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Soundtrack remains network-only in 0.13.0; it is deliberately not cached.
  if (url.pathname.includes('/assets/music/')) return;

  const destination = event.request.destination;
  const isMutableAppFile =
    event.request.mode === 'navigate' ||
    destination === 'document' ||
    destination === 'style' ||
    destination === 'script' ||
    url.pathname.endsWith('.webmanifest') ||
    url.pathname.endsWith('/manifest.webmanifest');

  if (isMutableAppFile) {
    event.respondWith(networkFirst(event.request, event.request.mode === 'navigate' ? './index.html' : null));
    return;
  }

  // Static artwork can remain cache-first once fetched.
  event.respondWith(cacheFirst(event.request));
});
