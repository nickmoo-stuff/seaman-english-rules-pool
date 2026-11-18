const CACHE = 'seamen-pool-v1.0.0-shell-v1';
const CACHE_PREFIX = 'seamen-pool-';
const SHELL = [
  "./assets/scenes/captain-blackball-main.png",
  "./chapter4.js",
  "./chapter4-runtime.js",
  "./chapter4.css",
  "./assets/k4/01_Vile_Blue_Hedgehog_approved.png",
  "./assets/k4/02_Filthy_Youth_With_Phone_approved.png",
  "./assets/k4/03_Socks_And_Sandals_approved.png",
  "./assets/k4/04_Most_Evil_Creature_Imaginable_approved.png",
  "./assets/k4/05_Lucy_Fir_Adobe_Express_Cutout.png",
  "./assets/k4/06_Shared_Fiery_Pits_Theatre.png",
  "./assets/k4/07_Lucy_Dungeon_Theatre.png",
  "./assets/k4/08_Spinball_Wizard_Lair_Theatre.png",
  "./assets/k4/09_spinball_wizard_2s.gif",
  "./assets/k4/09_spinball_wizard_2s.webp",
  "./assets/k4/Lucy Fir challenge.mp3",

  './', './index.html', './style.css', './game.js', './supporter.js', './theatre.js', './spin-physics.js', './layout.js', './layout.css', './dialogue.js', './about.js',
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
