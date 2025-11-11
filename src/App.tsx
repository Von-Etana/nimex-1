import React from 'react';
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
import { AdminDashboardScreen, AdminUsersScreen, AdminListingsScreen, AdminTransactionsScreen, AdminKYCApprovalsScreen, AdminSettingsScreen, AdminMarketersScreen, AdminCommissionsScreen } from './screens/admin';
import { ProductSearchScreen } from './screens/ProductSearchScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { CartScreen } from './screens/CartScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { VendorsScreen } from './screens/VendorsScreen';
import { VendorProfileScreen } from './screens/VendorProfileScreen';
import { ProductsScreen } from './screens/ProductsScreen';
import { ChatScreen } from './screens/ChatScreen';
import { BlogScreen } from './screens/BlogScreen';
import { FAQScreen } from './screens/FAQScreen';
import { AboutScreen } from './screens/AboutScreen';
import { TermsScreen } from './screens/TermsScreen';
import { PrivacyScreen } from './screens/PrivacyScreen';
import { ContactScreen } from './screens/ContactScreen';
import { AdsManagementScreen, VendorDashboardScreen, OrdersManagementScreen, VendorProfileSettingsScreen, ProductsManagementScreen, CreateProductScreen, VendorAccountScreen, AnalyticsScreen, CustomersScreen, MessagesScreen, WalletScreen, ReferralsScreen, VendorOnboardingScreen } from './screens/vendor';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { OrderTrackingScreen } from './screens/OrderTrackingScreen';
import { DeliveryManagementScreen } from './screens/vendor/DeliveryManagementScreen';
import { EscrowDashboardScreen } from './screens/vendor/EscrowDashboardScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { MarketerRegistrationScreen } from './screens/MarketerRegistrationScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { configValidator } from './services/configValidator';

const App: React.FC = () => {
  // Validate configuration at startup (non-blocking)
  React.useEffect(() => {
    const result = configValidator.validate();
    if (!result.isValid) {
      console.warn('Configuration validation warnings:', {
        missingVars: result.missingVars,
        errors: result.errors,
      });
    }

    // Auto-create demo accounts if they don't exist
    const createDemoAccounts = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.warn('Supabase configuration missing, skipping demo account creation');
          return;
        }

        // Check if demo accounts already exist
        const response = await fetch(`${supabaseUrl}/functions/v1/create-demo-accounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Demo accounts setup:', result);
        } else {
          console.warn('Failed to create demo accounts:', response.statusText);
        }
      } catch (error) {
        console.warn('Error creating demo accounts:', error);
      }
    };

    // Only create demo accounts in development
    if (import.meta.env.DEV) {
      createDemoAccounts();
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
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
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<AdminDashboardScreen />} />
            <Route
              path="users"
              element={
                <ProtectedAdminRoute requiredPermission="users.view">
                  <AdminUsersScreen />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="listings"
              element={
                <ProtectedAdminRoute requiredPermission="products.view">
                  <AdminListingsScreen />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="transactions"
              element={
                <ProtectedAdminRoute requiredPermission="transactions.view">
                  <AdminTransactionsScreen />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="kyc"
              element={
                <ProtectedAdminRoute requiredPermission="kyc.view">
                  <AdminKYCApprovalsScreen />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedAdminRoute requiredPermission="settings.view">
                  <AdminSettingsScreen />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="marketers"
              element={
                <ProtectedAdminRoute>
                  <AdminMarketersScreen />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="commissions"
              element={
                <ProtectedAdminRoute>
                  <AdminCommissionsScreen />
                </ProtectedAdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundScreen />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
