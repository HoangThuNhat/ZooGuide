import React from 'react';
import { usePwaInstall } from '../../pwa/usePwaInstall';
import PwaInstallModal from './PwaInstallModal';

export default function PwaInstallButton({ className = '', variant = 'header' }) {
    const { 
        canInstall, 
        isStandalone, 
        isInstallModalOpen, 
        setIsInstallModalOpen, 
        promptInstall 
    } = usePwaInstall();

    // Do not show button if already running in standalone mode or installation is not possible
    if (isStandalone || !canInstall) {
        return null;
    }

    return (
        <>
            <button
                type="button"
                className={`pwa-install-btn ${variant === 'header' ? 'pwa-install-header-btn' : 'pwa-install-banner-btn'} ${className}`}
                onClick={promptInstall}
                aria-label="Cài đặt ứng dụng ZooGuide"
                title="Cài đặt ứng dụng ZooGuide lên màn hình chính"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Cài App</span>
            </button>

            {/* iOS & Browser Guidance Modal */}
            <PwaInstallModal 
                isOpen={isInstallModalOpen} 
                onClose={() => setIsInstallModalOpen(false)} 
            />
        </>
    );
}
