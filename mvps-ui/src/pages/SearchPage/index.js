import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchData } from '../../apiClient';
import PageHeader from '../../components/PageHeader';
import './SearchPage.css';

const SearchPage = ({ type }) => {
  // Product search state
  const [productQuery, setProductQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [prescriptionRequired, setPrescriptionRequired] = useState('any');
  const [inStockOnly, setInStockOnly] = useState(true);
  const [productResults, setProductResults] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState('');

  // Vendor search state
  const [vendorQuery, setVendorQuery] = useState('');
  const [vendorCity, setVendorCity] = useState('');
  const [vendorState, setVendorState] = useState('');
  const [vendorIsActive, setVendorIsActive] = useState('true');
  const [vendorResults, setVendorResults] = useState([]);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState('');

  const navigate = useNavigate();

  const handleProductSearch = useCallback(
    async (event) => {
      if (event) event.preventDefault();
      try {
        setProductLoading(true);
        setProductError('');

        const params = {};
        if (productQuery.trim()) {
          params.q = productQuery.trim();
        }
        if (minPrice !== '') {
          const value = Number(minPrice);
          if (!Number.isNaN(value)) {
            params.min_price = value;
          }
        }
        if (maxPrice !== '') {
          const value = Number(maxPrice);
          if (!Number.isNaN(value)) {
            params.max_price = value;
          }
        }
        if (prescriptionRequired !== 'any') {
          params.prescription_required = prescriptionRequired === 'true';
        }
        if (inStockOnly) {
          params.in_stock = true;
        }

        const res = await fetchData('/search/products', params);
        const data = res?.data || [];
        const mapped = data.map((item) => ({
          productId: item.product_id ?? item.productId,
          productName: item.product_name ?? item.productName,
          genericName: item.generic_name ?? item.genericName ?? '',
          vendorProductId: item.vendor_product_id ?? item.vendorProductId,
          vendorId: item.vendor_id ?? item.vendorId,
          vendorName: item.vendor_name ?? item.vendorName,
          finalPrice: item.final_price ?? item.finalPrice,
          stockQuantity: item.stock_quantity ?? item.stockQuantity,
        }));
        setProductResults(mapped);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setProductError('Failed to search products.');
      } finally {
        setProductLoading(false);
      }
    },
    [productQuery, minPrice, maxPrice, prescriptionRequired, inStockOnly],
  );

  const handleVendorSearch = useCallback(
    async (event) => {
      if (event) event.preventDefault();
      try {
        setVendorLoading(true);
        setVendorError('');

        const params = {};
        if (vendorQuery.trim()) {
          params.q = vendorQuery.trim();
        }
        if (vendorCity.trim()) {
          params.city = vendorCity.trim();
        }
        if (vendorState.trim()) {
          params.state = vendorState.trim();
        }
        if (vendorIsActive !== 'any') {
          params.is_active = vendorIsActive === 'true';
        }

        const res = await fetchData('/search/vendors', params);
        const data = res?.data || [];
        const mapped = data
          .map((v) => {
            const id = v.vendor_id ?? v.vendorId;
            if (id == null) return null;
            return {
              id,
              vendorName: v.vendor_name ?? v.vendorName,
              city: v.city || '',
              state: v.state || '',
              isActive:
                typeof (v.is_active ?? v.isActive) === 'boolean'
                  ? v.is_active ?? v.isActive
                  : true,
            };
          })
          .filter(Boolean);

        setVendorResults(mapped);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setVendorError('Failed to search vendors.');
      } finally {
        setVendorLoading(false);
      }
    },
    [vendorQuery, vendorCity, vendorState, vendorIsActive],
  );

  const showProducts = !type || type === 'products';
  const showVendors = !type || type === 'vendors';

  return (
    <div className="page search-page container">
      <PageHeader title="Search" subtitle="Search products and vendors by name, price, and other attributes." />
      <div className="search-grid">
        {showProducts && (
          <section className="search-panel">
            <div className="search-panel__header">
              <h2>Product search</h2>
              <p>Filter by name, price range, prescription requirement, and stock.</p>
            </div>
            <form className="search-form" onSubmit={handleProductSearch}>
              <div className="search-form-row">
                <label className="search-label" htmlFor="productQuery">
                  Search term
                </label>
                <input
                  id="productQuery"
                  type="search"
                  className="input"
                  placeholder="Product, generic name, or manufacturer"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                />
              </div>
              <div className="search-form-row search-form-row--two-column">
                <div>
                  <label className="search-label" htmlFor="minPrice">
                    Min price (₹)
                  </label>
                  <input
                    id="minPrice"
                    type="number"
                    className="input"
                    min="0"
                    step="0.01"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="search-label" htmlFor="maxPrice">
                    Max price (₹)
                  </label>
                  <input
                    id="maxPrice"
                    type="number"
                    className="input"
                    min="0"
                    step="0.01"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="search-form-row search-form-row--two-column">
                <div>
                  <label className="search-label" htmlFor="prescriptionRequired">
                    Prescription
                  </label>
                  <select
                    id="prescriptionRequired"
                    className="input"
                    value={prescriptionRequired}
                    onChange={(e) => setPrescriptionRequired(e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="true">Required</option>
                    <option value="false">Not required</option>
                  </select>
                </div>
                <div className="checkbox-inline">
                  <label htmlFor="inStockOnly">
                    <input
                      id="inStockOnly"
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                    />
                    In stock only
                  </label>
                </div>
              </div>
              <div className="search-form-actions">
                <button type="submit" className="btn-primary">
                  {productLoading ? 'Searching…' : 'Search products'}
                </button>
                {productError && !productLoading && (
                  <span className="error-message">{productError}</span>
                )}
              </div>
            </form>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Generic</th>
                    <th>Best vendor</th>
                    <th>Price (₹)</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productResults.map((row, index) => (
                    <tr key={row.vendorProductId ?? row.productId ?? `product-${index}`}>
                      <td>{row.productName}</td>
                      <td>{row.genericName}</td>
                      <td>{row.vendorName}</td>
                      <td>
                        {row.finalPrice != null
                          ? Number(row.finalPrice).toFixed(2)
                          : '-'}
                      </td>
                      <td>{row.stockQuantity}</td>
                      <td>
                        {row.productId && (
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => navigate(`/products/${row.productId}`)}
                          >
                            View product
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {showVendors && (
          <section className="search-panel">
            <form className="search-form" onSubmit={handleVendorSearch}>
              <div className="search-form-row">
                <label className="search-label" htmlFor="vendorQuery">
                  Search term
                </label>
                <input
                  id="vendorQuery"
                  type="search"
                  className="input"
                  placeholder="Vendor name or city"
                  value={vendorQuery}
                  onChange={(e) => setVendorQuery(e.target.value)}
                />
              </div>
              <div className="search-form-row search-form-row--two-column">
                <div>
                  <label className="search-label" htmlFor="vendorCity">
                    City
                  </label>
                  <input
                    id="vendorCity"
                    type="text"
                    className="input"
                    value={vendorCity}
                    onChange={(e) => setVendorCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="search-label" htmlFor="vendorState">
                    State
                  </label>
                  <input
                    id="vendorState"
                    type="text"
                    className="input"
                    value={vendorState}
                    onChange={(e) => setVendorState(e.target.value)}
                  />
                </div>
              </div>
              <div className="search-form-row">
                <label className="search-label" htmlFor="vendorIsActive">
                  Status
                </label>
                <select
                  id="vendorIsActive"
                  className="input"
                  value={vendorIsActive}
                  onChange={(e) => setVendorIsActive(e.target.value)}
                >
                  <option value="true">Active only</option>
                  <option value="false">Inactive only</option>
                  <option value="any">Any</option>
                </select>
              </div>
              <div className="search-form-actions">
                <button type="submit" className="btn-primary">
                  {vendorLoading ? 'Searching…' : 'Search vendors'}
                </button>
                {vendorError && !vendorLoading && (
                  <span className="error-message">{vendorError}</span>
                )}
              </div>
            </form>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>City</th>
                    <th>State</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorResults.map((row) => (
                    <tr key={row.id}>
                      <td>{row.vendorName}</td>
                      <td>{row.city}</td>
                      <td>{row.state}</td>
                      <td>{row.isActive ? 'Active' : 'Inactive'}</td>
                      <td>
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => navigate(`/vendors/${row.id}`)}
                        >
                          View vendor
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
