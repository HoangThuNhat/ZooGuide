import React from 'react';
import { useNetworkStatus } from '../../pwa/useNetworkStatus';
import { ZooApi } from '../../services/api';

export default function OfflineBanner() {
    const {
        isOnline,
        isApiReachable,
        isUsingOfflineData,
        lastOfflineCachedAt,
        showReconnected,
        isDismissed,
        dismissAlert,
        hasSwUpdate,
        triggerSwUpdate
    } = useNetworkStatus();

    const isDisconnected = !isOnline || !isApiReachable || isUsingOfflineData;

    if (!isDisconnected && !showReconnected && !hasSwUpdate) {
        return null;
    }

    if (isDisconnected && isDismissed && !hasSwUpdate) {
        return null;
    }

    const cachedTimeLabel = lastOfflineCachedAt
        ? new Date(lastOfflineCachedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <aside
            className={`network-status-banner ${
                hasSwUpdate
                    ? 'banner-reconnected'
                    : !isDisconnected && showReconnected
                      ? 'banner-reconnected'
                      : 'banner-offline'
            }`}
            role="status"
            aria-live="polite"
            data-testid="network-status-banner"
        >
            <div className="container banner-inner">
                <div className="banner-content">
                    {hasSwUpdate ? (
                        <>
                            <span className="banner-icon icon-success" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 4 23 10 17 10"></polyline>
                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                </svg>
                            </span>
                            <div className="banner-text">
                                <strong>Cập nhật ứng dụng:</strong> Đã có phiên bản mới của ZooGuide sẵn sàng kích hoạt.
                            </div>
                            <button
                                type="button"
                                className="banner-dismiss-btn"
                                onClick={triggerSwUpdate}
                                aria-label="Cập nhật phiên bản mới"
                            >
                                Cập nhật ngay
                            </button>
                        </>
                    ) : !isDisconnected && showReconnected ? (
                        <>
                            <span className="banner-icon icon-success" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                                    <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                                    <line x1="12" y1="20" x2="12.01" y2="20"></line>
                                </svg>
                            </span>
                            <div className="banner-text">
                                <strong>Đã khôi phục kết nối:</strong> Dữ liệu tham quan trực tuyến đã sẵn sàng.
                            </div>
                        </>
                    ) : !isOnline ? (
                        <>
                            <span className="banner-icon icon-warning" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                                    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                                    <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                                    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                                    <line x1="12" y1="20" x2="12.01" y2="20"></line>
                                </svg>
                            </span>
                            <div className="banner-text">
                                <strong>Chế độ ngoại tuyến:</strong> Đang hiển thị bản đồ, khu vực, loài thú và POI từ bộ nhớ đệm ngoại tuyến
                                {cachedTimeLabel ? ` (đồng bộ lúc ${cachedTimeLabel})` : ''}. Các tác vụ mua vé, xác thực vé và phát audio trực tuyến tạm khóa.
                            </div>
                            <button
                                type="button"
                                className="banner-dismiss-btn"
                                onClick={dismissAlert}
                                aria-label="Đóng thông báo ngoại tuyến"
                            >
                                Đã hiểu
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="banner-icon icon-warning" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                            </span>
                            <div className="banner-text">
                                <strong>Máy chủ tạm thời không phản hồi:</strong> Đang sử dụng dữ liệu tham quan đã lưu trên thiết bị
                                {cachedTimeLabel ? ` (lúc ${cachedTimeLabel})` : ''}.
                            </div>
                            <button
                                type="button"
                                className="banner-dismiss-btn"
                                onClick={() => ZooApi.checkHealth()}
                                aria-label="Kiểm tra lại kết nối máy chủ"
                            >
                                Thử lại
                            </button>
                            <button
                                type="button"
                                className="banner-dismiss-btn"
                                onClick={dismissAlert}
                                aria-label="Đóng thông báo"
                            >
                                Ẩn
                            </button>
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}
