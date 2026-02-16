import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    DollarSign,
    Settings,
    LogOut,
    Menu,
    X,
    PackageIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';

interface MarketerLayoutProps {
    children: React.ReactNode;
}

export const MarketerLayout: React.FC<MarketerLayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navigation = [
        {
            name: 'Dashboard',
            href: '/marketer/dashboard',
            icon: LayoutDashboard,
        },
        {
            name: 'Referrals',
            href: '/marketer/referrals',
            icon: Users,
        },
        {
            name: 'Earnings',
            href: '/marketer/earnings',
            icon: DollarSign,
        },
        {
            name: 'Settings',
            href: '/marketer/settings',
            icon: Settings,
        },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/marketer/dashboard" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
                                    <PackageIcon className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-heading font-bold text-primary-500 text-xl">NIMEX</span>
                                <span className="hidden sm:inline-block ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                                    Marketer
                                </span>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-neutral-900">{user?.email}</p>
                                    <p className="text-xs text-neutral-500">Marketer Account</p>
                                </div>
                                <Button
                                    onClick={handleSignOut}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </Button>
                            </div>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
                            >
                                {mobileMenuOpen ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-neutral-200 bg-white">
                        <div className="px-4 py-3 space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                            <div className="pt-3 border-t border-neutral-200">
                                <div className="px-4 py-2">
                                    <p className="text-sm font-medium text-neutral-900">{user?.email}</p>
                                    <p className="text-xs text-neutral-500">Marketer Account</p>
                                </div>
                                <Button
                                    onClick={handleSignOut}
                                    variant="outline"
                                    className="w-full mt-2 flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main>
                {children}
            </main>
        </div>
    );
};
