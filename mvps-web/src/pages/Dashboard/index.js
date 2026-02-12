import React, { useEffect, useState } from 'react';
import { fetchData } from '../../apiClient';
import Pagination from '../../components/Pagination';
import './Dashboard.css';

const Dashboard = () => {
  const [totalVendors, setTotalVendors] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [bestDeals, setBestDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError('');

        const [
          vendorPerfResult,
          productsResult,
          inventoryResult,
          lowestPricesResult,
        ] = await Promise.allSettled([
          // Vendor performance for vendor count
          fetchData('/vendors/performance'),
          // Only need pagination for total products
          fetchData('/products', { is_active: true, page: 1, limit: 1 }),
          // Inventory status summary
          fetchData('/analytics/inventory-status'),
          // Lowest price per product
          fetchData('/vendor-products/lowest-prices'),
        ]);

        const vendorPerfRes =
          vendorPerfResult.status === 'fulfilled' ? vendorPerfResult.value : null;
        const productsRes =
          productsResult.status === 'fulfilled' ? productsResult.value : null;
        const inventoryRes =
          inventoryResult.status === 'fulfilled' ? inventoryResult.value : null;
        const lowestPricesRes =
          lowestPricesResult.status === 'fulfilled' ? lowestPricesResult.value : null;

        const vendorPerf = vendorPerfRes?.data || [];
        setTotalVendors(vendorPerf.length);

        if (productsRes) {
          const pagination = productsRes.pagination;
          if (pagination) {
            const totalItems =
              typeof pagination.total_items === 'number'
                ? pagination.total_items
                : pagination.totalItems;
            if (typeof totalItems === 'number') {
              setTotalProducts(totalItems);
            } else {
              setTotalProducts((productsRes.data || []).length);
            }
          } else {
            setTotalProducts((productsRes.data || []).length);
          }
        } else {
          setTotalProducts(0);
        }

        const inventory = inventoryRes?.data;
        if (inventory) {
          const total =
            typeof inventory.total_stock === 'number'
              ? inventory.total_stock
              : inventory.totalStock;
          if (typeof total === 'number') {
            setTotalStock(total);
          }
        } else {
          setTotalStock(0);
        }

        const lowestData = lowestPricesRes?.data || [];
        const mappedDeals = lowestData.map((item) => ({
          productId: item.product_id ?? item.productId,
          productName: item.product_name ?? item.productName,
          vendorId: item.vendor_id ?? item.vendorId,
          vendorName: item.vendor_name ?? item.vendorName,
          finalPrice: item.final_price ?? item.finalPrice,
          stockQuantity: item.stock_quantity ?? item.stockQuantity,
        }));
        setBestDeals(mappedDeals);

        if (!vendorPerfRes || !productsRes || !inventoryRes || !lowestPricesRes) {
          setError('Some dashboard figures are currently unavailable.');
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const totalDeals = bestDeals.length;
  const totalPages = totalDeals > 0 ? Math.ceil(totalDeals / PAGE_SIZE) : 1;
  const safePage = Math.min(page, totalPages || 1);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const currentDeals = bestDeals.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="page dashboard-page container">
      <h1 className="page-title">MVPS Overview</h1>
      <p className="page-subtitle">
        Multi-Vendor Product Management for Echo Healthcare
      </p>

      <section className="dashboard-cards">
        <div className="card">
          <h2>Vendors</h2>
          <p className="card-number">{totalVendors}</p>
          <p className="card-caption">Active suppliers in the network</p>
        </div>
        <div className="card">
          <h2>Products</h2>
          <p className="card-number">{totalProducts}</p>
          <p className="card-caption">Items in the master catalog</p>
        </div>
        <div className="card">
          <h2>Total Stock</h2>
          <p className="card-number">{totalStock}</p>
          <p className="card-caption">Units available across vendors</p>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Best Deals (Lowest Price per Product)</h2>
        {loading && <p>Loading data...</p>}
        {error && !loading && <p className="error-message">{error}</p>}
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Vendor</th>
                <th>Final Price (₹)</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {currentDeals.map((row) => (
                <tr key={row.productId}>
                  <td>{row.productName}</td>
                  <td>{row.vendorName}</td>
                  <td>{row.finalPrice != null ? row.finalPrice.toFixed(2) : '-'}</td>
                  <td>{row.stockQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={safePage}
          totalPages={totalPages}
          totalItems={totalDeals}
          pageSize={PAGE_SIZE}
          entityLabel="deals"
          onPageChange={setPage}
        />
      </section>
    </div>
  );
};

export default Dashboard;
