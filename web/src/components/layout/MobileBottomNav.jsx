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
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
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
                    </svg>
                    <span>{t?.tabTicket || 'Vé Vào'}</span>
                </button>
            </div>
        </nav>
    );
}
