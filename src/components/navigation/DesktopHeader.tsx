import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PackageIcon, SearchIcon, UserIcon, MessageCircle, Bell, LogOut, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../hooks/useCart';

export const DesktopHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { itemCount } = useCart();
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
    { label: 'Support', path: '/support' },
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
              className="font-sans text-sm font-medium text-neutral-700 hover:text-primary-600 transition-all hover:-translate-y-0.5 relative group flex flex-col items-center"
            >
              {item.label}
              <span className="absolute -bottom-1 w-0 h-0.5 bg-primary-500 transition-all duration-300 group-hover:w-full rounded-full opacity-0 group-hover:opacity-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => navigate('/cart')}
                className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="w-5 h-5 text-neutral-700" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
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
