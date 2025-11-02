/**
 * Code splitting utilities for better performance
 * Implements lazy loading and dynamic imports for route-based code splitting
 */

import React, { ComponentType, lazy } from 'react';

// Lazy load components for better performance
export const lazyLoad = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType<any>
) => {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>) => (
    <React.Suspense
      fallback={
        fallback ? (
          React.createElement(fallback)
        ) : (
          <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#006400] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#171a1f] font-['Inter']">Loading...</p>
            </div>
          </div>
        )
      }
    >
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Lazy loaded screen components
export const LazyHomeScreen = lazyLoad(
  () => import('../screens/FrameScreen')
);

export const LazyCategoriesScreen = lazyLoad(
  () => import('../screens/CategoriesScreen')
);

export const LazyProductsScreen = lazyLoad(
  () => import('../screens/ProductsScreen')
);

export const LazyVendorsScreen = lazyLoad(
  () => import('../screens/VendorsScreen')
);

export const LazyProductSearchScreen = lazyLoad(
  () => import('../screens/ProductSearchScreen')
);

export const LazyProductDetailScreen = lazyLoad(
  () => import('../screens/ProductDetailScreen')
);

export const LazyCartScreen = lazyLoad(
  () => import('../screens/CartScreen')
);

export const LazyCheckoutScreen = lazyLoad(
  () => import('../screens/CheckoutScreen')
);

export const LazyOrderTrackingScreen = lazyLoad(
  () => import('../screens/OrderTrackingScreen')
);

export const LazyChatScreen = lazyLoad(
  () => import('../screens/ChatScreen')
);

export const LazyProfileScreen = lazyLoad(
  () => import('../screens/ProfileScreen')
);

export const LazyOrdersScreen = lazyLoad(
  () => import('../screens/OrdersScreen')
);

export const LazyNotificationsScreen = lazyLoad(
  () => import('../screens/NotificationsScreen')
);

export const LazyBlogScreen = lazyLoad(
  () => import('../screens/BlogScreen')
);

export const LazyFAQScreen = lazyLoad(
  () => import('../screens/FAQScreen')
);

export const LazyAboutScreen = lazyLoad(
  () => import('../screens/AboutScreen')
);

export const LazyTermsScreen = lazyLoad(
  () => import('../screens/TermsScreen')
);

export const LazyPrivacyScreen = lazyLoad(
  () => import('../screens/PrivacyScreen')
);

export const LazyContactScreen = lazyLoad(
  () => import('../screens/ContactScreen')
);

// Vendor screens
export const LazyVendorOnboardingScreen = lazyLoad(
  () => import('../screens/vendor/VendorOnboardingScreen')
);

export const LazyVendorDashboardScreen = lazyLoad(
  () => import('../screens/vendor/VendorDashboardScreen')
);

export const LazyAdsManagementScreen = lazyLoad(
  () => import('../screens/vendor/AdsManagementScreen')
);

export const LazyProductsManagementScreen = lazyLoad(
  () => import('../screens/vendor/ProductsManagementScreen')
);

export const LazyCreateProductScreen = lazyLoad(
  () => import('../screens/vendor/CreateProductScreen')
);

export const LazyOrdersManagementScreen = lazyLoad(
  () => import('../screens/vendor/OrdersManagementScreen')
);

export const LazyDeliveryManagementScreen = lazyLoad(
  () => import('../screens/vendor/DeliveryManagementScreen')
);

export const LazyEscrowDashboardScreen = lazyLoad(
  () => import('../screens/vendor/EscrowDashboardScreen')
);

export const LazyVendorAccountScreen = lazyLoad(
  () => import('../screens/vendor/VendorAccountScreen')
);

export const LazyVendorProfileSettingsScreen = lazyLoad(
  () => import('../screens/vendor/VendorProfileSettingsScreen')
);

export const LazyAnalyticsScreen = lazyLoad(
  () => import('../screens/vendor/AnalyticsScreen')
);

export const LazyCustomersScreen = lazyLoad(
  () => import('../screens/vendor/CustomersScreen')
);

export const LazyMessagesScreen = lazyLoad(
  () => import('../screens/vendor/MessagesScreen')
);

export const LazyWalletScreen = lazyLoad(
  () => import('../screens/vendor/WalletScreen')
);

// Admin screens
export const LazyAdminDashboardScreen = lazyLoad(
  () => import('../screens/admin/AdminDashboardScreen')
);

export const LazyAdminUsersScreen = lazyLoad(
  () => import('../screens/admin/AdminUsersScreen')
);

export const LazyAdminListingsScreen = lazyLoad(
  () => import('../screens/admin/AdminListingsScreen')
);

export const LazyAdminTransactionsScreen = lazyLoad(
  () => import('../screens/admin/AdminTransactionsScreen')
);

export const LazyAdminKYCApprovalsScreen = lazyLoad(
  () => import('../screens/admin/AdminKYCApprovalsScreen')
);

export const LazyAdminSettingsScreen = lazyLoad(
  () => import('../screens/admin/AdminSettingsScreen')
);

// Auth screens
export const LazyLoginScreen = lazyLoad(
  () => import('../screens/auth/LoginScreen')
);

export const LazySignupScreen = lazyLoad(
  () => import('../screens/auth/SignupScreen')
);

// Utility functions for dynamic imports
export const loadComponent = async <T,>(
  importFunc: () => Promise<{ default: T }>
): Promise<T> => {
  const module = await importFunc();
  return module.default;
};

export const preloadComponent = <T,>(
  importFunc: () => Promise<{ default: T }>
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