import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage PWA installation capability across Chromium and iOS browsers.
 */
export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
    const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check if already in standalone mode
        const checkStandalone = () => {
            const isMatchMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isNavigatorStandalone = window.navigator.standalone === true;
            return isMatchMediaStandalone || isNavigatorStandalone;
        };

        setIsStandalone(checkStandalone());

        // Check if iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
        setIsIos(isIosDevice);

        // Capture Chromium install prompt
        const handleBeforeInstallPrompt = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
        };

        const handleAppInstalled = () => {
            console.log('[ZooGuide PWA] App was successfully installed.');
            setDeferredPrompt(null);
            setInstalledSuccessfully(true);
            setIsInstallModalOpen(false);
            setIsStandalone(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = useCallback(async () => {
        if (deferredPrompt) {
            // Show the native browser install prompt
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`[ZooGuide PWA] User install choice outcome: ${outcome}`);
            setDeferredPrompt(null);
            return outcome;
        } else if (isIos && !isStandalone) {
            // On iOS Safari, open instructional modal
            setIsInstallModalOpen(true);
            return 'ios_guide_opened';
        }
        return 'unsupported';
    }, [deferredPrompt, isIos, isStandalone]);

    // Installable if not already standalone and either deferredPrompt exists or it's iOS Safari
    const canInstall = !isStandalone && (Boolean(deferredPrompt) || isIos);

    return {
        canInstall,
        isStandalone,
        isIos,
        isInstallModalOpen,
        setIsInstallModalOpen,
        promptInstall,
        installedSuccessfully
    };
}
