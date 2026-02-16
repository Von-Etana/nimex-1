/**
 * Code splitting utilities for better performance
 * Implements lazy loading and dynamic imports for route-based code splitting
 */

import React, { ComponentType, lazy } from 'react';

// Loading component for suspense fallback
const LoadingSpinner: React.FC = () => {
  return React.createElement('div', {
    className: 'flex items-center justify-center min-h-screen bg-white'
  }, React.createElement('div', {
    className: 'text-center'
  }, [
    React.createElement('div', {
      key: 'spinner',
      className: 'w-16 h-16 border-4 border-[#006400] border-t-transparent rounded-full animate-spin mx-auto mb-4'
    }),
    React.createElement('p', {
      key: 'text',
      className: 'text-[#171a1f] font-["Inter"]'
    }, 'Loading...')
  ]));
};

// Lazy load components for better performance
export const lazyLoad = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType<any>
) => {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>) => {
    return React.createElement(React.Suspense, {
      fallback: fallback ? React.createElement(fallback) : React.createElement(LoadingSpinner)
    }, React.createElement(LazyComponent, props));
  };
};

// Lazy loaded screen components - using direct lazy loading for better type safety
export const LazyHomeScreen = lazy(() => import('../screens/FrameScreen'));
export const LazyCategoriesScreen = lazy(() => import('../screens/CategoriesScreen'));
export const LazyProductsScreen = lazy(() => import('../screens/ProductsScreen'));
export const LazyVendorsScreen = lazy(() => import('../screens/VendorsScreen'));
export const LazyProductSearchScreen = lazy(() => import('../screens/ProductSearchScreen'));
export const LazyProductDetailScreen = lazy(() => import('../screens/ProductDetailScreen'));
export const LazyCartScreen = lazy(() => import('../screens/CartScreen'));
export const LazyCheckoutScreen = lazy(() => import('../screens/CheckoutScreen'));
export const LazyOrderTrackingScreen = lazy(() => import('../screens/OrderTrackingScreen'));
export const LazyChatScreen = lazy(() => import('../screens/ChatScreen'));
export const LazyProfileScreen = lazy(() => import('../screens/ProfileScreen'));
export const LazyOrdersScreen = lazy(() => import('../screens/OrdersScreen'));
export const LazyNotificationsScreen = lazy(() => import('../screens/NotificationsScreen'));
export const LazyBlogScreen = lazy(() => import('../screens/BlogScreen'));
export const LazyFAQScreen = lazy(() => import('../screens/FAQScreen'));
export const LazyAboutScreen = lazy(() => import('../screens/AboutScreen'));
export const LazyTermsScreen = lazy(() => import('../screens/TermsScreen'));
export const LazyPrivacyScreen = lazy(() => import('../screens/PrivacyScreen'));
export const LazyContactScreen = lazy(() => import('../screens/ContactScreen'));

// Vendor screens
export const LazyVendorOnboardingScreen = lazy(() => import('../screens/vendor/VendorOnboardingScreen'));
export const LazyVendorDashboardScreen = lazy(() => import('../screens/vendor/VendorDashboardScreen'));
export const LazyAdsManagementScreen = lazy(() => import('../screens/vendor/AdsManagementScreen'));
export const LazyProductsManagementScreen = lazy(() => import('../screens/vendor/ProductsManagementScreen'));
export const LazyCreateProductScreen = lazy(() => import('../screens/vendor/CreateProductScreen'));
export const LazyOrdersManagementScreen = lazy(() => import('../screens/vendor/OrdersManagementScreen'));
export const LazyDeliveryManagementScreen = lazy(() => import('../screens/vendor/DeliveryManagementScreen'));
export const LazyEscrowDashboardScreen = lazy(() => import('../screens/vendor/EscrowDashboardScreen'));
export const LazyVendorAccountScreen = lazy(() => import('../screens/vendor/VendorAccountScreen'));
export const LazyVendorProfileSettingsScreen = lazy(() => import('../screens/vendor/VendorProfileSettingsScreen'));
export const LazyAnalyticsScreen = lazy(() => import('../screens/vendor/AnalyticsScreen'));
export const LazyCustomersScreen = lazy(() => import('../screens/vendor/CustomersScreen'));
export const LazyMessagesScreen = lazy(() => import('../screens/vendor/MessagesScreen'));
export const LazyWalletScreen = lazy(() => import('../screens/vendor/WalletScreen'));

// Admin screens
export const LazyAdminDashboardScreen = lazy(() => import('../screens/admin/AdminDashboardScreen'));
export const LazyAdminUsersScreen = lazy(() => import('../screens/admin/AdminUsersScreen'));
export const LazyAdminListingsScreen = lazy(() => import('../screens/admin/AdminListingsScreen'));
export const LazyAdminTransactionsScreen = lazy(() => import('../screens/admin/AdminTransactionsScreen'));
export const LazyAdminKYCApprovalsScreen = lazy(() => import('../screens/admin/AdminKYCApprovalsScreen'));
export const LazyAdminSettingsScreen = lazy(() => import('../screens/admin/AdminSettingsScreen'));

// Auth screens
export const LazyLoginScreen = lazy(() => import('../screens/auth/LoginScreen'));
export const LazySignupScreen = lazy(() => import('../screens/auth/SignupScreen'));

// Utility functions for dynamic imports
export const loadComponent = async <T,>(
  importFunc: () => Promise<T>
): Promise<T> => {
  return await importFunc();
};

export const preloadComponent = <T,>(
  importFunc: () => Promise<T>
): void => {
  // Preload component in the background
  importFunc().catch(() => {
    // Ignore preload errors
  });
};

// Preload critical components
export const preloadCriticalComponents = (): void => {
  // Preload auth screens for faster login/signup
  setTimeout(() => {
    preloadComponent(() => import('../screens/auth/LoginScreen'));
    preloadComponent(() => import('../screens/auth/SignupScreen'));
  }, 1000);

  // Preload vendor onboarding for vendors
  setTimeout(() => {
    preloadComponent(() => import('../screens/vendor/VendorOnboardingScreen'));
  }, 2000);
};

// Bundle analyzer helper
export const getBundleInfo = () => {
  // This would integrate with webpack bundle analyzer in production
  if (import.meta.env.DEV) {
    console.log('Bundle analysis available in production build');
  }
};