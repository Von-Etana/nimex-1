import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { MainLayout } from './components/navigation';
import { VendorLayout } from './components/vendor';
import { AdminLayout } from './layouts/AdminLayout';
import { FrameScreen } from './screens/FrameScreen';
import { LoginScreen, SignupScreen } from './screens/auth';
import { configValidator } from './services/configValidator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logger } from './lib/logger';
import { Loader2 } from 'lucide-react';

// Lazy load screens
const AdminDashboardScreen = React.lazy(() => import('./screens/admin').then(module => ({ default: module.AdminDashboardScreen })));
const AdminUsersScreen = React.lazy(() => import('./screens/admin').then(module => ({ default: module.AdminUsersScreen })));
const AdminListingsScreen = React.lazy(() => import('./screens/admin').then(module => ({ default: module.AdminListingsScreen })));
const AdminTransactionsScreen = React.lazy(() => import('./screens/admin').then(module => ({ default: module.AdminTransactionsScreen })));
const AdminDisputesScreen = React.lazy(() => import('./screens/admin').then(module => ({ default: module.AdminDisputesScreen })));
const AdminEscrowScreen = React.lazy(() => import('./screens/admin').then(module => ({ default: module.AdminEscrowScreen })));
const AdminSupportScreen = React.lazy(() => import('./screens/admin').then(module => ({ default: module.AdminSupportScreen })));
const AdminKYCApprovalsScreen = React.lazy(() => import('./screens/admin').then(module => ({ default: module.AdminKYCApprovalsScreen })));
const AdminSettingsScreen = React.lazy(() => import('./screens/admin').then(module => ({ default: module.AdminSettingsScreen })));
const AdminSettingsDetailScreen = React.lazy(() => import('./screens/admin').then(module => ({ default: module.AdminSettingsDetailScreen })));
const AdminMarketersScreen = React.lazy(() => import('./screens/admin').then(module => ({ default: module.AdminMarketersScreen })));
const AdminCommissionsScreen = React.lazy(() => import('./screens/admin').then(module => ({ default: module.AdminCommissionsScreen })));

const ProductSearchScreen = React.lazy(() => import('./screens/ProductSearchScreen').then(module => ({ default: module.ProductSearchScreen })));
const ProductDetailScreen = React.lazy(() => import('./screens/ProductDetailScreen').then(module => ({ default: module.ProductDetailScreen })));
const CartScreen = React.lazy(() => import('./screens/CartScreen').then(module => ({ default: module.CartScreen })));
const CategoriesScreen = React.lazy(() => import('./screens/CategoriesScreen').then(module => ({ default: module.CategoriesScreen })));
const VendorsScreen = React.lazy(() => import('./screens/VendorsScreen').then(module => ({ default: module.VendorsScreen })));
const VendorProfileScreen = React.lazy(() => import('./screens/VendorProfileScreen').then(module => ({ default: module.VendorProfileScreen })));
const ProductsScreen = React.lazy(() => import('./screens/ProductsScreen').then(module => ({ default: module.ProductsScreen })));
const ChatScreen = React.lazy(() => import('./screens/ChatScreen').then(module => ({ default: module.ChatScreen })));
const SupportScreen = React.lazy(() => import('./screens/SupportScreen').then(module => ({ default: module.SupportScreen })));
const BlogScreen = React.lazy(() => import('./screens/BlogScreen').then(module => ({ default: module.BlogScreen })));
const FAQScreen = React.lazy(() => import('./screens/FAQScreen').then(module => ({ default: module.FAQScreen })));
const AboutScreen = React.lazy(() => import('./screens/AboutScreen').then(module => ({ default: module.AboutScreen })));
const TermsScreen = React.lazy(() => import('./screens/TermsScreen').then(module => ({ default: module.TermsScreen })));
const PrivacyScreen = React.lazy(() => import('./screens/PrivacyScreen').then(module => ({ default: module.PrivacyScreen })));
const ContactScreen = React.lazy(() => import('./screens/ContactScreen').then(module => ({ default: module.ContactScreen })));

