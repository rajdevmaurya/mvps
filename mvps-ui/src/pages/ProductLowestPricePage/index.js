import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchData } from '../../apiClient';
import './ProductLowestPricePage.css';

const ProductLowestPricePage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [productName, setProductName] = useState('');
  const [lowestPriceData, setLowestPriceData] = useState(null);
  const [allVendorPrices, setAllVendorPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const [productRes, lowestPriceRes, priceComparisonRes] = await Promise.all([
          fetchData(`/products/${productId}`),
          fetchData('/vendor-products/lowest-prices', { product_id: productId }),
          fetchData('/vendor-products/price-comparison', { product_id: productId }),
        ]);

        const product = productRes.data || {};
        setProductName(product.productName ?? product.product_name ?? 'Unknown Product');

        const lowestPrices = lowestPriceRes.data || [];
        if (lowestPrices.length > 0) {
          setLowestPriceData(lowestPrices[0]);
        }

        const priceComparison = priceComparisonRes.data || [];
        const mapped = priceComparison.map((vp) => ({
          vendorName: vp.vendorName ?? vp.vendor_name,
          vendorPrice: vp.vendorPrice ?? vp.vendor_price,
          stock: vp.stock ?? 0,
          isAvailable: vp.isAvailable ?? vp.is_available ?? false,
          minOrderQty: vp.minOrderQty ?? vp.min_order_qty ?? 1,
        }));
        setAllVendorPrices(mapped);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to load price information.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId]);

  const handleCancel = () => {
    navigate(`/products/${productId}`);
  };

  return (
    <div className="page lowest-price-page container">
      <h1 className="page-title">Lowest Price for {productName}</h1>
      <p className="page-subtitle">
        View the best available price and compare across all vendors.
      </p>

      <button
        type="button"
        className="btn-secondary"
        onClick={handleCancel}
        style={{ marginBottom: '1rem' }}
      >
        Back to Product
      </button>

      {loading && <p>Loading price data...</p>}
      {error && !loading && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <>
          {lowestPriceData && (
            <div className="lowest-price-card card">
              <h2>Best Available Price</h2>
              <div className="price-highlight">
                <span className="price-label">Lowest Price:</span>
                <span className="price-value">
                  ₹{parseFloat(lowestPriceData.lowestPrice ?? lowestPriceData.lowest_price ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="vendor-info">
                <div className="info-row">
                  <strong>Vendor:</strong> {lowestPriceData.vendorName ?? lowestPriceData.vendor_name}
                </div>
                <div className="info-row">
                  <strong>Stock Available:</strong> {lowestPriceData.stock ?? 0} units
                </div>
                <div className="info-row">
                  <strong>Min Order Quantity:</strong> {lowestPriceData.minOrderQty ?? lowestPriceData.min_order_qty ?? 1} units
                </div>
              </div>
            </div>
          )}

          {!lowestPriceData && (
            <div className="empty-state">
              <p>No pricing information available for this product.</p>
            </div>
          )}

          {allVendorPrices.length > 0 && (
            <section className="price-comparison-section">
              <h2>All Vendor Prices</h2>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Price (₹)</th>
                      <th>Stock</th>
                      <th>Min Order Qty</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allVendorPrices.map((vp, index) => (
                      <tr key={vp.vendorName ? `${vp.vendorName}-${index}` : index}>
                        <td>{vp.vendorName}</td>
                        <td>{vp.vendorPrice != null ? `₹${parseFloat(vp.vendorPrice).toFixed(2)}` : '-'}</td>
                        <td>{vp.stock}</td>
                        <td>{vp.minOrderQty}</td>
                        <td>
                          <span className={`badge ${vp.isAvailable ? 'badge-success' : 'badge-muted'}`}>
                            {vp.isAvailable ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default ProductLowestPricePage;
