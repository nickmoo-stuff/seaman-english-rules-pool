const CACHE = 'seamen-pool-v0.13.0-shell';
const SHELL = [
  './', './index.html', './style.css', './game.js', './dialogue.js', './about.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './assets/portraits/darth-vaper.webp', './assets/portraits/holly.webp',
  './assets/portraits/captain-blackball.webp', './assets/portraits/tornado-mick.webp',
  './assets/portraits/sweaty-simon.webp', './assets/portraits/deckhand-dave.webp',
  './assets/portraits/ol-cyclops.webp'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k.startsWith('seamen-pool-')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  // Do not pre-cache or cache the large soundtrack in 0.13.0.
  if (url.pathname.includes('/assets/music/')) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (!response || response.status !== 200 || response.type !== 'basic') return response;
    const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
