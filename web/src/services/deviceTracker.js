import * as signalR from '@microsoft/signalr';
import { ZooApi, API_CONFIG } from './api';

const STORAGE_KEY = 'zooguide_device_installation_id';
const BUYER_STORAGE_KEY = 'zooguide_buyer_identity';
const ACTIVE_TABS_KEY = 'zooguide_active_visitor_tabs';
const TAB_TTL_MS = 45000;

/**
 * Cấu hình chu kỳ Heartbeat và ngưỡng Online thống nhất toàn hệ thống:
 * - Chu kỳ gửi heartbeat phía client: 25 giây (HEARTBEAT_INTERVAL_MS = 25000).
 * - Ngưỡng phân loại thiết bị đang trực tuyến (Online) trên server: 60 giây (ONLINE_THRESHOLD_SECONDS = 60).
 * 
 * Lưu ý nghiệp vụ & Giới hạn kỹ thuật:
 * - Mã định danh cài đặt (InstallationId) là chuỗi UUID ngẫu nhiên được lưu trữ trong localStorage của trình duyệt.
 * - KHÔNG yêu cầu quyền định vị GPS hay thông tin cá nhân của người dùng để theo dõi thiết bị.
 * - Khách truy cập ẩn danh (chưa mua vé, chưa kích hoạt vé) vẫn được theo dõi và đếm chính xác.
 * - Giới hạn: Nếu người dùng xóa dữ liệu duyệt web/localStorage, hoặc mở trình duyệt ở chế độ ẩn danh (Incognito),
 *   hoặc sử dụng hai trình duyệt khác nhau trên cùng một máy, hệ thống sẽ cấp một InstallationId độc lập mới.
 */
export const HEARTBEAT_INTERVAL_MS = 25000; // 25 seconds
export const ONLINE_THRESHOLD_SECONDS = 60; // 60 seconds online cutoff on server

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

function createTabId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'tab-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
}

