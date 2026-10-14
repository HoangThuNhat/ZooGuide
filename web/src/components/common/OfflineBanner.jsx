import React from 'react';
import { useNetworkStatus } from '../../pwa/useNetworkStatus';

export default function OfflineBanner() {
    const { isOnline, showReconnected, isDismissed, dismissAlert } = useNetworkStatus();

    // If online and not currently showing reconnection feedback, render nothing
    if (isOnline && !showReconnected) {
        return null;
    }

    // If user explicitly dismissed the offline alert for the current session, render nothing
    if (!isOnline && isDismissed) {
        return null;
    }

    return (
        <aside 
            className={`network-status-banner ${isOnline ? 'banner-reconnected' : 'banner-offline'}`}
            role="status"
            aria-live="polite"
        >
            <div className="container banner-inner">
                <div className="banner-content">
                    {isOnline ? (
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
                                <strong>Đã khôi phục kết nối:</strong> Thiết bị đã kết nối lại Internet.
                            </div>
                        </>
                    ) : (
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
                                <strong>Chế độ ngoại tuyến:</strong> Thiết bị mất kết nối mạng. Bạn vẫn có thể duyệt giao diện App Shell đã lưu; các tác vụ quét vé, phiên tham quan và chatbot yêu cầu kết nối mạng.
                            </div>
                            <button 
                                className="banner-dismiss-btn"
                                onClick={dismissAlert}
                                aria-label="Đóng thông báo ngoại tuyến"
                            >
                                Đã hiểu
                            </button>
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}
