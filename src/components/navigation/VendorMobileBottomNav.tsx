import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, MessageCircle, User } from 'lucide-react';

export const VendorMobileBottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vendor/products', label: 'Products', icon: Package },
    { path: '/vendor/orders', label: 'Orders', icon: ShoppingBag },
    { path: '/vendor/messages', label: 'Messages', icon: MessageCircle },
    { path: '/vendor/account', label: 'Account', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-primary-500' : 'text-neutral-600'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium font-sans">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