// Vendor screens
const AdsManagementScreen = React.lazy(() => import('./screens/vendor').then(module => ({ default: module.AdsManagementScreen })));
const VendorDashboardScreen = React.lazy(() => import('./screens/vendor').then(module => ({ default: module.VendorDashboardScreen })));
const OrdersManagementScreen = React.lazy(() => import('./screens/vendor').then(module => ({ default: module.OrdersManagementScreen })));
const VendorProfileSettingsScreen = React.lazy(() => import('./screens/vendor').then(module => ({ default: module.VendorProfileSettingsScreen })));
const ProductsManagementScreen = React.lazy(() => import('./screens/vendor').then(module => ({ default: module.ProductsManagementScreen })));
const CreateProductScreen = React.lazy(() => import('./screens/vendor').then(module => ({ default: module.CreateProductScreen })));
const VendorAccountScreen = React.lazy(() => import('./screens/vendor').then(module => ({ default: module.VendorAccountScreen })));
const AnalyticsScreen = React.lazy(() => import('./screens/vendor').then(module => ({ default: module.AnalyticsScreen })));
const CustomersScreen = React.lazy(() => import('./screens/vendor').then(module => ({ default: module.CustomersScreen })));
const MessagesScreen = React.lazy(() => import('./screens/vendor').then(module => ({ default: module.MessagesScreen })));
const WalletScreen = React.lazy(() => import('./screens/vendor').then(module => ({ default: module.WalletScreen })));
const ReferralsScreen = React.lazy(() => import('./screens/vendor').then(module => ({ default: module.ReferralsScreen })));
const VendorOnboardingScreen = React.lazy(() => import('./screens/vendor').then(module => ({ default: module.VendorOnboardingScreen })));
const DeliveryManagementScreen = React.lazy(() => import('./screens/vendor/DeliveryManagementScreen').then(module => ({ default: module.DeliveryManagementScreen })));
const EscrowDashboardScreen = React.lazy(() => import('./screens/vendor/EscrowDashboardScreen').then(module => ({ default: module.EscrowDashboardScreen })));

const CheckoutScreen = React.lazy(() => import('./screens/CheckoutScreen').then(module => ({ default: module.CheckoutScreen })));
const OrderTrackingScreen = React.lazy(() => import('./screens/OrderTrackingScreen').then(module => ({ default: module.OrderTrackingScreen })));
const ProfileScreen = React.lazy(() => import('./screens/ProfileScreen').then(module => ({ default: module.ProfileScreen })));
const OrdersScreen = React.lazy(() => import('./screens/OrdersScreen').then(module => ({ default: module.OrdersScreen })));
const NotificationsScreen = React.lazy(() => import('./screens/NotificationsScreen').then(module => ({ default: module.NotificationsScreen })));
const MarketerRegistrationScreen = React.lazy(() => import('./screens/MarketerRegistrationScreen').then(module => ({ default: module.MarketerRegistrationScreen })));
const NotFoundScreen = React.lazy(() => import('./screens/NotFoundScreen').then(module => ({ default: module.NotFoundScreen })));

// Marketer screens
const MarketerDashboardScreen = React.lazy(() => import('./screens/marketer').then(module => ({ default: module.MarketerDashboardScreen })));
const MarketerReferralsScreen = React.lazy(() => import('./screens/marketer').then(module => ({ default: module.MarketerReferralsScreen })));
const MarketerEarningsScreen = React.lazy(() => import('./screens/marketer').then(module => ({ default: module.MarketerEarningsScreen })));
const MarketerSettingsScreen = React.lazy(() => import('./screens/marketer').then(module => ({ default: module.MarketerSettingsScreen })));

