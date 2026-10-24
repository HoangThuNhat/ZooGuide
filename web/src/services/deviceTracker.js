import * as signalR from '@microsoft/signalr';
import { ZooApi, API_CONFIG } from './api';

const STORAGE_KEY = 'zooguide_device_installation_id';
const BUYER_STORAGE_KEY = 'zooguide_buyer_identity';
const HEARTBEAT_INTERVAL_MS = 15000; // 15 seconds

export function getOrCreateInstallationId() {
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

export function getStoredBuyerIdentity() {
    try {
        const raw = localStorage.getItem(BUYER_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.orderCode || parsed.email)) {
            return parsed;
        }
        return null;
    } catch (e) {
        return null;
    }
}

export function setBuyerIdentity({ orderCode, email }) {
    try {
        const buyer = {
            orderCode: orderCode?.trim() || '',
            email: email?.toLowerCase()?.trim() || '',
            timestamp: Date.now()
        };
        localStorage.setItem(BUYER_STORAGE_KEY, JSON.stringify(buyer));

        // Nâng cấp trực tiếp kết nối SignalR nếu đang hoạt động
        if (activeHubConnection && activeHubConnection.state === signalR.HubConnectionState.Connected) {
            activeHubConnection.invoke('RegisterBuyer', buyer.orderCode, buyer.email).catch(e => {
                console.warn('RegisterBuyer hub invocation failed:', e);
            });
        }

        // Gửi ngay HTTP heartbeat mang thông tin người mua vé
        ZooApi.sendDeviceHeartbeat(getOrCreateInstallationId(), buyer).catch(() => {});
    } catch (e) {
        console.error('Error saving buyer identity:', e);
    }
}

export function clearBuyerIdentity() {
    try {
        localStorage.removeItem(BUYER_STORAGE_KEY);
    } catch (e) {}
}

let heartbeatTimer = null;
let currentInstallationId = null;
let activeHubConnection = null;

export function getSignalRConnection() {
    return activeHubConnection;
}

export function initDeviceTracker(role = 'Visitor') {
    if (typeof window === 'undefined') return () => {};

    currentInstallationId = getOrCreateInstallationId();
    const buyer = getStoredBuyerIdentity();

    // 1. Khởi tạo SignalR Realtime Hub Connection
    let hubUrl = `${API_CONFIG.BASE_URL}/hubs/online?visitorId=${encodeURIComponent(currentInstallationId)}`;
    if (role === 'Admin') {
        hubUrl += '&role=Admin';
    }
    if (buyer?.orderCode) {
        hubUrl += `&orderCode=${encodeURIComponent(buyer.orderCode)}`;
    }
    if (buyer?.email) {
        hubUrl += `&buyerEmail=${encodeURIComponent(buyer.email)}`;
    }

    try {
        const hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
            .configureLogging(signalR.LogLevel.None)
            .build();

        hubConnection.start()
            .then(() => {
                activeHubConnection = hubConnection;
                // Nếu có buyer identity mà chưa kịp gắn vào query string
                const currentB = getStoredBuyerIdentity();
                if (currentB && (currentB.orderCode || currentB.email)) {
                    hubConnection.invoke('RegisterBuyer', currentB.orderCode || '', currentB.email || '').catch(() => {});
                }
            })
            .catch(err => {
                console.warn('SignalR Realtime tracker unavailable, using HTTP fallback:', err?.message || err);
            });

        activeHubConnection = hubConnection;
    } catch (e) {
        console.warn('Error creating SignalR Hub connection:', e);
    }

    // 2. HTTP Heartbeat dự phòng & cập nhật định kỳ
    const sendBeat = async () => {
        try {
            const currentBuyer = getStoredBuyerIdentity();
            if (activeHubConnection && activeHubConnection.state === signalR.HubConnectionState.Connected) {
                activeHubConnection.invoke('Heartbeat').catch(() => {});
            }
            await ZooApi.sendDeviceHeartbeat(currentInstallationId, currentBuyer);
        } catch (err) {
            // Xử lý im lặng lỗi mạng tạm thời
        }
    };

    // Gửi ngay khi tải trang
    sendBeat();

    // Chu kỳ 30s
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(sendBeat, HEARTBEAT_INTERVAL_MS);

    // Xử lý khi tab trở lại hiển thị
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            sendBeat();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Xử lý khi người dùng đóng tab, đóng trình duyệt hoặc điều hướng rời khỏi website
    const handleBeforeUnload = () => {
        try {
            const currentBuyer = getStoredBuyerIdentity();
            if (activeHubConnection) {
                activeHubConnection.stop().catch(() => {});
            }
            ZooApi.sendDeviceDisconnect(currentInstallationId, currentBuyer);
        } catch (e) {
            // Ignore unload errors
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (activeHubConnection) {
            activeHubConnection.stop().catch(() => {});
            activeHubConnection = null;
        }
    };
}

export function getDeviceInstallationId() {
    if (!currentInstallationId) {
        currentInstallationId = getOrCreateInstallationId();
    }
    return currentInstallationId;
}
