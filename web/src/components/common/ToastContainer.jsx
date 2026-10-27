import React from 'react';
import { useApp } from '../../context/AppContext';

export default function ToastContainer() {
    const { toasts, removeToast } = useApp();

    return (
        <div id="toast-container" className="toast-container" aria-live="polite" role="region" aria-label="Thông báo hệ thống">
            {toasts.map(toast => {
                let iconSvg = null;
                if (toast.type === 'success') {
                    iconSvg = (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    );
                } else if (toast.type === 'warning') {
                    iconSvg = (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    );
                } else if (toast.type === 'error') {
                    iconSvg = (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                    );
                } else {
                    iconSvg = (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    );
                }

                return (
                    <div key={toast.id} className={`toast-item toast-${toast.type}`} role="alert">
                        <span className="toast-icon">{iconSvg}</span>
                        <span className="toast-text">{toast.message}</span>
                        {typeof removeToast === 'function' && (
                            <button
                                type="button"
                                className="toast-close-btn"
                                onClick={() => removeToast(toast.id)}
                                aria-label="Đóng thông báo"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