// Marketer layout
const MarketerLayout = React.lazy(() => import('./layouts/MarketerLayout').then(module => ({ default: module.MarketerLayout })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-neutral-50">
    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
  </div>
);

const App: React.FC = () => {
  // Validate configuration at startup (non-blocking)
  React.useEffect(() => {
    const result = configValidator.validate();
    if (!result.isValid) {
      logger.warn('Configuration validation warnings', {
        missingVars: result.missingVars,
        errors: result.errors,
      });
    }

    // Auto-create demo accounts logic removed for Firebase migration
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/signin" element={<LoginScreen />} />
                <Route path="/signup" element={<SignupScreen />} />
                <Route path="/marketer/register" element={<MarketerRegistrationScreen />} />

                <Route
                  path="/"
                  element={
                    <MainLayout>
                      <FrameScreen />
                    </MainLayout>
                  }
                />

                <Route
                  path="/categories"
                  element={
                    <MainLayout>
                      <CategoriesScreen />
                    </MainLayout>
                  }
                />

                <Route
                  path="/products"
                  element={
                    <MainLayout>
                      <ProductsScreen />
                    </MainLayout>
                  }
                />

                <Route
                  path="/vendors"
                  element={
                    <MainLayout>
                      <VendorsScreen />
                    </MainLayout>
                  }
                />

                <Route
                  path="/vendor/:id"
                  element={
                    <MainLayout>
                      <VendorProfileScreen />
                    </MainLayout>
                  }
                />

                <Route
                  path="/search"
                  element={
                    <MainLayout>
                      <ProductSearchScreen />
                    </MainLayout>
                  }
                />

                <Route
                  path="/product/:id"
                  element={
                    <MainLayout>
                      <ProductDetailScreen />
                    </MainLayout>
                  }
                />

                <Route
                  path="/cart"
                  element={
                    <MainLayout>
                      <CartScreen />
                    </MainLayout>
                  }
                />

                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <CheckoutScreen />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/orders/:orderId"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <OrderTrackingScreen />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <ChatScreen />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat/:vendorId"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <ChatScreen />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/support"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <SupportScreen />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <ProfileScreen />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <OrdersScreen />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <NotificationsScreen />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/onboarding"
                  element={
                    <ProtectedRoute>
                      <VendorOnboardingScreen />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/dashboard"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <VendorDashboardScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/ads"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <AdsManagementScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/products"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <ProductsManagementScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/products/create"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <CreateProductScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vendor/products/:id/edit"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <CreateProductScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/orders"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <OrdersManagementScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/deliveries"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <DeliveryManagementScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/escrow"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <EscrowDashboardScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/account"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <VendorAccountScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/settings"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <VendorProfileSettingsScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/analytics"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <AnalyticsScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/customers"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <CustomersScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/messages"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <MessagesScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/wallet"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <WalletScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendor/referrals"
                  element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <ReferralsScreen />
                      </VendorLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/blog"
                  element={
                    <MainLayout>
                      <BlogScreen />
                    </MainLayout>
                  }
                />

                <Route
                  path="/faq"
                  element={
                    <MainLayout>
                      <FAQScreen />
                    </MainLayout>
                  }
                />

                <Route
                  path="/about"
                  element={
                    <MainLayout>
                      <AboutScreen />
                    </MainLayout>
                  }
                />

                <Route
                  path="/terms"
                  element={
                    <MainLayout>
                      <TermsScreen />
                    </MainLayout>
                  }
                />

                <Route
                  path="/privacy"
                  element={
                    <MainLayout>
                      <PrivacyScreen />
                    </MainLayout>
                  }
                />

                <Route
                  path="/contact"
                  element={
                    <MainLayout>
                      <ContactScreen />
                    </MainLayout>
                  }
                />

                <Route
                  path="/admin"
                  element={<AdminLayout />}
                >
                  <Route index element={<AdminDashboardScreen />} />
                  <Route path="users" element={<AdminUsersScreen />} />
                  <Route path="listings" element={<AdminListingsScreen />} />
                  <Route path="transactions" element={<AdminTransactionsScreen />} />
                  <Route path="disputes" element={<AdminDisputesScreen />} />
                  <Route path="escrow" element={<AdminEscrowScreen />} />
                  <Route path="support" element={<AdminSupportScreen />} />
                  <Route path="kyc" element={<AdminKYCApprovalsScreen />} />
                  <Route path="settings" element={<AdminSettingsScreen />} />
                  <Route path="settings/:section" element={<AdminSettingsDetailScreen />} />
                  <Route path="marketers" element={<AdminMarketersScreen />} />
                  <Route path="commissions" element={<AdminCommissionsScreen />} />
                </Route>

                {/* Marketer Routes */}
                <Route
                  path="/marketer/dashboard"
                  element={
                    <ProtectedRoute>
                      <MarketerLayout>
                        <MarketerDashboardScreen />
                      </MarketerLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/marketer/referrals"
                  element={
                    <ProtectedRoute>
                      <MarketerLayout>
                        <MarketerReferralsScreen />
                      </MarketerLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/marketer/earnings"
                  element={
                    <ProtectedRoute>
                      <MarketerLayout>
                        <MarketerEarningsScreen />
                      </MarketerLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/marketer/settings"
                  element={
                    <ProtectedRoute>
                      <MarketerLayout>
                        <MarketerSettingsScreen />
                      </MarketerLayout>
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFoundScreen />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
