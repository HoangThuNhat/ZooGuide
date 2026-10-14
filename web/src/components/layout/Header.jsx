import React from 'react';
import { useApp } from '../../context/AppContext';
import PwaInstallButton from '../common/PwaInstallButton';

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
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                            <line x1="8" y1="2" x2="8" y2="18"></line>
                            <line x1="16" y1="6" x2="16" y2="22"></line>
                        </svg>
                        <span>Bản Đồ</span>
                    </a>
                    <a 
                        href="#species-audio" 
                        className={`nav-link ${currentTab === 'species-audio' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); switchTab('species-audio'); }}
                        role="tab" 
                        aria-selected={currentTab === 'species-audio'}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                        </svg>
                        <span>Thuyết Minh Loài</span>
                    </a>
                    <a 
                        href="#animals" 
                        className={`nav-link ${currentTab === 'animals' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); switchTab('animals'); }}
                        role="tab" 
                        aria-selected={currentTab === 'animals'}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        </svg>
                        <span>Cá Thể (Animals)</span>
                    </a>
                    <a 
                        href="#tickets" 
                        className={`nav-link ${currentTab === 'tickets' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); switchTab('tickets'); }}
                        role="tab" 
                        aria-selected={currentTab === 'tickets'}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                            <circle cx="12" cy="12" r="2"></circle>
                            <path d="M6 12h.01M18 12h.01"></path>
                        </svg>
                        <span>Vé Tham Quan</span>
                    </a>
                </nav>

                {/* Header Right Actions */}
                <div className="header-actions">
                    {/* PWA Install Action */}
                    <PwaInstallButton />

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
