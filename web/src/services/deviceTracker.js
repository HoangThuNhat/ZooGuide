import { ZooApi } from './api';

const STORAGE_KEY = 'zooguide_device_installation_id';
const HEARTBEAT_INTERVAL_MS = 60000; // 60 seconds

function getOrCreateInstallationId() {
    try {
        let id = localStorage.getItem(STORAGE_KEY);
        if (!id || id.length < 10) {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                id = crypto.randomUUID();
            } else {
                id = 'inst-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
            }
            localStorage.setItem(STORAGE_KEY, id);
        }
        return id;
    } catch (e) {
        return 'temp-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
    }
}

let heartbeatTimer = null;
let currentInstallationId = null;

export function initDeviceTracker() {
    if (typeof window === 'undefined') return;

    currentInstallationId = getOrCreateInstallationId();

    const sendBeat = async () => {
        try {
            await ZooApi.sendDeviceHeartbeat(currentInstallationId);
        } catch (err) {
            // Silently handle transient network issues without annoying the visitor
        }
    };

    // Initial heartbeat on page load
    sendBeat();

    // Periodic heartbeat every 60s
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(sendBeat, HEARTBEAT_INTERVAL_MS);

    // Also send when returning to visibility
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            sendBeat();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
}

export function getDeviceInstallationId() {
    if (!currentInstallationId) {
        currentInstallationId = getOrCreateInstallationId();
    }
    return currentInstallationId;
}
