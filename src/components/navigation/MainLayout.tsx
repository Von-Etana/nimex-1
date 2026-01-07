import React from 'react';
import { DesktopHeader } from './DesktopHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileHeader } from './MobileHeader';
import { EmailVerificationBanner } from '../EmailVerificationBanner';

interface MainLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, showBottomNav = true }) => {

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
