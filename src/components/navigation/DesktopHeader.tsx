import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PackageIcon, SearchIcon, UserIcon, MessageCircle, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

export const DesktopHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
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
              <Button
                onClick={() => navigate('/search')}
                className="bg-green-700 hover:bg-green-800 text-white font-sans text-sm px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <SearchIcon className="w-4 h-4" />
                Search
              </Button>
              <Button
                onClick={() => navigate('/chat')}
                className="bg-green-700 hover:bg-green-800 text-white font-sans text-sm px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </Button>
              <Button
                onClick={() => {/* notifications logic */}}
                className="bg-green-700 hover:bg-green-800 text-white font-sans text-sm px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Notifications
              </Button>
              <button
                onClick={handleSignOut}
                className="w-10 h-10 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-white transition-colors"
              >
                <UserIcon className="w-5 h-5" />
              </button>
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
