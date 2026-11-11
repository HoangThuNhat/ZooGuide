/**
 * ZooGuide Service Worker
 * Version: 2.0.0
 * Strategy:
 * - App Shell & Static Assets: Stale-While-Revalidate / Cache-First (zg-static-zooguide-v2)
 * - Navigation (HTML): Network-First with cached App Shell fallback
 * - Public Read-Only Tour Data (/api/areas, /api/enclosures, /api/animals, /api/species, /api/pois, /api/languages):
 *     Network-First with bounded Offline Cache Fallback (zg-tour-data-zooguide-v2, 24h TTL)
 * - Sensitive & Realtime Endpoints (/api/tickets/*, /api/orders/*, /api/payments/*, /api/dashboard/*, /api/admin*, POST/PUT/PATCH/DELETE):
 *     Network-Only (STRICTLY NEVER CACHED)
 */

const CACHE_VERSION = 'zooguide-v2';
const STATIC_CACHE_NAME = `zg-static-${CACHE_VERSION}`;
const TOUR_DATA_CACHE_NAME = `zg-tour-data-${CACHE_VERSION}`;
const TOUR_DATA_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_TOUR_CACHE_ENTRIES = 40;

const PUBLIC_TOUR_API_PREFIXES = [
    '/api/areas',
    '/api/enclosures',
    '/api/animals',
    '/api/species',
    '/api/pois',
    '/api/languages'
];

const SENSITIVE_API_PREFIXES = [
    '/api/tickets',
    '/api/orders',
    '/api/payments',
    '/api/dashboard',
    '/api/devices',
    '/api/admin',
    '/api/hubs',
    '/api/health',
    '/api/narrations'
];

// Core static assets for initial App Shell
const APP_SHELL_ASSETS = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/manifest.json',
    '/favicon.svg',
    '/favicon.ico',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-192-maskable.png',
    '/icons/icon-512-maskable.png',
    '/icons/apple-touch-icon.png',
    '/icons/favicon-32x32.png',
    '/icons/favicon-16x16.png'
];

function isPublicTourGetRequest(request, url) {
    if (request.method !== 'GET') return false;
    if (request.headers.get('Authorization') || request.headers.get('X-Session-Id')) {
        return false;
    }
    const pathname = url.pathname.toLowerCase();
    if (SENSITIVE_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return false;
    }
    // Exclude POI protected narration/stream endpoints that require ticket session
    if (pathname.includes('/public-narration') || pathname.includes('/stream')) {
        return false;
    }
    return PUBLIC_TOUR_API_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
}

async function trimCache(cacheName, maxItems) {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        if (keys.length > maxItems) {
            const toDelete = keys.slice(0, keys.length - maxItems);
            await Promise.all(toDelete.map((k) => cache.delete(k)));
        }
    } catch {
        // Ignore cache trimming errors
    }
}

// Install Event: Precaches App Shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                return Promise.all(
                    APP_SHELL_ASSETS.map((asset) => {
                        return cache.add(asset).catch((err) => {
                            console.warn(`[ServiceWorker] Could not precache ${asset}:`, err);
                        });
                    })
                );
            })
            .then(() => {
                // If there is no active controller yet (first install), activate immediately
                if (!self.registration.active) {
                    return self.skipWaiting();
                }
            })
    );
});

// Message Event: Controlled SW lifecycle & diagnostics
self.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'SKIP_WAITING') {
        self.skipWaiting();
        return;
    }
    if (data.type === 'CLEAR_TOUR_CACHE') {
        event.waitUntil(
            caches.delete(TOUR_DATA_CACHE_NAME).then((deleted) => {
                if (event.ports && event.ports[0]) {
                    event.ports[0].postMessage({ cleared: deleted });
                }
            })
        );
        return;
    }
    if (data.type === 'GET_CACHE_STATS') {
        event.waitUntil(
            (async () => {
                const cacheNames = await caches.keys();
                const stats = {};
                for (const name of cacheNames) {
                    const c = await caches.open(name);
                    const reqs = await c.keys();
                    stats[name] = reqs.map((r) => new URL(r.url).pathname + new URL(r.url).search);
                }
                if (event.ports && event.ports[0]) {
                    event.ports[0].postMessage({
                        version: CACHE_VERSION,
                        staticCacheName: STATIC_CACHE_NAME,
                        tourDataCacheName: TOUR_DATA_CACHE_NAME,
                        caches: stats
                    });
                }
            })()
        );
    }
});

