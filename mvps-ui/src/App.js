import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from './layout/Layout';
import Dashboard from './pages/Dashboard';
import VendorsPage from './pages/VendorsPage';
import VendorDetailsPage from './pages/VendorDetailsPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import VendorOrdersPage from './pages/VendorOrdersPage';
import PricingPage from './pages/PricingPage';
import InventoryPage from './pages/InventoryPage';
import OrdersPage from './pages/OrdersPage';
import OrderCreatePage from './pages/OrderCreatePage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import ReportsPage from './pages/ReportsPage';
import SearchPage from './pages/SearchPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailsPage from './pages/CustomerDetailsPage';
import StockHistoryPage from './pages/StockHistoryPage';

import OrderItemDetailsPage from './pages/OrderItemDetailsPage';
import OrderStatusPage from './pages/OrderStatusPage';
import OrderPaymentStatusPage from './pages/OrderPaymentStatusPage';

import CategoryDetailsPage from './pages/CategoryDetailsPage';
import ProductLowestPricePage from './pages/ProductLowestPricePage';
import MapProductVendorPage from './pages/MapProductVendorPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/vendors/new" element={<VendorDetailsPage />} />
        <Route path="/vendors/:vendorId" element={<VendorDetailsPage />} />
        <Route path="/vendor-orders" element={<VendorOrdersPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductDetailsPage />} />
        <Route path="/products/:productId" element={<ProductDetailsPage />} />
        <Route path="/map-product-vendor" element={<MapProductVendorPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/stock-history" element={<StockHistoryPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/new" element={<CustomerDetailsPage />} />
        <Route path="/customers/:customerId" element={<CustomerDetailsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/new" element={<OrderCreatePage />} />
        <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
        <Route path="/order-items/:orderItemId" element={<OrderItemDetailsPage />} />
        <Route path="/orders/:orderId/status" element={<OrderStatusPage />} />
        <Route path="/orders/:orderId/payment-status" element={<OrderPaymentStatusPage />} />
        <Route path="/categories/new" element={<CategoryDetailsPage />} />
        <Route path="/categories/:categoryId" element={<CategoryDetailsPage />} />
        <Route path="/products/:productId/lowest-price" element={<ProductLowestPricePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Route>
    </Routes>
  );
}

export default App;
