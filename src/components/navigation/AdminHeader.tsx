import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminHeader: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/listings', label: 'Listings' },
    { path: '/admin/transactions', label: 'Transactions' },
    { path: '/admin/disputes', label: 'Disputes' },
    { path: '/admin/escrow', label: 'Escrow' },
    { path: '/admin/support', label: 'Support' },
    { path: '/admin/kyc', label: 'KYC' },
    { path: '/admin/marketers', label: 'Marketers' },
    { path: '/admin/commissions', label: 'Commissions' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="w-full bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-3 md:px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-700 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="font-heading font-bold text-xl text-neutral-900 hidden md:block">
                NIMEX Admin
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-green-50 text-green-700'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors relative">
                <Search className="w-5 h-5 text-neutral-600" />
              </button>
              <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-neutral-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-neutral-600" />
              ) : (
                <Menu className="w-6 h-6 text-neutral-600" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-neutral-200 py-4 px-3">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg font-sans text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-green-50 text-green-700'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-200">
              <button className="flex-1 py-2 bg-neutral-100 rounded-lg font-sans text-sm">
                Search
              </button>
              <button className="flex-1 py-2 bg-neutral-100 rounded-lg font-sans text-sm relative">
                Notifications
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
