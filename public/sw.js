// Service Worker para Mi PWA con estrategias de cacheo avanzadas
const CACHE_VERSION = 'v1.0.0';
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// App Shell - archivos críticos para el funcionamiento de la app
const APP_SHELL_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/main.tsx',
    '/src/App.tsx',
    '/src/App.css',
    '/src/index.css',
    '/src/components/AppShell.tsx',
    '/src/components/AppShell.css',
    '/src/components/SplashScreen.tsx',
    '/src/components/SplashScreen.css',
    '/src/components/HomeScreen.tsx',
    '/src/components/HomeScreen.css'
];

// Assets estáticos - iconos, imágenes, fuentes
const STATIC_ASSETS = [
    '/icons/MyPWA-74x74.webp',
    '/icons/MyPWA-144x144.webp',
    '/icons/MyPWA-1024x1024.webp'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');

    event.waitUntil(
        Promise.all([
            // Cache del App Shell
            caches.open(APP_SHELL_CACHE).then((cache) => {
                console.log('[SW] Cacheando App Shell');
                return cache.addAll(APP_SHELL_FILES);
            }),
            // Cache de assets estáticos
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] Cacheando assets estáticos');
                return cache.addAll(STATIC_ASSETS);
            })
        ]).then(() => {
            console.log('[SW] Instalación completada');
            // Forzar la activación inmediata
            return self.skipWaiting();
        })
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');

    const currentCaches = [APP_SHELL_CACHE, STATIC_CACHE, RUNTIME_CACHE];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!currentCaches.includes(cacheName)) {
                        console.log('[SW] Eliminando cache obsoleto:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Activación completada');
            // Tomar control de todas las pestañas inmediatamente
            return self.clients.claim();
        })
    );
});

// Estrategias de fetch
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Solo manejar requests del mismo origen
    if (url.origin !== location.origin) {
        return;
    }

    // Estrategia Cache First para App Shell y assets estáticos
    if (isAppShellRequest(request) || isStaticAssetRequest(request)) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // Estrategia Network First para contenido dinámico
    if (isDynamicRequest(request)) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Estrategia Stale While Revalidate para otros recursos
    event.respondWith(staleWhileRevalidateStrategy(request));
});

// Verificar si es un request del App Shell
function isAppShellRequest(request) {
    const url = new URL(request.url);
    return APP_SHELL_FILES.some(file => url.pathname === file || url.pathname === file.replace('/src', '/src'));
}

// Verificar si es un asset estático
function isStaticAssetRequest(request) {
    const url = new URL(request.url);
    return STATIC_ASSETS.some(asset => url.pathname === asset) ||
        url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf)$/);
}

// Verificar si es contenido dinámico (APIs, etc.)
function isDynamicRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/') ||
        request.method !== 'GET';
}

// Estrategia Cache First: buscar en cache primero, si no está, ir a la red
async function cacheFirstStrategy(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('[SW] Sirviendo desde cache:', request.url);
            return cachedResponse;
        }

        console.log('[SW] No encontrado en cache, buscando en red:', request.url);
        const networkResponse = await fetch(request);

        // Cachear la respuesta para futuras solicitudes
        if (networkResponse.ok) {
            const cache = await caches.open(isStaticAssetRequest(request) ? STATIC_CACHE : APP_SHELL_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Error en Cache First:', error);
        // Si es una navegación, devolver la página principal cacheada
        if (request.mode === 'navigate') {
            return caches.match('/');
        }
        throw error;
    }
}

// Estrategia Network First: intentar red primero, si falla usar cache
async function networkFirstStrategy(request) {
    try {
        console.log('[SW] Intentando red primero:', request.url);
        const networkResponse = await fetch(request);

        // Cachear respuestas exitosas
        if (networkResponse.ok && request.method === 'GET') {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Red falló, buscando en cache:', request.url);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Estrategia Stale While Revalidate: devolver cache y actualizar en background
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);

    // Fetch en background para actualizar cache
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {
        // Si la red falla, no hacer nada
    });

    // Devolver cache inmediatamente si existe, sino esperar la red
    if (cachedResponse) {
        console.log('[SW] Sirviendo desde cache (SWR):', request.url);
        return cachedResponse;
    }

    console.log('[SW] No hay cache, esperando red (SWR):', request.url);
    return fetchPromise;
}

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_CACHE_SIZE') {
        getCacheSize().then(size => {
            event.ports[0].postMessage({ cacheSize: size });
        });
    }
});

// Obtener tamaño del cache
async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        totalSize += requests.length;
    }

    return totalSize;
}

// Limpiar caches antiguos periódicamente
setInterval(() => {
    caches.keys().then(cacheNames => {
        const currentTime = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días

        cacheNames.forEach(async (cacheName) => {
            if (cacheName.includes('runtime-')) {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();

                requests.forEach(async (request) => {
                    const response = await cache.match(request);
                    const cachedTime = response.headers.get('sw-cache-time');

                    if (cachedTime && (currentTime - parseInt(cachedTime)) > maxAge) {
                        cache.delete(request);
                    }
                });
            }
        });
    });
}, 60000); // Cada minuto
