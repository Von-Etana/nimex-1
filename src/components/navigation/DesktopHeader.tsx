import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PackageIcon, SearchIcon, UserIcon, MessageCircle, Bell, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

export const DesktopHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowMenu(false);
    navigate('/login');
  };

  const navigationItems = [
    { label: 'Home', path: '/' },
    { label: 'Categories', path: '/categories' },
    { label: 'Products', path: '/products' },
    { label: 'Vendors', path: '/vendors' },
  ];

  return (
    <header className="hidden md:block w-full h-16 bg-white shadow-sm border-b border-neutral-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-500 rounded-md flex items-center justify-center">
            <PackageIcon className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading font-bold text-primary-500 text-2xl">
            NIMEX
          </span>
        </Link>

        <nav className="flex items-center gap-8">
          {navigationItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="font-sans text-sm text-neutral-700 hover:text-primary-500 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const searchQuery = (e.target as HTMLInputElement).value.trim();
                      if (searchQuery) {
                        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                      }
                    }
                  }}
                  className="w-64 h-10 pl-10 pr-4 rounded-lg border border-neutral-200 font-sans text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              </div>
              <Button
                onClick={() => navigate('/chat')}
                className="bg-green-700 hover:bg-green-800 text-white font-sans text-sm px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </Button>
              <Button
                onClick={() => navigate('/notifications')}
                className="bg-green-700 hover:bg-green-800 text-white font-sans text-sm px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Notifications
              </Button>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-10 h-10 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-white transition-colors"
                  aria-label="User menu"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5" />
                  )}
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-neutral-50 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-neutral-600" />
                      <span className="font-sans text-sm text-neutral-900">My Profile</span>
                    </button>

                    {profile?.role === 'vendor' && (
                      <button
                        onClick={() => {
                          navigate('/vendor/dashboard');
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-neutral-50 transition-colors"
                      >
                        <PackageIcon className="w-4 h-4 text-neutral-600" />
                        <span className="font-sans text-sm text-neutral-900">Vendor Dashboard</span>
                      </button>
                    )}

                    <div className="border-t border-neutral-100 my-1"></div>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span className="font-sans text-sm text-red-600">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate('/login')}
              className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 font-sans"
            >
              Login
              <UserIcon className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
