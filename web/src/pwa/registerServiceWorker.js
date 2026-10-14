/**
 * Service Worker Registration and Lifecycle Management for ZooGuide PWA
 */

let isRegistering = false;

export function registerServiceWorker(options = {}) {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        console.log('[ZooGuide PWA] Service Worker is not supported in this browser.');
        return;
    }

    if (isRegistering) {
        return;
    }
    isRegistering = true;

    // Do not register Service Worker during local Vite development (protects HMR and dev modules)
    // To test Service Worker in dev, set VITE_ENABLE_SW_DEV=true in .env
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_SW_DEV !== 'true') {
        console.log('[ZooGuide PWA] Service Worker registration skipped in development mode (Vite HMR protected).');
        isRegistering = false;
        return;
    }

    const { onUpdate, onSuccess } = options;

    const executeRegistration = () => {
        const swUrl = '/sw.js';

        navigator.serviceWorker
            .register(swUrl, { scope: '/' })
            .then((registration) => {
                console.log('[ZooGuide PWA] Service Worker registered with scope:', registration.scope);

                // Check for updates
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    if (!installingWorker) return;

                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // New content is available; please refresh.
                                console.log('[ZooGuide PWA] New content is available; update ready.');
                                if (onUpdate) onUpdate(registration);
                            } else {
                                // Content is cached for offline use.
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

    // If page is already loaded, register immediately; otherwise wait for load event
    if (document.readyState === 'complete') {
        executeRegistration();
    } else {
        window.addEventListener('load', executeRegistration, { once: true });
    }
}
