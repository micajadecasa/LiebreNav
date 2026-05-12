const CACHE_NAME = 'liebre-nav-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './modules/map.js',
    './modules/geocode.js',
    './modules/routing.js',
    './modules/storage.js',
    './modules/ui.js',
    './modules/voice.js',
    './lib/maplibre-gl.css',
    './lib/maplibre-gl.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
