import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchData, postJson } from '../../apiClient';
import './MapProductVendorPage.css';

const MapProductVendorPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [formValues, setFormValues] = useState({
    productId: '',
    vendorId: '',
    vendorPrice: '',
    vendorSku: '',
    stock: '',
    minOrderQty: '1',
    isAvailable: true,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const [productsRes, vendorsRes] = await Promise.all([
          fetchData('/products', { is_active: true, page: 1, limit: 1000 }),
          fetchData('/vendors', { is_active: true, page: 1, limit: 1000 }),
        ]);

        const productsList = (productsRes?.data || []).map((p) => ({
          id: p.productId ?? p.product_id,
          name: p.productName ?? p.product_name,
        }));

        const vendorsList = (vendorsRes?.data || []).map((v) => ({
          id: v.vendorId ?? v.vendor_id,
          name: v.vendorName ?? v.vendor_name,
        }));

        setProducts(productsList);
        setVendors(vendorsList);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to load products or vendors.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      productId: parseInt(formValues.productId, 10),
      vendorId: parseInt(formValues.vendorId, 10),
      vendorPrice: parseFloat(formValues.vendorPrice),
      vendorSku: formValues.vendorSku || undefined,
      stock: parseInt(formValues.stock, 10),
      minOrderQty: parseInt(formValues.minOrderQty, 10) || 1,
      isAvailable: formValues.isAvailable,
    };

    try {
      await postJson('/vendor-products', payload);
      navigate('/vendors');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to create vendor product mapping.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/vendors');
  };

  return (
    <div className="page map-product-vendor-page container">
      <h1 className="page-title">Map Product to Vendor</h1>
      <p className="page-subtitle">
        Create a new vendor-product relationship with pricing and stock information.
      </p>

      <button
        type="button"
        className="btn-secondary"
        onClick={handleCancel}
        style={{ marginBottom: '1rem' }}
      >
        Back to Vendors
      </button>

      {loading && <p>Loading data...</p>}
      {error && !loading && <p className="error-message">{error}</p>}

      <form className="mapping-form card" onSubmit={handleSubmit}>
        <h2>New Vendor Product Mapping</h2>
        <div className="form-grid">
          <div>
            <label>
              Product*
              <select
                name="productId"
                className="input"
                value={formValues.productId}
                onChange={handleFieldChange}
                required
              >
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label>
              Vendor*
              <select
                name="vendorId"
                className="input"
                value={formValues.vendorId}
                onChange={handleFieldChange}
                required
              >
                <option value="">Select a vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label>
              Vendor Price (₹)*
              <input
                name="vendorPrice"
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={formValues.vendorPrice}
                onChange={handleFieldChange}
                required
                placeholder="0.00"
              />
            </label>
          </div>
          <div>
            <label>
              Vendor SKU
              <input
                name="vendorSku"
                className="input"
                value={formValues.vendorSku}
                onChange={handleFieldChange}
                placeholder="Vendor's product code"
              />
            </label>
          </div>
          <div>
            <label>
              Initial Stock*
              <input
                name="stock"
                type="number"
                min="0"
                className="input"
                value={formValues.stock}
                onChange={handleFieldChange}
                required
                placeholder="0"
              />
            </label>
          </div>
          <div>
            <label>
              Min Order Quantity*
              <input
                name="minOrderQty"
                type="number"
                min="1"
                className="input"
                value={formValues.minOrderQty}
                onChange={handleFieldChange}
                required
                placeholder="1"
              />
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                name="isAvailable"
                checked={formValues.isAvailable}
                onChange={handleFieldChange}
              />{' '}
              Available for ordering
            </label>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving || loading}>
            {saving ? 'Creating…' : 'Create Mapping'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default MapProductVendorPage;
