import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import MainLayout from './components/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Keep Dashboard and Layout for now (non-section pages)
import Layout from './layout/Layout';
import Dashboard from './pages/Dashboard';

// Lazy load sections
const ProductsSection = lazy(() => import('./sections/ProductsSection'));
const CustomersSection = lazy(() => import('./sections/CustomersSection'));
const OrdersSection = lazy(() => import('./sections/OrdersSection'));
const InventorySection = lazy(() => import('./sections/InventorySection'));
const PricingSection = lazy(() => import('./sections/PricingSection'));

// Lazy load pages
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));
const ProductLowestPricePage = lazy(() => import('./pages/ProductLowestPricePage'));
const VendorsPage = lazy(() => import('./pages/VendorsPage'));
const VendorDetailsPage = lazy(() => import('./pages/VendorDetailsPage'));
const MapProductVendorPage = lazy(() => import('./pages/MapProductVendorPage'));
const VendorOrdersPage = lazy(() => import('./pages/VendorOrdersPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const CustomerDetailsPage = lazy(() => import('./pages/CustomerDetailsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderCreatePage = lazy(() => import('./pages/OrderCreatePage'));
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage'));
const OrderItemDetailsPage = lazy(() => import('./pages/OrderItemDetailsPage'));
const OrderStatusPage = lazy(() => import('./pages/OrderStatusPage'));
const OrderPaymentStatusPage = lazy(() => import('./pages/OrderPaymentStatusPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const StockHistoryPage = lazy(() => import('./pages/StockHistoryPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const CategoryDetailsPage = lazy(() => import('./pages/CategoryDetailsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

const LoadingFallback = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
);

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Old Layout routes (Dashboard, Reports, Search, Categories) */}
          <Route element={<Layout />}>
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/categories/new" element={<CategoryDetailsPage />} />
            <Route path="/categories/:categoryId" element={<CategoryDetailsPage />} />
          </Route>

          {/* New MainLayout with Sidebar and nested sections */}
          <Route path="/" element={<MainLayout />}>
            {/* Default redirect to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Search Pages */}
            <Route path="search/products" element={<SearchPage type="products" />} />
            <Route path="search/vendors" element={<SearchPage type="vendors" />} />

            {/* Products Section */}
            <Route path="products" element={<ProductsSection />}>
              <Route index element={<Navigate to="catalog" replace />} />
              <Route path="catalog" element={<ProductsPage />} />
            </Route>
            {/* Product detail pages (outside section for clean URLs) */}
            <Route path="products/new" element={<ProductDetailsPage />} />
            <Route path="products/:productId" element={<ProductDetailsPage />} />
            <Route path="products/:productId/lowest-price" element={<ProductLowestPricePage />} />

            {/* Vendors routes (section removed) */}
            <Route path="vendors" element={<Navigate to="vendors/list" replace />} />
            <Route path="vendors/list" element={<VendorsPage />} />
            <Route path="vendors/products" element={<MapProductVendorPage />} />
            <Route path="vendors/orders" element={<VendorOrdersPage />} />
            {/* Vendor detail pages (outside section for clean URLs) */}
            <Route path="vendors/new" element={<VendorDetailsPage />} />
            <Route path="vendors/:vendorId" element={<VendorDetailsPage />} />

            {/* Customers Section */}
            <Route path="customers" element={<CustomersSection />}>
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<CustomersPage />} />
            </Route>
            {/* Customer detail pages (outside section for clean URLs) */}
            <Route path="customers/new" element={<CustomerDetailsPage />} />
            <Route path="customers/:customerId" element={<CustomerDetailsPage />} />

            {/* Orders Section */}
            <Route path="orders" element={<OrdersSection />}>
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<OrdersPage />} />
            </Route>
            {/* Order detail pages (outside section for clean URLs) */}
            <Route path="orders/new" element={<OrderCreatePage />} />
            <Route path="orders/:orderId" element={<OrderDetailsPage />} />
            <Route path="order-items/:orderItemId" element={<OrderItemDetailsPage />} />
            <Route path="orders/:orderId/status" element={<OrderStatusPage />} />
            <Route path="orders/:orderId/payment-status" element={<OrderPaymentStatusPage />} />

            {/* Inventory Section */}
            <Route path="inventory" element={<InventorySection />}>
              <Route index element={<Navigate to="stock" replace />} />
              <Route path="stock" element={<InventoryPage />} />
            </Route>
            {/* Inventory detail pages */}
            <Route path="stock-history" element={<StockHistoryPage />} />

            {/* Pricing Section */}
            <Route path="pricing" element={<PricingSection />}>
              <Route index element={<Navigate to="lists" replace />} />
              <Route path="lists" element={<PricingPage />} />
            </Route>

            {/* Analytics Page */}
            <Route path="analytics" element={<AnalyticsPage />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/products/catalog" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