function readActiveTabsMap(now = Date.now()) {
    try {
        const raw = localStorage.getItem(ACTIVE_TABS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return {};
        const cleaned = {};
        for (const [id, ts] of Object.entries(parsed)) {
            if (typeof ts === 'number' && now - ts <= TAB_TTL_MS) {
                cleaned[id] = ts;
            }
        }
        return cleaned;
    } catch {
        return {};
    }
}

function writeActiveTabsMap(map) {
    try {
        if (Object.keys(map).length === 0) {
            localStorage.removeItem(ACTIVE_TABS_KEY);
        } else {
            localStorage.setItem(ACTIVE_TABS_KEY, JSON.stringify(map));
        }
    } catch {
        // Ignore storage quota / private-mode errors
    }
}

function touchActiveTab(tabId) {
    const now = Date.now();
    const map = readActiveTabsMap(now);
    map[tabId] = now;
    writeActiveTabsMap(map);
    return Object.keys(map).length;
}

function unregisterActiveTab(tabId) {
    const now = Date.now();
    const map = readActiveTabsMap(now);
    delete map[tabId];
    writeActiveTabsMap(map);
    return Object.keys(map).length;
}

export function getSignalRConnection() {
    return activeHubConnection;
}

export function initDeviceTracker(role = 'Visitor') {
    if (typeof window === 'undefined') return () => {};

    // Không theo dõi trình duyệt của quản trị viên như thiết bị khách tham quan
    if (String(role || '').toLowerCase() === 'admin' || String(role || '').toLowerCase() === 'staff') {
        return () => {};
    }

    let isDisposed = false;
    let isHeartbeatInFlight = false;
    let disconnectHandled = false;
    const tabId = createTabId();

    currentInstallationId = getOrCreateInstallationId();
    touchActiveTab(tabId);
    const buyer = getStoredBuyerIdentity();

    // 1. Khởi tạo SignalR Realtime Hub Connection (cục bộ theo từng vòng đời effect, an toàn với React StrictMode)
    let localHubConnection = null;
    let hubUrl = `${API_CONFIG.BASE_URL}/hubs/online?visitorId=${encodeURIComponent(currentInstallationId)}&role=${encodeURIComponent(role || 'Visitor')}`;
    if (buyer?.orderCode) {
        hubUrl += `&orderCode=${encodeURIComponent(buyer.orderCode)}`;
    }
    if (buyer?.email) {
        hubUrl += `&buyerEmail=${encodeURIComponent(buyer.email)}`;
    }

    // 2. HTTP Heartbeat & gia hạn SignalR định kỳ (chống gửi trùng song song)
    const sendBeat = async () => {
        if (isDisposed || isHeartbeatInFlight) return;
        isHeartbeatInFlight = true;
        try {
            touchActiveTab(tabId);
            const currentBuyer = getStoredBuyerIdentity();
            if (localHubConnection && localHubConnection.state === signalR.HubConnectionState.Connected) {
                localHubConnection.invoke('Heartbeat').catch(() => {});
            }
            await ZooApi.sendDeviceHeartbeat(currentInstallationId, currentBuyer);
        } catch {
            // Xử lý im lặng lỗi mạng tạm thời
        } finally {
            isHeartbeatInFlight = false;
        }
    };

    try {
        const hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
            .configureLogging(signalR.LogLevel.None)
            .build();

        hubConnection.onreconnected(() => {
            if (isDisposed) return;
            const currentB = getStoredBuyerIdentity();
            if (currentB && (currentB.orderCode || currentB.email)) {
                hubConnection.invoke('RegisterBuyer', currentB.orderCode || '', currentB.email || '').catch(() => {});
            }
            sendBeat();
        });

        localHubConnection = hubConnection;
        activeHubConnection = hubConnection;

        hubConnection.start()
            .then(() => {
                if (isDisposed) {
                    hubConnection.stop().catch(() => {});
                    return;
                }
                activeHubConnection = hubConnection;
                const currentB = getStoredBuyerIdentity();
                if (currentB && (currentB.orderCode || currentB.email)) {
                    hubConnection.invoke('RegisterBuyer', currentB.orderCode || '', currentB.email || '').catch(() => {});
                }
            })
            .catch(err => {
                if (!isDisposed) {
                    console.warn('SignalR Realtime tracker unavailable, using HTTP fallback:', err?.message || err);
                }
            });
    } catch (e) {
        console.warn('Error creating SignalR Hub connection:', e);
    }

    // Gửi ngay khi tải trang
    sendBeat();

    // Chu kỳ 25 giây
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    const localTimer = setInterval(sendBeat, HEARTBEAT_INTERVAL_MS);
    heartbeatTimer = localTimer;

    // Xử lý khi tab trở lại hiển thị
    const handleVisibilityChange = () => {
        if (!isDisposed && document.visibilityState === 'visible') {
            sendBeat();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Xử lý khi đóng tab / đóng trình duyệt:
    //    Chỉ gửi disconnect beacon khi TAB CUỐI CÙNG trên trình duyệt này đóng,
    //    tránh việc đóng 1 trong nhiều tab làm thiết bị đang mở ở tab khác bị đánh dấu offline.
    const handlePageExit = () => {
        if (disconnectHandled) return;
        disconnectHandled = true;
        try {
            const remainingTabs = unregisterActiveTab(tabId);
            if (localHubConnection) {
                localHubConnection.stop().catch(() => {});
            }
            if (remainingTabs === 0) {
                const currentBuyer = getStoredBuyerIdentity();
                ZooApi.sendDeviceDisconnect(currentInstallationId, currentBuyer);
            }
        } catch {
            // Ignore unload errors
        }
    };
    window.addEventListener('pagehide', handlePageExit);
    window.addEventListener('beforeunload', handlePageExit);

    return () => {
        isDisposed = true;
        clearInterval(localTimer);
        if (heartbeatTimer === localTimer) {
            heartbeatTimer = null;
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pagehide', handlePageExit);
        window.removeEventListener('beforeunload', handlePageExit);
        unregisterActiveTab(tabId);
        if (localHubConnection) {
            localHubConnection.stop().catch(() => {});
            if (activeHubConnection === localHubConnection) {
                activeHubConnection = null;
            }
        }
    };
}

export function getDeviceInstallationId() {
    if (!currentInstallationId) {
        currentInstallationId = getOrCreateInstallationId();
    }
    return currentInstallationId;
}
