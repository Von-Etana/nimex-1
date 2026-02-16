import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
    isInstallable: boolean;
    isInstalled: boolean;
    isOnline: boolean;
    isUpdateAvailable: boolean;
}

export const usePWA = () => {
    const [state, setState] = useState<PWAState>({
        isInstallable: false,
        isInstalled: false,
        isOnline: navigator.onLine,
        isUpdateAvailable: false
    });
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        setState(prev => ({ ...prev, isInstalled: isStandalone }));

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setState(prev => ({ ...prev, isInstallable: true }));
        };

        // Listen for successful install
        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setState(prev => ({ ...prev, isInstallable: false, isInstalled: true }));
            console.log('PWA installed successfully');
        };

        // Listen for online/offline status
        const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
        const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

        // Listen for service worker updates
        const handleSwUpdate = () => {
            setState(prev => ({ ...prev, isUpdateAvailable: true }));
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('sw-update-available', handleSwUpdate);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('sw-update-available', handleSwUpdate);
        };
    }, []);

    const promptInstall = useCallback(async (): Promise<boolean> => {
        if (!deferredPrompt) {
            console.log('No install prompt available');
            return false;
        }

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
                setDeferredPrompt(null);
                setState(prev => ({ ...prev, isInstallable: false }));
                return true;
            } else {
                console.log('User dismissed the install prompt');
                return false;
            }
        } catch (error) {
            console.error('Error prompting install:', error);
            return false;
        }
    }, [deferredPrompt]);

    const dismissInstallPrompt = useCallback(() => {
        setDeferredPrompt(null);
        setState(prev => ({ ...prev, isInstallable: false }));

        // Store dismissal in localStorage
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }, []);

    const shouldShowInstallPrompt = useCallback(() => {
        if (!state.isInstallable || state.isInstalled) return false;

        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            // Don't show again for 7 days after dismissal
            const dismissedAt = parseInt(dismissed, 10);
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedAt < sevenDays) return false;
        }

        return true;
    }, [state.isInstallable, state.isInstalled]);

    const reloadForUpdate = useCallback(() => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
    }, []);

    return {
        ...state,
        promptInstall,
        dismissInstallPrompt,
        shouldShowInstallPrompt,
        reloadForUpdate
    };
};

export default usePWA;
