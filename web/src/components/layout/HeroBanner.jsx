import React from 'react';
import { useApp } from '../../context/AppContext';

export default function HeroBanner() {
    const { switchTab, setIsTicketModalOpen, currentSession, hasActiveSession, t } = useApp();

    return (
        <section className="hero-banner" style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #15803D 60%, #166534 100%)',
            color: '#FFFFFF',
            position: 'relative',
            overflow: 'hidden',
            padding: '36px 0 28px 0'
        }}>
            <div className="container hero-banner-inner" style={{ position: 'relative', zIndex: 2 }}>
                <div className="hero-content" style={{ maxWidth: '640px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255,255,255,0.16)',
                        color: '#FEF08A',
                        border: '1px solid rgba(254,240,138,0.3)',
                        fontWeight: 700,
                        letterSpacing: '0.6px',
                        fontSize: '0.75rem',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        marginBottom: '12px'
                    }}>
                        <span>THẢO CẦM VIÊN SÀI GÒN</span>
                        <span>•</span>
                        <span>THÀNH LẬP NĂM 1864</span>
                    </div>

                    <h1 className="hero-title" style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        lineHeight: 1.25,
                        margin: '0 0 12px 0',
                        color: '#FFFFFF',
                        letterSpacing: '-0.3px'
                    }}>
                        Hệ Thống Hướng Dẫn Tham Quan Sở Thú & Định Vị Bản Đồ Thực Tế
                    </h1>

                    <p className="hero-desc" style={{
                        fontSize: '0.95rem',
                        color: 'rgba(255,255,255,0.92)',
                        lineHeight: 1.6,
                        margin: '0 0 20px 0'
                    }}>
                        Trải nghiệm tham quan tương tác với bản đồ địa lý thực tế (OpenStreetMap), thuyết minh âm thanh đa ngôn ngữ và đặt vé trực tuyến thanh toán VietQR cấp mã tức thì.
                    </p>

                    {/* Action Buttons */}
                    <div className="hero-ctas" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                            className="btn"
                            style={{
                                background: '#F59E0B',
                                color: '#0F172A',
                                fontWeight: 700,
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                            onClick={() => switchTab('tickets')}
                        >
                            Đặt vé & Thanh toán VietQR
                        </button>

                        <button
                            className="btn"
                            style={{
                                background: 'rgba(255,255,255,0.16)',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                padding: '10px 18px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                backdropFilter: 'blur(6px)',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                            onClick={() => switchTab('map')}
                        >
                            Xem bản đồ địa lý
                        </button>

                        <button
                            className="btn"
                            style={{
                                background: 'transparent',
                                color: '#FFFFFF',
                                fontWeight: 600,
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.88rem',
                                textDecoration: 'underline'
                            }}
                            onClick={() => switchTab('animals')}
                        >
                            Khám phá động vật
                        </button>
                    </div>
                </div>

                {/* Quick Session Pass Widget */}
                <div className="hero-ticket-box" style={{
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '20px',
                    padding: '20px',
                    color: '#FFFFFF',
                    maxWidth: '340px'
                }}>
                    {hasActiveSession ? (
                        <div id="active-session-info">
                            <span className="badge badge-success mb-2" style={{ background: '#4ADE80', color: '#064E3B', fontWeight: 800, fontSize: '0.72rem' }}>
                                PHIÊN THAM QUAN ĐÃ KÍCH HOẠT
                            </span>
                            <h4 style={{ margin: '8px 0 4px 0', fontSize: '1rem', color: '#FFF' }}>
                                Mã vé: <span className="font-mono" style={{ color: '#FEF08A' }}>{currentSession.ticketCode}</span>
                            </h4>
                            <p style={{ margin: '4px 0', fontSize: '0.85rem', opacity: 0.9 }}>
                                Du khách: <strong>{currentSession.customerName || 'Khách tham quan'}</strong>
                            </p>
                            <p style={{ margin: '4px 0 12px 0', fontSize: '0.78rem', opacity: 0.8 }}>
                                Hạng vé: {currentSession.ticketType || 'Chuẩn'} • Mở khóa thuyết minh & bản đồ
                            </p>
                            <button
                                className="btn btn-sm btn-outline"
                                style={{ background: '#FFF', color: '#0F172A', border: 'none', fontWeight: 700, borderRadius: '8px', width: '100%', fontSize: '0.82rem' }}
                                onClick={() => switchTab('tickets')}
                            >
                                Xem thẻ tham quan điện tử
                            </button>
                        </div>
                    ) : (
                        <div id="no-session-info">
                            <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                THẺ THAM QUAN
                            </span>
                            <h4 style={{ margin: '8px 0 4px 0', fontSize: '1.05rem', fontWeight: 800 }}>
                                Kích hoạt vé tham quan
                            </h4>
                            <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', opacity: 0.9, lineHeight: 1.5 }}>
                                Nhập mã vé hoặc quét QR để mở khóa nghe thuyết minh tự động GPS và bản đồ hướng dẫn chi tiết.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    className="btn btn-sm"
                                    style={{ background: '#FFFFFF', color: '#064E3B', fontWeight: 700, borderRadius: '8px', padding: '9px', fontSize: '0.85rem' }}
                                    onClick={() => setIsTicketModalOpen(true)}
                                >
                                    Quét hoặc nhập mã vé
                                </button>
                                <button
                                    className="btn btn-sm"
                                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFF', fontWeight: 600, borderRadius: '8px', fontSize: '0.82rem' }}
                                    onClick={() => switchTab('tickets')}
                                >
                                    Mua vé trực tuyến
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Thông tin thực tế Thảo Cầm Viên Sài Gòn */}
            <div className="container" style={{ position: 'relative', zIndex: 2, marginTop: '20px' }}>
                <div style={{
                    background: 'rgba(0, 0, 0, 0.22)',
                    backdropFilter: 'blur(6px)',
                    borderRadius: '14px',
                    padding: '10px 18px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    fontSize: '0.82rem'
                }}>
                    <div>
                        <div style={{ fontWeight: 700, color: '#FEF08A' }}>Giờ mở cửa hàng ngày</div>
                        <div style={{ opacity: 0.9 }}>07:00 – 18:30 (Kể cả Lễ, Tết)</div>
                    </div>

                    <div>
                        <div style={{ fontWeight: 700, color: '#FEF08A' }}>Địa chỉ sở thú</div>
                        <div style={{ opacity: 0.9 }}>2 Nguyễn Bỉnh Khiêm, P. Bến Nghé, Q.1</div>
                    </div>

                    <div>
                        <div style={{ fontWeight: 700, color: '#FEF08A' }}>Giá vé vào cổng</div>
                        <div style={{ opacity: 0.9 }}>60.000đ (Người lớn) • 40.000đ (Trẻ em)</div>
                    </div>

                    <div>
                        <div style={{ fontWeight: 700, color: '#FEF08A' }}>4 Cổng đón khách</div>
                        <div style={{ opacity: 0.9 }}>Cổng A (Lê Duẩn), Cổng B, C, E</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
