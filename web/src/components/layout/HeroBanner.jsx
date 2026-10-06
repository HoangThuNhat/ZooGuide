import React from 'react';
import { useApp } from '../../context/AppContext';

export default function HeroBanner() {
    const { switchTab, setIsTicketModalOpen, currentSession, hasActiveSession } = useApp();

    return (
        <section className="hero-banner">
            <div className="container hero-banner-inner">
                <div className="hero-content">
                    <span className="hero-tag">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polygon points="10 8 16 12 10 16 10 8"></polygon>
                        </svg>
                        SMART AUDIO TOUR SYSTEM
                    </span>
                    <h2 className="hero-title">Thuyết Minh Tự Động & Định Vị Sở Thú Thông Minh</h2>
                    <p className="hero-desc">
                        Trải nghiệm tham quan sở thú tương tác hoàn toàn mới: quét vé mở khóa thuyết minh theo vị trí, dẫn đường thông minh trên bản đồ và trợ lý ảo giải đáp 24/7.
                    </p>
                    <div className="hero-ctas">
                        <button className="btn btn-accent btn-unlock-ticket-trigger" onClick={() => setIsTicketModalOpen(true)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <span>Quét Vé Mở Khóa Ngay</span>
                        </button>
                        <button className="btn btn-secondary" onClick={() => switchTab('animals')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <span>Danh Sách Động Vật</span>
                        </button>
                    </div>
                </div>

                {/* Quick Active Session Pass Widget */}
                <div className="hero-ticket-box">
                    {hasActiveSession ? (
                        <div id="active-session-info">
                            <span className="badge badge-success mb-2">ĐÃ MỞ KHÓA</span>
                            <h4>Mã vé: <span id="badge-ticket-code" className="font-mono">{currentSession.ticketCode}</span></h4>
                            <p>Du khách: <strong id="badge-ticket-owner">{currentSession.customerName}</strong></p>
                            <p className="text-xs text-muted">Hạng: <span id="badge-ticket-type">{currentSession.ticketType}</span></p>
                        </div>
                    ) : (
                        <div id="no-session-info">
                            <h4>Chưa kích hoạt vé tham quan</h4>
                            <p>Nhập mã hoặc quét QR trên vé giấy để nghe thuyết minh không giới hạn.</p>
                            <button 
                                className="btn btn-sm btn-outline btn-unlock-ticket-trigger" 
                                style={{ background: '#FFF' }}
                                onClick={() => setIsTicketModalOpen(true)}
                            >
                                Nhập mã vé dùng thử
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
