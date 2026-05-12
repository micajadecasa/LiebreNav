const CACHE_NAME = 'liebrenav-v2';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './modules/map.js',
    './modules/geocode.js',
    './modules/routing.js',
    './modules/navigation.js',
    './modules/voice.js',
    './modules/storage.js',
    './modules/ui.js',
    './modules/utils.js',
    './lib/maplibre-gl.css',
    './lib/maplibre-gl.js'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
});

self.addEventListener('fetch', e => {
    if (e.request.url.includes('demotiles.maplibre.org')) {
        e.respondWith(
            caches.match(e.request).then(res => {
                return res || fetch(e.request).then(fetchRes => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(e.request, fetchRes.clone());
                        return fetchRes;
                    });
                });
            })
        );
    } else {
        e.respondWith(
            caches.match(e.request).then(res => res || fetch(e.request))
        );
    }
});
