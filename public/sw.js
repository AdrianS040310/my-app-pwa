const CACHE_VERSION = 'v1.0.0';
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

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

const STATIC_ASSETS = [];

self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_FILES)),
            caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
        ]).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    const currentCaches = [APP_SHELL_CACHE, STATIC_CACHE, RUNTIME_CACHE];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!currentCaches.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    if (url.origin !== location.origin) return;

    if (isAppShellRequest(request) || isStaticAssetRequest(request)) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    if (isDynamicRequest(request)) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    event.respondWith(staleWhileRevalidateStrategy(request));
});

function isAppShellRequest(request) {
    const url = new URL(request.url);
    return APP_SHELL_FILES.some(file => url.pathname === file || url.pathname === file.replace('/src', '/src'));
}

function isStaticAssetRequest(request) {
    const url = new URL(request.url);
    return STATIC_ASSETS.some(asset => url.pathname === asset) ||
        url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf)$/);
}

function isDynamicRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/') || request.method !== 'GET';
}

async function cacheFirstStrategy(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(isStaticAssetRequest(request) ? STATIC_CACHE : APP_SHELL_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        if (request.mode === 'navigate') return caches.match('/');
        throw error;
    }
}

async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok && request.method === 'GET') {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        throw error;
    }
}

async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) cache.put(request, networkResponse.clone());
        return networkResponse;
    }).catch(() => { });

    return cachedResponse || fetchPromise;
}

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();

    if (event.data?.type === 'GET_CACHE_SIZE') {
        getCacheSize().then(size => {
            event.ports[0].postMessage({ cacheSize: size });
        });
    }
});

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

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-entries') {
        event.waitUntil(syncEntries());
    }
});

async function syncEntries() {
    try {
        const db = await openIndexedDB();
        const transaction = db.transaction(['sync-entries'], 'readonly');
        const store = transaction.objectStore('sync-entries');
        const entries = await getAllFromStore(store);

        for (const entry of entries) {
            try {
                if (entry.type === 'delete') {
                    await syncDeletion(entry, db);
                } else {
                    await syncSingleEntry(entry, db);
                }
            } catch { }
        }
    } catch { }
}

async function syncDeletion(entry, db) {
    const response = await fetch(`https://68efdc0eb06cc802829ef743.mockapi.io/api/v1/entries/${entry.serverId}`, {
        method: 'DELETE',
    });
    if (response.ok) await removeFromSyncQueue(entry.id, db);
}

async function syncSingleEntry(entry, db) {
    const syncData = {
        name: entry.name,
        note: entry.activity,
        createdAt: Math.floor(entry.timestamp / 1000)
    };
    const response = await fetch('https://68efdc0eb06cc802829ef743.mockapi.io/api/v1/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncData)
    });
    if (response.ok) await removeFromSyncQueue(entry.id, db);
}

function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('StudentActivityDB', 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('activities')) {
                const store = db.createObjectStore('activities', { keyPath: 'id', autoIncrement: true });
                store.createIndex('by-timestamp', 'timestamp');
            }
            if (!db.objectStoreNames.contains('sync-entries')) {
                const syncStore = db.createObjectStore('sync-entries', { keyPath: 'id', autoIncrement: true });
                syncStore.createIndex('by-timestamp', 'timestamp');
            }
        };
    });
}

function getAllFromStore(store) {
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function removeFromSyncQueue(entryId, db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sync-entries'], 'readwrite');
        const store = transaction.objectStore('sync-entries');
        const request = store.delete(entryId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

setInterval(() => {
    caches.keys().then(cacheNames => {
        const currentTime = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000;
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
}, 60000);
