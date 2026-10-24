import React from 'react';
import { useApp } from '../../context/AppContext';

export default function MobileBottomNav() {
    const { currentTab, switchTab, t } = useApp();

    return (
        <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
            <div className="bottom-nav-items">
                <button
                    className={`bottom-nav-item ${currentTab === 'map' ? 'active' : ''}`}
                    onClick={() => switchTab('map')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                    </svg>
                    <span>{t?.tabMap || 'Bản Đồ'}</span>
                </button>
                <button
                    className={`bottom-nav-item ${currentTab === 'species-audio' ? 'active' : ''}`}
                    onClick={() => switchTab('species-audio')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                    </svg>
                    <span>{t?.tabSpeciesAudio || 'Thuyết Minh'}</span>
                </button>
                <button
                    className={`bottom-nav-item ${currentTab === 'animals' ? 'active' : ''}`}
                    onClick={() => switchTab('animals')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                    </svg>
                    <span>{t?.tabAnimals || 'Khám Phá'}</span>
                </button>
                <button
                    className={`bottom-nav-item ${currentTab === 'tickets' ? 'active' : ''}`}
                    onClick={() => switchTab('tickets')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                        <circle cx="12" cy="12" r="2"></circle>
                        <path d="M6 12h.01M18 12h.01"></path>
                    </svg>
                    <span>{t?.tabTicket || 'Vé Tham Quan'}</span>
                </button>
            </div>
        </nav>
    );
}
