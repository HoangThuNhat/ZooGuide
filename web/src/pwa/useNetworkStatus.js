import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to monitor browser online/offline status with auto-reconnect notifications.
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(() => {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    });
    const [wasOffline, setWasOffline] = useState(false);
    const [showReconnected, setShowReconnected] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let reconnectTimeout = null;

        const handleOnline = () => {
            setIsOnline(true);
            setIsDismissed(false);
            if (wasOffline) {
                setShowReconnected(true);
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(() => {
                    setShowReconnected(false);
                    setWasOffline(false);
                }, 3500);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
            setShowReconnected(false);
            setIsDismissed(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, [wasOffline]);

    const dismissAlert = useCallback(() => {
        setIsDismissed(true);
    }, []);

    return {
        isOnline,
        showReconnected,
        isDismissed,
        dismissAlert
    };
}