// Activate Event: Clean up outdated ZooGuide caches and take control
self.addEventListener('activate', (event) => {
    const validCaches = new Set([STATIC_CACHE_NAME, TOUR_DATA_CACHE_NAME]);
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key.startsWith('zg-') && !validCaches.has(key)) {
                        console.log(`[ServiceWorker] Removing obsolete ZooGuide cache: ${key}`);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Apply clear and safe caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 1. Only handle HTTP/HTTPS requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // 2. Bypass Vite dev server internal assets and HMR requests during development
    if (
        url.pathname.includes('/@vite/') || 
        url.pathname.includes('/@fs/') || 
        url.pathname.includes('/@id/') || 
        url.search.includes('import') ||
        url.pathname.includes('node_modules')
    ) {
        return;
    }

    // 3. NEVER cache non-GET requests (POST, PUT, DELETE, PATCH)
    if (request.method !== 'GET') {
        return;
    }

    // 4. Handle API requests with strict separation between public tour data and sensitive endpoints
    if (url.pathname.startsWith('/api/')) {
        if (!isPublicTourGetRequest(request, url)) {
            // Sensitive / realtime / session-protected endpoints: Network-Only (NEVER CACHE)
            return;
        }

        // Public Read-Only Tour Data: Network-First with bounded Offline Cache Fallback
        event.respondWith(
            fetch(request)
                .then(async (networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clonedBody = await networkResponse.clone().arrayBuffer();
                        const headers = new Headers(networkResponse.headers);
                        headers.set('x-zg-cached-at', String(Date.now()));
                        const cachedCopy = new Response(clonedBody, {
                            status: networkResponse.status,
                            statusText: networkResponse.statusText,
                            headers
                        });
                        caches.open(TOUR_DATA_CACHE_NAME).then((cache) => {
                            cache.put(request, cachedCopy).then(() => {
                                trimCache(TOUR_DATA_CACHE_NAME, MAX_TOUR_CACHE_ENTRIES);
                            });
                        });
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cache = await caches.open(TOUR_DATA_CACHE_NAME);
                    const cachedResponse = await cache.match(request);
                    if (cachedResponse) {
                        const cachedAt = Number(cachedResponse.headers.get('x-zg-cached-at') || 0);
                        if (!cachedAt || (Date.now() - cachedAt <= TOUR_DATA_TTL_MS)) {
                            const body = await cachedResponse.clone().arrayBuffer();
                            const headers = new Headers(cachedResponse.headers);
                            headers.set('x-zg-offline-fallback', 'true');
                            return new Response(body, {
                                status: cachedResponse.status,
                                statusText: cachedResponse.statusText,
                                headers
                            });
                        }
                        await cache.delete(request);
                    }
                    return new Response(
                        JSON.stringify({
                            success: false,
                            offline: true,
                            message: 'Thiết bị đang ngoại tuyến và chưa có dữ liệu lưu tạm cho mục này.'
                        }),
                        {
                            status: 503,
                            headers: { 'Content-Type': 'application/json; charset=utf-8' }
                        }
                    );
                })
        );
        return;
    }

    // 5. Do not cache heavy audio media streams to prevent storage exhaustion
    if (url.pathname.startsWith('/assets/audio/') || url.pathname.startsWith('/storage/') || request.destination === 'audio') {
        return;
    }

    // 6. Navigation Requests (HTML Pages / App Shell)
    // Strategy: Network-First with Fallback to cached index.html
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(STATIC_CACHE_NAME).then((cache) => {
                            cache.put(request, copy);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match('/index.html')
                        .then((cachedIndex) => cachedIndex || caches.match('/'))
                        .then((response) => {
                            if (response) return response;
                            return new Response(
                                '<!DOCTYPE html><html><head><meta charset="utf-8"><title>ZooGuide • Ngoại Tuyến</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;padding:2rem;text-align:center;"><h2>Chế độ Ngoại Tuyến</h2><p>Vui lòng kết nối Internet để tải ZooGuide.</p></body></html>',
                                { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                            );
                        });
                })
        );
        return;
    }

    // 7. Static Assets (CSS, JS, Images, Fonts, Icons)
    // Strategy: Stale-While-Revalidate
    if (
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'image' ||
        request.destination === 'font' ||
        url.pathname.match(/\.(?:js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/)
    ) {
        const isSameOrigin = url.origin === self.location.origin;
        const isTrustedFontCdn = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
        if (!isSameOrigin && !isTrustedFontCdn) {
            return;
        }

        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
                        const copy = networkResponse.clone();
                        caches.open(STATIC_CACHE_NAME).then((cache) => {
                            cache.put(request, copy);
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // Silent network error when offline - cached asset already returned
                });

                return cachedResponse || fetchPromise;
            })
        );
    }
});
