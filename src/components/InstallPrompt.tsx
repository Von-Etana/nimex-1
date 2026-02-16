import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { usePWA } from '../hooks/usePWA';

export const InstallPrompt: React.FC = () => {
    const {
        isInstallable,
        isInstalled,
        isOnline,
        isUpdateAvailable,
        promptInstall,
        dismissInstallPrompt,
        shouldShowInstallPrompt,
        reloadForUpdate
    } = usePWA();

    const [showPrompt, setShowPrompt] = useState(false);
    const [showOfflineBanner, setShowOfflineBanner] = useState(false);

    useEffect(() => {
        if (shouldShowInstallPrompt()) {
            // Delay showing the prompt to not interrupt initial experience
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 30000); // Show after 30 seconds

            return () => clearTimeout(timer);
        }
    }, [shouldShowInstallPrompt]);

    useEffect(() => {
        setShowOfflineBanner(!isOnline);
    }, [isOnline]);

    const handleInstall = async () => {
        const installed = await promptInstall();
        if (installed) {
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        dismissInstallPrompt();
        setShowPrompt(false);
    };

    // Offline banner
    if (showOfflineBanner) {
        return (
            <div className="fixed bottom-0 left-0 right-0 bg-yellow-500 text-white px-4 py-3 z-50 flex items-center justify-center gap-2">
                <WifiOff className="w-5 h-5" />
                <span className="font-medium">You're offline. Some features may be limited.</span>
            </div>
        );
    }

    // Update available banner
    if (isUpdateAvailable) {
        return (
            <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white px-4 py-3 z-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    <span className="font-medium">A new version is available!</span>
                </div>
                <Button
                    onClick={reloadForUpdate}
                    size="sm"
                    className="bg-white text-blue-600 hover:bg-blue-50"
                >
                    Update Now
                </Button>
            </div>
        );
    }

    // Install prompt
    if (!showPrompt || isInstalled) {
        return null;
    }

    return (
        <>
            {/* Mobile bottom sheet */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg z-50 md:hidden animate-slide-up">
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Smartphone className="w-6 h-6 text-green-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-heading font-bold text-neutral-900 text-lg">
                                Install NIMEX App
                            </h3>
                            <p className="font-sans text-sm text-neutral-600 mt-1">
                                Get quick access and shop even when offline
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-2 hover:bg-neutral-100 rounded-lg"
                        >
                            <X className="w-5 h-5 text-neutral-400" />
                        </button>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <Button
                            onClick={handleDismiss}
                            variant="outline"
                            className="flex-1"
                        >
                            Not Now
                        </Button>
                        <Button
                            onClick={handleInstall}
                            className="flex-1 bg-green-700 hover:bg-green-800 text-white"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Install
                        </Button>
                    </div>
                </div>
            </div>

            {/* Desktop banner */}
            <div className="hidden md:block fixed bottom-4 right-4 max-w-sm bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up">
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Download className="w-5 h-5 text-green-700" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-heading font-semibold text-neutral-900">
                                Install NIMEX
                            </h3>
                            <p className="font-sans text-sm text-neutral-600 mt-1">
                                Add to your home screen for quick access
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-1 hover:bg-neutral-100 rounded"
                        >
                            <X className="w-4 h-4 text-neutral-400" />
                        </button>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <Button
                            onClick={handleDismiss}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                        >
                            Later
                        </Button>
                        <Button
                            onClick={handleInstall}
                            size="sm"
                            className="flex-1 bg-green-700 hover:bg-green-800 text-white"
                        >
                            Install App
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InstallPrompt;
