import React from 'react';
import { VendorSidebar } from './VendorSidebar';
import { VendorDesktopHeader, VendorMobileHeader, VendorMobileBottomNav } from '../navigation';

interface VendorLayoutProps {
  children: React.ReactNode;
}

export const VendorLayout: React.FC<VendorLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <VendorDesktopHeader />
      <VendorMobileHeader />

      <div className="flex flex-1">
        <VendorSidebar />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
      </div>

      <VendorMobileBottomNav />
    </div>
  );
};
