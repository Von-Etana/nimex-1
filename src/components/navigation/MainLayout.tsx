import React, { useEffect } from 'react';
import { DesktopHeader } from './DesktopHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileHeader } from './MobileHeader';
import { EmailVerificationBanner } from '../EmailVerificationBanner';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';

interface MainLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, showBottomNav = true }) => {
  const { user } = useAuth();

  // Presence heartbeat - update online status every 2 minutes
  useEffect(() => {
    if (!user?.uid) return;

    const updatePresence = async () => {
      try {
        await FirestoreService.updateDocument(COLLECTIONS.PROFILES, user.uid, {
          last_seen: new Date().toISOString(),
          is_online: true
        });
      } catch (error) {
        // Silently fail - presence is not critical
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.uid]);

  // Removed: Automatic vendor redirect to dashboard
  // Vendors should be able to browse as buyers when they explicitly navigate to buyer pages
  // (e.g., clicking "Browse as Buyer" button or accessing /chat)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <EmailVerificationBanner />
      <DesktopHeader />
      <MobileHeader />

      <main className="flex-1 w-full pb-16 md:pb-0">
        {children}
      </main>

      {showBottomNav && <MobileBottomNav />}
    </div>
  );
};
