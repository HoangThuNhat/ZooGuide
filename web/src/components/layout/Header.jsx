import React from 'react';
import { useApp } from '../../context/AppContext';

export default function Header() {
    const { currentTab, switchTab, currentLang, setLanguage, currentSession, hasActiveSession, setIsTicketModalOpen } = useApp();

    return (
        <header className="site-header" role="banner">
            <div className="container header-inner">
                {/* Brand Logo */}
                <a 
                    href="#map" 
                    className="brand-logo" 
                    onClick={(e) => { e.preventDefault(); switchTab('map'); }}
                    aria-label="Trang chủ ZooGuide"
                >
                    <div className="brand-icon-wrapper" aria-hidden="true">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2a9 9 0 0 0-9 9c0 4.1 2.8 7.6 6.7 8.6L12 22l2.3-2.4C18.2 18.6 21 15.1 21 11a9 9 0 0 0-9-9z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>
                    <div>
                        <h1 className="brand-title">ZooGuide</h1>
                        <span className="brand-subtitle">Smart Audio Tour</span>
                    </div>
                </a>

                {/* Desktop Navigation */}
                <nav className="desktop-nav" role="navigation" aria-label="Điều hướng chính">
                    <a 
                        href="#map" 
                        className={`nav-link ${currentTab === 'map' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); switchTab('map'); }}
                        role="tab" 
                        aria-selected={currentTab === 'map'}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                            <line x1="8" y1="2" x2="8" y2="18"></line>
                            <line x1="16" y1="6" x2="16" y2="22"></line>
                        </svg>
                        <span>Bản Đồ</span>
                    </a>
                    <a 
                        href="#animals" 
                        className={`nav-link ${currentTab === 'animals' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); switchTab('animals'); }}
                        role="tab" 
                        aria-selected={currentTab === 'animals'}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        </svg>
                        <span>Khám Phá</span>
                    </a>
                    <a 
                        href="#tickets" 
                        className={`nav-link ${currentTab === 'tickets' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); switchTab('tickets'); }}
                        role="tab" 
                        aria-selected={currentTab === 'tickets'}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                            <circle cx="12" cy="12" r="2"></circle>
                            <path d="M6 12h.01M18 12h.01"></path>
                        </svg>
                        <span>Vé Tham Quan</span>
                    </a>
                    <a 
                        href="#admin" 
                        className={`nav-link ${currentTab === 'admin' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); switchTab('admin'); }}
                        role="tab" 
                        aria-selected={currentTab === 'admin'}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>
                        </svg>
                        <span>Quản Lý</span>
                    </a>
                </nav>

                {/* Header Right Actions */}
                <div className="header-actions">
                    {/* Ticket Badge Trigger */}
                    <button 
                        id="ticket-status-badge" 
                        className={`ticket-badge-btn ${hasActiveSession ? 'badge-active' : 'badge-locked'}`}
                        aria-label="Trạng thái vé"
                        title={hasActiveSession ? `Vé: ${currentSession.ticketCode} - ${currentSession.ticketType}` : 'Chưa quét mã vé'}
                        onClick={() => setIsTicketModalOpen(true)}
                    >
                        <span className="status-dot"></span>
                        <span id="badge-ticket-text">
                            {hasActiveSession ? `Vé: ${currentSession.ticketCode}` : 'Vé: Chưa quét'}
                        </span>
                    </button>

                    {/* Language Switcher */}
                    <div className="lang-select-wrapper">
                        <select 
                            id="global-lang-select" 
                            className="lang-select" 
                            aria-label="Lựa chọn ngôn ngữ"
                            value={currentLang}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="vi">🇻🇳 Tiếng Việt</option>
                            <option value="en">🇬🇧 English</option>
                        </select>
                    </div>
                </div>
            </div>
        </header>
    );
}
