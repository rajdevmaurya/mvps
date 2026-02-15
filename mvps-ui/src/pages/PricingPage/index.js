import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setLists,
  setLoading,
  setError,
} from '../../store/slices/pricingSlice';
import { fetchData } from '../../apiClient';
import Pagination from '../../components/Pagination';
import './PricingPage.css';

const PricingPage = () => {
  const dispatch = useDispatch();
  const { lists: lowestPriceProducts, loading, error } = useSelector(
    (state) => state.pricing,
  );

  const [selectedProductId, setSelectedProductId] = useState('all');
  const [priceComparison, setPriceComparison] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const PAGE_SIZE = 20;

  useEffect(() => {
    async function loadPricing() {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        const [lowestResult, comparisonResult] = await Promise.allSettled([
          fetchData('/vendor-products/lowest-prices'),
          fetchData('/vendor-products/price-comparison'),
        ]);

        const lowestRes =
          lowestResult.status === 'fulfilled' ? lowestResult.value : null;
        const comparisonRes =
          comparisonResult.status === 'fulfilled' ? comparisonResult.value : null;

        const lowestData = lowestRes?.data || [];
        const comparisonData = comparisonRes?.data || [];

        const mappedLowest = lowestData.map((item) => ({
          productId: item.product_id ?? item.productId,
          productName: item.product_name ?? item.productName,
          vendorId: item.vendor_id ?? item.vendorId,
          vendorName: item.vendor_name ?? item.vendorName,
          finalPrice: item.final_price ?? item.finalPrice,
          stockQuantity: item.stock_quantity ?? item.stockQuantity,
        }));

        const mappedComparison = comparisonData.map((item) => ({
          productId: item.product_id ?? item.productId,
          productName: item.product_name ?? item.productName,
          vendorId: item.vendor_id ?? item.vendorId,
          vendorName: item.vendor_name ?? item.vendorName,
          costPrice: item.cost_price ?? item.costPrice,
          discountPercentage:
            item.discount_percentage ?? item.discountPercentage,
          finalPrice: item.final_price ?? item.finalPrice,
          stockQuantity: item.stock_quantity ?? item.stockQuantity,
          priceStatus: item.price_status ?? item.priceStatus,
        }));

        dispatch(setLists(mappedLowest));
        setPriceComparison(mappedComparison);

        const itemsCount = mappedLowest.length;
        const pagesCount = itemsCount > 0 ? Math.ceil(itemsCount / PAGE_SIZE) : 1;
        setTotalItems(itemsCount);
        setTotalPages(pagesCount);
        setPage(1);

        if (!lowestRes || !comparisonRes) {
          dispatch(setError('Some pricing data is currently unavailable.'));
        }
      } catch (e) {
        console.error(e);
        dispatch(setError('Failed to load pricing information.'));
      } finally {
        dispatch(setLoading(false));
      }
    }

    loadPricing();
  }, [dispatch]);

  const productOptions = useMemo(() => {
    const map = new Map();
    priceComparison.forEach((row) => {
      if (!map.has(row.productId)) {
        map.set(row.productId, row.productName);
      }
    });
    return Array.from(map.entries());
  }, [priceComparison]);

  const comparisonRows = useMemo(() => {
    if (selectedProductId === 'all') return priceComparison;
    const id = Number(selectedProductId);
    return priceComparison.filter((row) => row.productId === id);
  }, [selectedProductId, priceComparison]);

  const pagedLowestPriceProducts = useMemo(() => {
    if (totalItems === 0) return [];
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return lowestPriceProducts.slice(start, end);
  }, [lowestPriceProducts, page, totalItems]);

  return (
    <div className="page pricing-page container">
      <h1 className="page-title">Pricing & Lowest Vendor</h1>
      <p className="page-subtitle">
        Review lowest-price vendors and compare prices across suppliers.
      </p>

      <section className="pricing-section">
        <h2>Lowest Price per Product</h2>
        {loading && <p>Loading pricing...</p>}
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
              {pagedLowestPriceProducts.map((row) => (
                <tr key={row.productId}>
                  <td>{row.productName}</td>
                  <td>{row.vendorName}</td>
                  <td>
                    {row.finalPrice != null ? row.finalPrice.toFixed(2) : '-'}
                  </td>
                  <td>{row.stockQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          entityLabel="products"
          onPageChange={setPage}
        />
      </section>

      <section className="pricing-section">
        <h2>Compare Vendor Prices for a Product</h2>
        <div className="toolbar">
          <select
            className="input"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="all">All products</option>
            {productOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Vendor</th>
                <th>Cost Price (₹)</th>
                <th>Discount %</th>
                <th>Final Price (₹)</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, index) => (
                <tr key={`${row.vendorId ?? 'v'}-${row.productId ?? 'p'}-${index}`}>
                  <td>{row.productName}</td>
                  <td>{row.vendorName}</td>
                  <td>
                    {row.costPrice != null
                      ? row.costPrice.toFixed(2)
                      : '-'}
                  </td>
                  <td>
                    {row.discountPercentage != null
                      ? row.discountPercentage.toFixed(1)
                      : '-'}
                  </td>
                  <td>
                    {row.finalPrice != null
                      ? row.finalPrice.toFixed(2)
                      : '-'}
                  </td>
                  <td>{row.stockQuantity}</td>
                  <td>{row.priceStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
