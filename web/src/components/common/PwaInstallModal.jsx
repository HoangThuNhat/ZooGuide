import React, { useEffect } from 'react';

export default function PwaInstallModal({ isOpen, onClose }) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
            <div className="modal-container pwa-guide-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="pwa-guide-header-title">
                        <div className="brand-icon-wrapper" style={{ width: 32, height: 32 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a9 9 0 0 0-9 9c0 4.1 2.8 7.6 6.7 8.6L12 22l2.3-2.4C18.2 18.6 21 15.1 21 11a9 9 0 0 0-9-9z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </div>
                        <h3 id="pwa-install-title" className="modal-title">Cài Đặt ZooGuide Lên Màn Hình Chính</h3>
                    </div>
                    <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">&times;</button>
                </div>

                <div className="modal-body pwa-guide-body">
                    <p className="pwa-guide-desc">
                        Cài đặt ứng dụng ZooGuide vào điện thoại giúp bạn mở nhanh ngay từ màn hình chính, xem bản đồ mượt mà và tận hưởng trải nghiệm toàn màn hình như ứng dụng gốc!
                    </p>

                    <div className="pwa-steps-list">
                        <div className="pwa-step-item">
                            <div className="pwa-step-num">1</div>
                            <div className="pwa-step-info">
                                <strong>Chạm vào nút Chia sẻ (Share)</strong>
                                <span>Trên thanh công cụ phía dưới trình duyệt Safari, tìm biểu tượng ô vuông có mũi tên hướng lên:</span>
                                <div className="pwa-share-icon-preview">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                                        <polyline points="16 6 12 2 8 6"></polyline>
                                        <line x1="12" y1="2" x2="12" y2="15"></line>
                                    </svg>
                                    <span>Nút Chia sẻ</span>
                                </div>
                            </div>
                        </div>

                        <div className="pwa-step-item">
                            <div className="pwa-step-num">2</div>
                            <div className="pwa-step-info">
                                <strong>Chọn "Thêm vào Màn hình chính"</strong>
                                <span>Cuộn danh sách tác vụ và bấm vào dòng <em>Thêm vào MH chính (Add to Home Screen)</em>.</span>
                            </div>
                        </div>

                        <div className="pwa-step-item">
                            <div className="pwa-step-num">3</div>
                            <div className="pwa-step-info">
                                <strong>Xác nhận "Thêm"</strong>
                                <span>Bấm <strong>Thêm (Add)</strong> ở góc trên bên phải màn hình để hoàn tất.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
                        Tôi Đã Hiểu
                    </button>
                </div>
            </div>
        </div>
    );
}
