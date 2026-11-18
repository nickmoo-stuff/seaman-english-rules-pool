const CACHE_NAME = 'seamen-pwa-v100-b1595';
const CORE_ASSETS = [
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

  './',
  './index.html',
  './style.css',
  './game.js', './supporter.js', './theatre.js', './spin-physics.js', './layout.js', './layout.css',
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
    url.pathname.endsWith('/chapter4.js') ||
    url.pathname.endsWith('/chapter4-runtime.js') ||
    url.pathname.endsWith('/chapter4.css') ||
    url.pathname.endsWith('/supporter.js') ||
    url.pathname.endsWith('/theatre.js') ||
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
