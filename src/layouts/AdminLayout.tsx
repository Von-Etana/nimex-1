import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  FileCheck,
  Settings,
  Menu,
  X,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  permission?: string;
}

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/admin',
    },
    {
      icon: Users,
      label: 'Users',
      path: '/admin/users',
    },
    {
      icon: Package,
      label: 'Listings',
      path: '/admin/listings',
    },
    {
      icon: CreditCard,
      label: 'Transactions',
      path: '/admin/transactions',
    },
    {
      icon: ArrowUpRight,
      label: 'Withdrawals',
      path: '/admin/withdrawals',
    },
    {
      icon: FileCheck,
      label: 'KYC Approvals',
      path: '/admin/kyc',
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/admin/settings',
    },
    {
      icon: ShieldCheck,
      label: 'Marketers',
      path: '/admin/marketers',
    },
    {
      icon: CreditCard,
      label: 'Commissions',
      path: '/admin/commissions',
    },
  ];

  // Show all menu items since there's no authentication
  const visibleMenuItems = menuItems;

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-neutral-200 z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="font-heading font-bold text-lg text-neutral-900">NIMEX</h1>
                <p className="font-sans text-xs text-neutral-500">Admin Panel</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm text-neutral-900 truncate">
                  Admin Panel
                </p>
                <p className="font-sans text-xs text-neutral-500 truncate">
                  System Administration
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-sans text-sm transition-colors ${active
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-neutral-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 lg:flex-none">
              <h2 className="font-heading font-bold text-xl text-neutral-900">
                {visibleMenuItems.find((item) => isActive(item.path))?.label || 'Dashboard'}
              </h2>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
