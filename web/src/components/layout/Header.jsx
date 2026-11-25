import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import PwaInstallButton from '../common/PwaInstallButton';

export default function Header() {
    const {
        currentTab,
        switchTab,
        currentLang,
        setLanguage,
        supportedLanguages,
        currentSession,
        hasActiveSession,
        setIsTicketModalOpen,
        openElectronicTicketModal,
        t
    } = useApp();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!isMobileMenuOpen) return undefined;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsMobileMenuOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobileMenuOpen]);

    const handleNavClick = (tab) => {
        switchTab(tab);
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            <header className="site-header" role="banner">
                <div className="container header-inner">
                    {/* Brand Logo & Editorial Title */}
                    <a
                        href="#map"
                        className="brand-logo"
                        onClick={(e) => { e.preventDefault(); handleNavClick('map'); }}
                        aria-label="ZooGuide - Thảo Cầm Viên Sài Gòn"
                    >
                        <div className="brand-icon-wrapper" aria-hidden="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a9 9 0 0 0-9 9c0 4.1 2.8 7.6 6.7 8.6L12 22l2.3-2.4C18.2 18.6 21 15.1 21 11a9 9 0 0 0-9-9z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </div>
                        <div className="brand-text">
                            <h1 className="brand-title">ZooGuide</h1>
                            <span className="brand-subtitle">{t?.brandSubtitle || 'Thảo Cầm Viên Sài Gòn'}</span>
                        </div>
                    </a>

                    {/* Desktop Navigation - Strictly Single-Line */}
                    <nav className="desktop-nav" role="navigation" aria-label="Main navigation">
                        <a
                            href="#map"
                            className={`nav-link ${currentTab === 'map' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); handleNavClick('map'); }}
                            role="tab"
                            aria-selected={currentTab === 'map'}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                                <line x1="8" y1="2" x2="8" y2="18"></line>
                                <line x1="16" y1="6" x2="16" y2="22"></line>
                            </svg>
                            <span>{t?.tabMap || 'Bản Đồ'}</span>
                        </a>
                        <a
                            href="#species-audio"
                            className={`nav-link ${currentTab === 'species-audio' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); handleNavClick('species-audio'); }}
                            role="tab"
                            aria-selected={currentTab === 'species-audio'}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                            </svg>
                            <span>{t?.tabSpeciesAudio || 'Thuyết Minh'}</span>
                        </a>
                        <a
                            href="#animals"
                            className={`nav-link ${currentTab === 'animals' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); handleNavClick('animals'); }}
                            role="tab"
                            aria-selected={currentTab === 'animals'}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                            </svg>
                            <span>{t?.tabAnimals || 'Khám Phá Động Vật'}</span>
                        </a>
                        <a
                            href="#tickets"
                            className={`nav-link ${currentTab === 'tickets' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); handleNavClick('tickets'); }}
                            role="tab"
                            aria-selected={currentTab === 'tickets'}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                                <circle cx="12" cy="12" r="2"></circle>
                                <path d="M6 12h.01M18 12h.01"></path>
                            </svg>
                            <span>{t?.tabTicket || 'Vé Tham Quan'}</span>
                        </a>
                    </nav>

                    {/* Header Right Actions */}
                    <div className="header-actions">
                        <PwaInstallButton variant="header" />
                        {hasActiveSession ? (
                            <button
                                id="ticket-status-badge"
                                className="ticket-badge-btn badge-active"
                                aria-label="Trạng thái vé tham quan đang hoạt động"
                                title={`Mã vé: ${currentSession.ticketCode} - Bấm để xem thông tin thẻ điện tử`}
                                onClick={() => openElectronicTicketModal()}
                            >
                                <span className="status-dot"></span>
                                <span id="badge-ticket-text" className="font-mono">
                                    {currentSession.ticketCode}
                                </span>
                            </button>
                        ) : (
                            <button
                                id="ticket-status-badge"
                                className="ticket-badge-btn badge-locked"
                                aria-label="Kích hoạt vé tham quan"
                                title="Nhập mã vé hoặc kích hoạt vé mới"
                                onClick={() => setIsTicketModalOpen(true)}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 2l-2 2m-1-1l-3 3m2 2l-3 3m-2-2l-3 3M3 21l8-8"></path>
                                    <circle cx="7.5" cy="16.5" r="2.5"></circle>
                                </svg>
                                <span>{t?.headerTicketActivate || 'Kích Hoạt Vé'}</span>
                            </button>
                        )}

                        {/* Language Switcher */}
                        <div className="lang-select-wrapper">
                            <svg className="lang-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                            <select
                                id="global-lang-select"
                                className="lang-select"
                                aria-label="Lựa chọn ngôn ngữ"
                                value={currentLang}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                {supportedLanguages.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flagIcon || '🌐'} {lang.nativeName || lang.name} ({lang.code.toUpperCase()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Mobile & Tablet Hamburger Toggle (< 1024px) */}
                        <button
                            type="button"
                            className="header-menu-toggle"
                            aria-label="Mở trình đơn chuyển hướng"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Slide-over Mobile Navigation Drawer */}
            <div
                className={`mobile-nav-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-hidden="true"
            />
            <div
                className={`mobile-nav-drawer ${isMobileMenuOpen ? 'open' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label="Menu chuyển hướng"
            >
                <div className="mobile-nav-drawer-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M12 2a9 9 0 0 0-9 9c0 4.1 2.8 7.6 6.7 8.6L12 22l2.3-2.4C18.2 18.6 21 15.1 21 11a9 9 0 0 0-9-9z"></path>
                            </svg>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>ZooGuide</span>
                    </div>
                    <button
                        type="button"
                        className="mobile-drawer-close-btn"
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-label="Đóng menu"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="mobile-nav-drawer-body">
                    {/* Mobile Language Selector */}
                    <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>
                            {t?.languageLabel || 'Ngôn ngữ hiển thị'}
                        </label>
                        <select
                            className="lang-select"
                            style={{ width: '100%', height: '38px', fontSize: '0.875rem', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 12px', backgroundColor: '#F8FAFC' }}
                            value={currentLang}
                            onChange={(e) => setLanguage(e.target.value)}
                            aria-label="Lựa chọn ngôn ngữ"
                        >
                            {supportedLanguages && supportedLanguages.map((l) => (
                                <option key={l.code} value={l.code}>
                                    {l.flagIcon} {l.nativeName || l.name} ({l.code.toUpperCase()})
                                </option>
                            ))}
                        </select>
                    </div>

                    <a
                        href="#map"
                        className={`mobile-drawer-link ${currentTab === 'map' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); handleNavClick('map'); }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                            <line x1="8" y1="2" x2="8" y2="18"></line>
                            <line x1="16" y1="6" x2="16" y2="22"></line>
                        </svg>
                        <span>{t?.tabMap || 'Bản Đồ Địa Lý'}</span>
                    </a>
                    <a
                        href="#species-audio"
                        className={`mobile-drawer-link ${currentTab === 'species-audio' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); handleNavClick('species-audio'); }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                        </svg>
                        <span>{t?.tabSpeciesAudio || 'Thuyết Minh Loài'}</span>
                    </a>
                    <a
                        href="#animals"
                        className={`mobile-drawer-link ${currentTab === 'animals' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); handleNavClick('animals'); }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                        </svg>
                        <span>{t?.tabAnimals || 'Khám Phá Động Vật'}</span>
                    </a>
                    <a
                        href="#tickets"
                        className={`mobile-drawer-link ${currentTab === 'tickets' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); handleNavClick('tickets'); }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                            <circle cx="12" cy="12" r="2"></circle>
                            <path d="M6 12h.01M18 12h.01"></path>
                        </svg>
                        <span>{t?.tabTicket || 'Vé Tham Quan & VietQR'}</span>
                    </a>

                    <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <PwaInstallButton variant="banner" />
                        {hasActiveSession ? (
                            <button
                                className="btn btn-sm btn-primary"
                                style={{ width: '100%', borderRadius: '6px' }}
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    openElectronicTicketModal();
                                }}
                            >
                                {t?.heroViewPass || 'Xem Thẻ Tham Quan'} ({currentSession.ticketCode})
                            </button>
                        ) : (
                            <>
                                <button
                                    className="btn btn-sm btn-primary"
                                    style={{ width: '100%', borderRadius: '6px', background: '#D97706', borderColor: '#D97706' }}
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        switchTab('tickets');
                                    }}
                                >
                                    {t?.heroBtnBuyTicket || 'Đặt Vé Trực Tuyến'}
                                </button>
                                <button
                                    className="btn btn-sm btn-outline"
                                    style={{ width: '100%', borderRadius: '6px' }}
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        setIsTicketModalOpen(true);
                                    }}
                                >
                                    {t?.btnActivateTicket || 'Kích Hoạt Vé'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
