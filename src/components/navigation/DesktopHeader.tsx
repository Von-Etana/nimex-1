import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  PackageIcon,
  SearchIcon,
  UserIcon,
  MessageCircle,
  Bell,
  LogOut,
  ShoppingCart,
  ChevronDown,
  Store,
  Heart,
  ClipboardList,
  Settings,
  HelpCircle,
  Clock,
  X,
  TrendingUp
} from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../hooks/useCart';
import { searchHistoryService, SearchHistoryItem } from '../../services/searchHistoryService';

export const DesktopHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { itemCount } = useCart();
  const [showMenu, setShowMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchHistoryItem[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Popular/trending searches (static for now)
  const trendingSearches = ['Smartphones', 'Laptops', 'Fashion', 'Electronics', 'Groceries'];

  // Track scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showMenu && !(e.target as Element).closest('.user-menu-container')) {
        setShowMenu(false);
      }
      if (showSuggestions &&
        !suggestionsRef.current?.contains(e.target as Node) &&
        !searchInputRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu, showSuggestions]);

  // Update suggestions when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchSuggestions(searchHistoryService.getSuggestions(searchQuery));
    } else {
      setSearchSuggestions(searchHistoryService.getHistory().slice(0, 5));
    }
  }, [searchQuery]);

  const handleSignOut = async () => {
    await signOut();
    setShowMenu(false);
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchHistoryService.addSearch(searchQuery.trim());
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    searchHistoryService.addSearch(suggestion);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
  };

  const handleRemoveHistory = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    searchHistoryService.removeSearch(query);
    setSearchSuggestions(searchHistoryService.getSuggestions(searchQuery));
  };

  const navigationItems = [
    { label: 'Home', path: '/' },
    { label: 'Categories', path: '/categories' },
    { label: 'Products', path: '/products' },
    { label: 'Vendors', path: '/vendors' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className={`hidden md:block w-full sticky top-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-neutral-100'
        : 'bg-white border-b border-neutral-100'
        }`}
    >
      <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 flex-shrink-0 group"
        >
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-md group-hover:shadow-glow transition-all duration-300">
            <PackageIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-bold text-gradient-primary text-2xl tracking-tight">
            NIMEX
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navigationItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`relative px-4 py-2 rounded-lg font-sans text-sm font-medium transition-all duration-200 ${isActive(item.path)
                ? 'text-primary-600 bg-primary-50'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
            >
              {item.label}
              {isActive(item.path) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Search Bar with Suggestions */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <div className="relative group">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary-500 transition-colors z-10" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search products, vendors..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-neutral-200 bg-neutral-50 font-sans text-sm text-neutral-900 placeholder-neutral-400 transition-all duration-200 focus:outline-none focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              {/* Recent Searches */}
              {searchSuggestions.length > 0 && (
                <div className="py-2">
                  <p className="px-4 py-1 font-sans text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Recent Searches
                  </p>
                  {searchSuggestions.map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(item.query)}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-neutral-400" />
                        <span className="font-sans text-sm text-neutral-700">{item.query}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveHistory(item.query, e)}
                        className="p-1 hover:bg-neutral-200 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3 text-neutral-400" />
                      </button>
                    </button>
                  ))}
                </div>
              )}

              {/* Trending Searches */}
              {!searchQuery && (
                <div className="py-2 border-t border-neutral-100">
                  <p className="px-4 py-1 font-sans text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Trending
                  </p>
                  <div className="px-4 py-2 flex flex-wrap gap-2">
                    {trendingSearches.map((term, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(term)}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-primary-50 hover:text-primary-600 rounded-full font-sans text-xs font-medium text-neutral-600 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Wishlist */}
              <button
                onClick={() => navigate('/wishlist')}
                className="relative p-2.5 rounded-lg text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </button>

              {/* Cart */}
              <button
                onClick={() => navigate('/cart')}
                className="relative p-2.5 rounded-lg text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm animate-scale-in">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>

              {/* Messages */}
              <button
                onClick={() => navigate('/chat')}
                className="relative p-2.5 rounded-lg text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
                aria-label="Messages"
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2.5 rounded-lg text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* User Menu */}
              <div className="relative user-menu-container ml-1">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-all duration-200"
                  aria-label="User menu"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'User'}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <ChevronDown className={`w-4 h-4 text-neutral-600 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-premium-lg border border-neutral-100 py-2 z-50 animate-scale-in origin-top-right">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <p className="font-sans font-semibold text-neutral-900 truncate">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="font-sans text-xs text-neutral-500 truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={() => { navigate('/profile'); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-neutral-500" />
                        <span className="font-sans text-sm text-neutral-700">My Profile</span>
                      </button>

                      <button
                        onClick={() => { navigate('/orders'); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors"
                      >
                        <ClipboardList className="w-4 h-4 text-neutral-500" />
                        <span className="font-sans text-sm text-neutral-700">My Orders</span>
                      </button>

                      {profile?.role === 'vendor' && (
                        <button
                          onClick={() => { navigate('/vendor/dashboard'); setShowMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors"
                        >
                          <Store className="w-4 h-4 text-neutral-500" />
                          <span className="font-sans text-sm text-neutral-700">Vendor Dashboard</span>
                        </button>
                      )}

                      <button
                        onClick={() => { navigate('/support'); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 text-neutral-500" />
                        <span className="font-sans text-sm text-neutral-700">Help & Support</span>
                      </button>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-neutral-100 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-50 transition-colors group"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span className="font-sans text-sm text-red-600">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                className="font-sans text-sm font-medium text-neutral-700 hover:text-neutral-900"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/signup')}
                className="bg-gradient-primary hover:opacity-90 text-white font-sans text-sm font-semibold px-5 rounded-lg shadow-sm btn-shine"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
