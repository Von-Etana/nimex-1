import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#006400] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#171a1f] font-['Inter']">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  // Check if vendor needs onboarding (but allow access to onboarding page itself)
  if (user && profile?.role === 'vendor' && profile.needsOnboarding && location.pathname !== '/vendor/onboarding') {
    console.log('ProtectedRoute: Vendor needs onboarding, redirecting to /vendor/onboarding', {
      userId: user.id,
      role: profile.role,
      needsOnboarding: profile.needsOnboarding,
      currentPath: location.pathname
    });
    return <Navigate to="/vendor/onboarding" replace />;
  }

  if (user && profile?.role === 'vendor' && !profile.needsOnboarding && location.pathname === '/vendor/onboarding') {
    console.log('ProtectedRoute: Vendor onboarding complete, redirecting to dashboard', {
      userId: user.id,
      role: profile.role,
      needsOnboarding: profile.needsOnboarding,
      currentPath: location.pathname
    });
    return <Navigate to="/vendor/dashboard" replace />;
  }

  return <>{children}</>;
};
