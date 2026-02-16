import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart2,
  MessageSquare,
  Settings,
  Megaphone,
  Wallet,
  Users,
  User,
  Truck,
  Shield,
  UserPlus,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const mainNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/vendor/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Account',
    path: '/vendor/account',
    icon: <User className="w-5 h-5" />,
  },
  {
    label: 'Products',
    path: '/vendor/products',
    icon: <Package className="w-5 h-5" />,
  },
  {
    label: 'Ads',
    path: '/vendor/ads',
    icon: <Megaphone className="w-5 h-5" />,
  },
  {
    label: 'Orders',
    path: '/vendor/orders',
    icon: <ShoppingBag className="w-5 h-5" />,
  },
];

const additionalNavItems: NavItem[] = [
  {
    label: 'Deliveries',
    path: '/vendor/deliveries',
    icon: <Truck className="w-5 h-5" />,
  },
  {
    label: 'Escrow',
    path: '/vendor/escrow',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    label: 'Analytics',
    path: '/vendor/analytics',
    icon: <BarChart2 className="w-5 h-5" />,
  },
  {
    label: 'Customers',
    path: '/vendor/customers',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Messages',
    path: '/vendor/messages',
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    label: 'Wallet',
    path: '/vendor/wallet',
    icon: <Wallet className="w-5 h-5" />,
  },
  {
    label: 'Referrals',
    path: '/vendor/referrals',
    icon: <UserPlus className="w-5 h-5" />,
  },
];

export const VendorSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex w-64 min-h-screen bg-white border-r border-neutral-200 flex-col">
      <div className="p-6 border-b border-neutral-200">
        <h2 className="font-heading font-bold text-neutral-900 text-xl">
          Vendor Portal
        </h2>
        <p className="font-sans text-sm text-neutral-600 mt-1">
          Manage your business
        </p>
      </div>

      <nav className="flex-1 p-4">
        <div className="flex flex-col gap-1">
          <div className="mb-2">
            <p className="px-4 py-2 text-xs font-sans font-semibold text-neutral-500 uppercase tracking-wider">
              Main Menu
            </p>
          </div>
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-green-700 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {item.icon}
                <span className="font-sans text-sm font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <div className="my-4 border-t border-neutral-200"></div>

          <div className="mb-2">
            <p className="px-4 py-2 text-xs font-sans font-semibold text-neutral-500 uppercase tracking-wider">
              More
            </p>
          </div>
          {additionalNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-green-700 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {item.icon}
                <span className="font-sans text-sm font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};
