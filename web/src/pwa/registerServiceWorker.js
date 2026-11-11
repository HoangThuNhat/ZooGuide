/**
 * Service Worker Registration and Lifecycle Management for ZooGuide PWA
 * Supports controlled version updates (SKIP_WAITING prompt) and diagnostic inspection.
 */

let isRegistering = false;
let activeRegistration = null;
let isRefreshingOnUpdate = false;

export function applyServiceWorkerUpdate(registration = activeRegistration) {
    const reg = registration || activeRegistration;
    if (!reg || !reg.waiting) {
        return false;
    }
    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    return true;
}

export async function getServiceWorkerDiagnostics() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return { supported: false, registered: false };
    }
    const reg = activeRegistration || (await navigator.serviceWorker.getRegistration('/'));
    const cacheNames = 'caches' in window ? await window.caches.keys() : [];
    return {
        supported: true,
        registered: Boolean(reg),
        scope: reg?.scope || null,
        activeState: reg?.active?.state || null,
        waitingState: reg?.waiting?.state || null,
        installingState: reg?.installing?.state || null,
        hasController: Boolean(navigator.serviceWorker.controller),
        cacheNames
    };
}

export function registerServiceWorker(options = {}) {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        console.log('[ZooGuide PWA] Service Worker is not supported in this browser.');
        return;
    }

    if (isRegistering) {
        return;
    }
    isRegistering = true;

    // Allow disabling SW in dev only if explicitly requested via VITE_DISABLE_SW_DEV=true
    if (import.meta.env.DEV && import.meta.env.VITE_DISABLE_SW_DEV === 'true') {
        console.log('[ZooGuide PWA] Service Worker registration skipped by VITE_DISABLE_SW_DEV.');
        isRegistering = false;
        return;
    }

    const { onUpdate, onSuccess } = options;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (isRefreshingOnUpdate) return;
        // Reload only when an update was explicitly accepted by the user
        if (window.__zgSwUpdateAccepted) {
            isRefreshingOnUpdate = true;
            window.location.reload();
        }
    });

    const notifyUpdateAvailable = (registration) => {
        if (onUpdate) onUpdate(registration);
        window.dispatchEvent(
            new CustomEvent('zooguide:sw-update-available', {
                detail: { registration }
            })
        );
    };

    const executeRegistration = () => {
        const swUrl = '/sw.js';

        navigator.serviceWorker
            .register(swUrl, { scope: '/' })
            .then((registration) => {
                activeRegistration = registration;
                window.__ZOOGUIDE_SW_REGISTRATION__ = registration;
                console.log('[ZooGuide PWA] Service Worker registered with scope:', registration.scope);

                if (registration.waiting && navigator.serviceWorker.controller) {
                    notifyUpdateAvailable(registration);
                }

                // Check for updates
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    if (!installingWorker) return;

                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                console.log('[ZooGuide PWA] New content is available; update ready.');
                                notifyUpdateAvailable(registration);
                            } else {
                                console.log('[ZooGuide PWA] Content is cached for offline use.');
                                if (onSuccess) onSuccess(registration);
                            }
                        }
                    };
                };
            })
            .catch((error) => {
                console.error('[ZooGuide PWA] Service Worker registration failed:', error);
                isRegistering = false;
            });
    };

    if (document.readyState === 'complete') {
        executeRegistration();
    } else {
        window.addEventListener('load', executeRegistration, { once: true });
    }
}
