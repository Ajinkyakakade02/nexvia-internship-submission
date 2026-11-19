import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Store,
  Users,
  CreditCard,
  Percent,
  Settings,
  Tag,
  UserCheck,
} from 'lucide-react';

import { UserRole } from '@/types';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui/Spinner';

// Public Pages
import { HomePage } from '@/pages/public/HomePage';
import { ProductListingPage } from '@/pages/public/ProductListingPage';
import { ProductDetailPage } from '@/pages/public/ProductDetailPage';
import { NotFoundPage } from '@/pages/public/NotFoundPage';
import { UnauthorizedPage } from '@/pages/public/UnauthorizedPage';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

// Customer Pages
import { CartPage } from '@/pages/customer/CartPage';
import { CheckoutPage } from '@/pages/customer/CheckoutPage';
import { OrdersPage } from '@/pages/customer/OrdersPage';
import { OrderDetailPage } from '@/pages/customer/OrderDetailPage';
import { OrderTrackingPage } from '@/pages/customer/OrderTrackingPage';
import { ProfilePage } from '@/pages/customer/ProfilePage';

// Vendor Pages
import { VendorOnboardingPage } from '@/pages/vendor/VendorOnboardingPage';
import { VendorDashboardPage } from '@/pages/vendor/VendorDashboardPage';
import { VendorProductsPage } from '@/pages/vendor/VendorProductsPage';
import { VendorProductFormPage } from '@/pages/vendor/VendorProductFormPage';
import { VendorOrdersPage } from '@/pages/vendor/VendorOrdersPage';
import { VendorProfilePage } from '@/pages/vendor/VendorProfilePage';

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminVendorsPage } from '@/pages/admin/AdminVendorsPage';
import { AdminCustomersPage } from '@/pages/admin/AdminCustomersPage';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminCouponsPage } from '@/pages/admin/AdminCouponsPage';
import { AdminPaymentsPage } from '@/pages/admin/AdminPaymentsPage';
import { AdminCommissionsPage } from '@/pages/admin/AdminCommissionsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';

const vendorSidebarItems = [
  { name: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/vendor/products', icon: ShoppingBag },
  { name: 'Orders', href: '/vendor/orders', icon: Package },
  { name: 'Store Profile', href: '/vendor/profile', icon: Store },
];

const adminSidebarItems = [
  { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Vendors', href: '/admin/vendors', icon: Store },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Products', href: '/admin/products', icon: ShoppingBag },
  { name: 'Orders', href: '/admin/orders', icon: Package },
  { name: 'Coupons', href: '/admin/coupons', icon: Tag },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Commissions', href: '/admin/commissions', icon: Percent },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export const AppRoutes: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Spinner size="lg" label="Loading NexMart..." />
        </div>
      }
    >
      <Routes>
        {/* Public Browsing Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Customer Authenticated Routes */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CUSTOMER, UserRole.ADMIN]}>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CUSTOMER, UserRole.ADMIN]}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CUSTOMER, UserRole.ADMIN]}>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id/tracking"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CUSTOMER, UserRole.ADMIN]}>
                <OrderTrackingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CUSTOMER, UserRole.VENDOR, UserRole.ADMIN]}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Vendor Onboarding Route (accessible to registered vendors) */}
          <Route
            path="/vendor/onboarding"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VENDOR, UserRole.ADMIN]}>
                <VendorOnboardingPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Route>

        {/* Vendor Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={[UserRole.VENDOR, UserRole.ADMIN]}>
              <DashboardLayout title="Vendor Portal" items={vendorSidebarItems} />
            </ProtectedRoute>
          }
        >
          <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
          <Route path="/vendor/products" element={<VendorProductsPage />} />
          <Route path="/vendor/products/new" element={<VendorProductFormPage />} />
          <Route path="/vendor/products/:id/edit" element={<VendorProductFormPage />} />
          <Route path="/vendor/orders" element={<VendorOrdersPage />} />
          <Route path="/vendor/profile" element={<VendorProfilePage />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <DashboardLayout title="Platform Administration" items={adminSidebarItems} />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/vendors" element={<AdminVendorsPage />} />
          <Route path="/admin/customers" element={<AdminCustomersPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/coupons" element={<AdminCouponsPage />} />
          <Route path="/admin/payments" element={<AdminPaymentsPage />} />
          <Route path="/admin/commissions" element={<AdminCommissionsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

