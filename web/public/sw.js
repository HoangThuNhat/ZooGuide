/**
 * ZooGuide Service Worker
 * Version: 1.0.0
 * Strategy:
 * - App Shell & Static Assets: Stale-While-Revalidate / Cache-First
 * - Navigation (HTML): Network-First with cached App Shell fallback
 * - API & Sensitive Data (/api/*, POST/PUT/DELETE): Network-Only (NEVER CACHE)
 */

const CACHE_VERSION = 'zooguide-v1';
const STATIC_CACHE_NAME = `zg-static-${CACHE_VERSION}`;

// Core static assets for initial App Shell
const APP_SHELL_ASSETS = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
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

// Install Event: Precaches App Shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                // Use addAll with error tolerance: cache what is available
                return Promise.all(
                    APP_SHELL_ASSETS.map((asset) => {
                        return cache.add(asset).catch((err) => {
                            console.warn(`[ServiceWorker] Could not precache ${asset}:`, err);
                        });
                    })
                );
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event: Clean up outdated ZooGuide caches and take control
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    // Only remove obsolete caches belonging to ZooGuide (prefixed with zg-)
                    if (key.startsWith('zg-') && key !== STATIC_CACHE_NAME) {
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

    // 4. NEVER cache API requests or sensitive backend endpoints (/api/*)
    // Ensures ticket validation, sessions, admin actions, and chatbot are strictly fresh
    if (url.pathname.startsWith('/api/')) {
        return; // Normal network request
    }

    // 5. Do not cache heavy audio media streams to prevent storage exhaustion
    if (url.pathname.startsWith('/assets/audio/') || request.destination === 'audio') {
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
                    // When offline, serve cached index.html or fallback root
                    return caches.match('/index.html')
                        .then((cachedIndex) => cachedIndex || caches.match('/'))
                        .then((response) => {
                            if (response) return response;
                            // Fallback minimal offline response if cache is completely empty
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
        // Safe origin boundary: only cache assets from current origin or official font CDN
        const isSameOrigin = url.origin === self.location.origin;
        const isTrustedFontCdn = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
        if (!isSameOrigin && !isTrustedFontCdn) {
            return; // Pass through untrusted third-party origins
        }

        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request).then((networkResponse) => {
                    // Cache only successful 200 responses, never cache 401, 403, 404, or 500
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
