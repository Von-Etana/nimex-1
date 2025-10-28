import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PackageIcon, Bell, User, X, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const VendorMobileHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowMenu(false);
    navigate('/login');
  };

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-neutral-100 z-50">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/vendor/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
              <PackageIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-primary-500 text-xl">
              NIMEX
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/chat')}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
              aria-label="Chat"
            >
              <MessageCircle className="w-4 h-4 text-neutral-700" />
            </button>

            <button
              onClick={() => navigate('/notifications')}
              className="relative w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-neutral-700" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center text-white transition-colors"
              aria-label="User menu"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Vendor'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {showMenu && user && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setShowMenu(false)}
        >
          <div
            className="absolute top-14 right-0 w-64 bg-white rounded-bl-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'Vendor'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-semibold text-neutral-900 truncate">
                    {profile?.full_name || 'Vendor'}
                  </p>
                  <p className="font-sans text-xs text-neutral-600 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                onClick={() => {
                  navigate('/vendor/settings');
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-50 transition-colors text-left"
              >
                <User className="w-5 h-5 text-neutral-600" />
                <span className="font-sans text-sm text-neutral-900">Account Settings</span>
              </button>

              <button
                onClick={() => {
                  navigate('/');
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-50 transition-colors text-left"
              >
                <PackageIcon className="w-5 h-5 text-neutral-600" />
                <span className="font-sans text-sm text-neutral-900">View Marketplace</span>
              </button>

              <div className="my-2 border-t border-neutral-100"></div>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-left"
              >
                <X className="w-5 h-5 text-red-600" />
                <span className="font-sans text-sm text-red-600">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="md:hidden h-14"></div>
    </>
  );
};
