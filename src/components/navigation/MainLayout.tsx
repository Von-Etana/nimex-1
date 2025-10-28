import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DesktopHeader } from './DesktopHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileHeader } from './MobileHeader';
import { useAuth } from '../../contexts/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, showBottomNav = true }) => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile?.role === 'vendor') {
      navigate('/vendor/dashboard', { replace: true });
    }
  }, [profile, loading, navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <DesktopHeader />
      <MobileHeader />

      <main className="flex-1 w-full pb-16 md:pb-0">
        {children}
      </main>

      {showBottomNav && <MobileBottomNav />}
    </div>
  );
};
