import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const { user, profile, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-sans text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'admin') {
    return <Navigate to="/signin" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
