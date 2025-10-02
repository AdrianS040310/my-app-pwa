const CACHE_NAME = 'mi-pwa-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/MyPWA-74x74.webp',
    '/icons/MyPWA-144x144.webp',
    '/icons/MyPWA-1024x1024.webp'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Interceptar requests y servir desde cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Retornar desde cache si existe, sino fetch desde red
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
            )
    );
});

// Actualizar Service Worker
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
