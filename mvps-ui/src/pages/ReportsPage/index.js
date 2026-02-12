import React, { useEffect, useState } from 'react';
import { fetchData } from '../../apiClient';
import './ReportsPage.css';

const ReportsPage = () => {
  const [dailySales, setDailySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [vendorPerformance, setVendorPerformance] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [expiryDays, setExpiryDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        setError('');

        const today = new Date();
        const toDate = today.toISOString().slice(0, 10);
        const fromDateObj = new Date(today);
        fromDateObj.setDate(today.getDate() - 30);
        const fromDate = fromDateObj.toISOString().slice(0, 10);

        const [salesResult, topProductsResult, vendorRevenueResult, topCustomersResult, expiringProductsResult] = await Promise.allSettled([
          fetchData('/analytics/sales-summary', {
            from_date: fromDate,
            to_date: toDate,
            group_by: 'day',
          }),
          fetchData('/analytics/top-products', {
            from_date: fromDate,
            to_date: toDate,
            limit: 10,
            sort_by: 'revenue',
          }),
          fetchData('/analytics/vendor-revenue', {
            from_date: fromDate,
            to_date: toDate,
          }),
          fetchData('/analytics/top-customers', {
            from_date: fromDate,
            to_date: toDate,
            limit: 10,
          }),
          fetchData('/analytics/expiring-products', {
            days: expiryDays,
          }),
        ]);

        const salesRes =
          salesResult.status === 'fulfilled' ? salesResult.value : null;
        const topProductsRes =
          topProductsResult.status === 'fulfilled' ? topProductsResult.value : null;
        const vendorRevenueRes =
          vendorRevenueResult.status === 'fulfilled'
            ? vendorRevenueResult.value
            : null;
        const topCustomersRes =
          topCustomersResult.status === 'fulfilled' ? topCustomersResult.value : null;
        const expiringProductsRes =
          expiringProductsResult.status === 'fulfilled'
            ? expiringProductsResult.value
            : null;

        const sales = salesRes?.data || {};
        const periodData = sales.period_data || sales.periodData || [];
        const mappedDaily = periodData.map((p) => ({
          saleDate: p.period,
          orderType: 'All',
          totalOrders: p.orders ?? p.total_orders ?? p.totalOrders ?? 0,
          totalRevenue: p.revenue ?? p.total_revenue ?? p.totalRevenue ?? 0,
        }));

        const topProductsData = topProductsRes?.data || [];
        const mappedTopProducts = topProductsData.map((p) => ({
          productName: p.product_name ?? p.productName,
          timesOrdered: p.times_ordered ?? p.timesOrdered ?? 0,
          totalQuantitySold: p.units_sold ?? p.unitsSold ?? 0,
          totalRevenue: p.total_revenue ?? p.totalRevenue ?? 0,
        }));

        const vendorRevenueData = vendorRevenueRes?.data || [];
        const mappedVendors = vendorRevenueData.map((v) => ({
          vendorName: v.vendor_name ?? v.vendorName,
          ordersFulfilled: v.orders_fulfilled ?? v.ordersFulfilled ?? 0,
          totalUnitsSold: v.units_sold ?? v.unitsSold ?? 0,
          totalRevenueFromVendor:
            v.total_revenue ?? v.totalRevenue ?? v.total_revenue_from_vendor ?? 0,
        }));

        const topCustomersData = topCustomersRes?.data || [];
        const mappedTopCustomers = topCustomersData.map((c) => ({
          customerId: c.customer_id ?? c.customerId,
          customerName: c.customer_name ?? c.customerName,
          customerType: c.customer_type ?? c.customerType ?? '',
          totalOrders: c.total_orders ?? c.totalOrders ?? 0,
          totalSpent: c.total_spent ?? c.totalSpent ?? 0,
        }));

        const expiringProductsData = expiringProductsRes?.data || [];
        const mappedExpiring = expiringProductsData.map((p) => ({
          vendorProductId: p.vendor_product_id ?? p.vendorProductId,
          productName: p.product_name ?? p.productName,
          vendorName: p.vendor_name ?? p.vendorName,
          stockQuantity: p.stock_quantity ?? p.stockQuantity ?? 0,
          expiryDate: p.expiry_date ?? p.expiryDate,
          daysToExpiry: p.days_to_expiry ?? p.daysToExpiry,
        }));

        setDailySales(mappedDaily);
        setTopProducts(mappedTopProducts);
        setVendorPerformance(mappedVendors);
        setTopCustomers(mappedTopCustomers);
        setExpiringProducts(mappedExpiring);

        if (!salesRes || !topProductsRes || !vendorRevenueRes || !topCustomersRes || !expiringProductsRes) {
          setError('Some analytics data is currently unavailable.');
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to load reports.');
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [expiryDays]);

  return (
    <div className="page reports-page container">
      <h1 className="page-title">Analytics & Reports</h1>
      <p className="page-subtitle">
        Daily sales, vendor performance and top-selling products.
      </p>

      <section className="reports-section">
        <h2>Daily Sales (Last Snapshot)</h2>
        {loading && <p>Loading reports...</p>}
        {error && !loading && <p className="error-message">{error}</p>}
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Order Type</th>
                <th>Total Orders</th>
                <th>Total Revenue (₹)</th>
              </tr>
            </thead>
            <tbody>
              {dailySales.map((row, index) => (
                <tr key={index}>
                  <td>{row.saleDate}</td>
                  <td>{row.orderType}</td>
                  <td>{row.totalOrders}</td>
                  <td>
                    {row.totalRevenue != null
                      ? Number(row.totalRevenue).toFixed(2)
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="reports-section">
        <h2>Top Customers (Last 30 Days)</h2>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Type</th>
                <th>Total Orders</th>
                <th>Total Spent (₹)</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((row, index) => (
                <tr key={row.customerId ?? `customer-${index}`}>
                  <td>{row.customerName}</td>
                  <td>{row.customerType}</td>
                  <td>{row.totalOrders}</td>
                  <td>
                    {row.totalSpent != null
                      ? Number(row.totalSpent).toFixed(2)
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="reports-section">
        <h2>Top Products (Last 30 Days)</h2>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Times Ordered</th>
                <th>Quantity Sold</th>
                <th>Total Revenue (₹)</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((row, index) => (
                <tr key={index}>
                  <td>{row.productName}</td>
                  <td>{row.timesOrdered}</td>
                  <td>{row.totalQuantitySold}</td>
                  <td>
                    {row.totalRevenue != null
                      ? Number(row.totalRevenue).toFixed(2)
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="reports-section">
        <h2>Vendor Performance</h2>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Orders Fulfilled</th>
                <th>Units Sold</th>
                <th>Revenue (₹)</th>
              </tr>
            </thead>
            <tbody>
              {vendorPerformance.map((row, index) => (
                <tr key={index}>
                  <td>{row.vendorName}</td>
                  <td>{row.ordersFulfilled}</td>
                  <td>{row.totalUnitsSold}</td>
                  <td>
                    {row.totalRevenueFromVendor != null
                      ? Number(row.totalRevenueFromVendor).toFixed(2)
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="reports-section">
        <div className="reports-section__header">
          <h2>Expiring Products</h2>
          <div className="reports-section__controls">
            <label htmlFor="expiryDays" className="label-inline">
              Show expiry within
            </label>
            <select
              id="expiryDays"
              className="input"
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value) || 30)}
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Vendor</th>
                <th>Stock Qty</th>
                <th>Expiry Date</th>
                <th>Days to Expiry</th>
              </tr>
            </thead>
            <tbody>
              {expiringProducts.map((row, index) => (
                <tr key={row.vendorProductId ?? `expiring-${index}`}>
                  <td>{row.productName}</td>
                  <td>{row.vendorName}</td>
                  <td>{row.stockQuantity}</td>
                  <td>{row.expiryDate}</td>
                  <td>{row.daysToExpiry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ReportsPage;
