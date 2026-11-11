import { useState, useEffect, useCallback, useRef } from 'react';
import { applyServiceWorkerUpdate } from './registerServiceWorker';

/**
 * Hook to monitor browser online/offline status, backend API reachability,
 * offline tour cache fallback usage, and Service Worker version updates.
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(() => {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    });
    const [isApiReachable, setIsApiReachable] = useState(true);
    const [isUsingOfflineData, setIsUsingOfflineData] = useState(false);
    const [lastOfflineCachedAt, setLastOfflineCachedAt] = useState(null);
    const [showReconnected, setShowReconnected] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [swUpdateRegistration, setSwUpdateRegistration] = useState(null);
    const wasDisconnectedRef = useRef(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let reconnectTimeout = null;

        const markReconnected = () => {
            if (wasDisconnectedRef.current) {
                wasDisconnectedRef.current = false;
                setIsUsingOfflineData(false);
                setShowReconnected(true);
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(() => {
                    setShowReconnected(false);
                }, 4000);
            }
        };

        const handleOnline = () => {
            setIsOnline(true);
            setIsDismissed(false);
            markReconnected();
        };

        const handleOffline = () => {
            setIsOnline(false);
            wasDisconnectedRef.current = true;
            setShowReconnected(false);
            setIsDismissed(false);
        };

        const handleApiStatus = (event) => {
            const reachable = event?.detail?.reachable !== false;
            setIsApiReachable(reachable);
            if (!reachable) {
                wasDisconnectedRef.current = true;
                setShowReconnected(false);
            } else {
                setIsUsingOfflineData(false);
                if (navigator.onLine) {
                    markReconnected();
                }
            }
        };

        const handleOfflineDataUsed = (event) => {
            setIsUsingOfflineData(true);
            if (event?.detail?.cachedAt) {
                setLastOfflineCachedAt(event.detail.cachedAt);
            }
        };

        const handleSwUpdateAvailable = (event) => {
            if (event?.detail?.registration) {
                setSwUpdateRegistration(event.detail.registration);
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('zooguide:api-status', handleApiStatus);
        window.addEventListener('zooguide:offline-data-used', handleOfflineDataUsed);
        window.addEventListener('zooguide:sw-update-available', handleSwUpdateAvailable);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('zooguide:api-status', handleApiStatus);
            window.removeEventListener('zooguide:offline-data-used', handleOfflineDataUsed);
            window.removeEventListener('zooguide:sw-update-available', handleSwUpdateAvailable);
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, []);

    const dismissAlert = useCallback(() => {
        setIsDismissed(true);
    }, []);

    const triggerSwUpdate = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.__zgSwUpdateAccepted = true;
        }
        const applied = applyServiceWorkerUpdate(swUpdateRegistration);
        if (!applied && typeof window !== 'undefined') {
            window.location.reload();
        }
    }, [swUpdateRegistration]);

    return {
        isOnline,
        isApiReachable,
        isUsingOfflineData,
        lastOfflineCachedAt,
        showReconnected,
        isDismissed,
        dismissAlert,
        hasSwUpdate: Boolean(swUpdateRegistration),
        triggerSwUpdate
    };
}
