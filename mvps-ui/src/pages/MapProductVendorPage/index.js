import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchData, postJson } from '../../apiClient';
import PageHeader from '../../components/PageHeader';
import './MapProductVendorPage.css';

const SearchableSelect = ({ label, name, options, value, onChange, placeholder, required }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedOption = options.find((o) => String(o.id) === String(value));

  const filtered = search
    ? options.filter((o) => o.name?.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleClickOutside = useCallback((e) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleSelect = (id) => {
    onChange({ target: { name, value: String(id), type: 'select' } });
    setSearch('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange({ target: { name, value: '', type: 'select' } });
    setSearch('');
  };

  return (
    <label>
      {label}
      <div className="searchable-select" ref={wrapperRef}>
        {/* Hidden input for form validation */}
        {required && (
          <input
            tabIndex={-1}
            autoComplete="off"
            className="searchable-select-hidden"
            value={value}
            onChange={() => {}}
            required
          />
        )}
        <div className="searchable-select-control input" onClick={() => setOpen(!open)}>
          {selectedOption ? (
            <span className="searchable-select-value">
              {selectedOption.name}
              <button
                type="button"
                className="searchable-select-clear"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                title="Clear"
              >
                &times;
              </button>
            </span>
          ) : (
            <span className="searchable-select-placeholder">{placeholder}</span>
          )}
          <span className="searchable-select-arrow">{open ? '\u25B2' : '\u25BC'}</span>
        </div>
        {open && (
          <div className="searchable-select-dropdown">
            <input
              type="text"
              className="searchable-select-search input"
              placeholder="Type to search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            <ul className="searchable-select-options">
              {filtered.length === 0 ? (
                <li className="searchable-select-no-results">No results found</li>
              ) : (
                filtered.map((o) => (
                  <li
                    key={o.id}
                    className={`searchable-select-option${String(o.id) === String(value) ? ' selected' : ''}`}
                    onClick={() => handleSelect(o.id)}
                  >
                    {o.name}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </label>
  );
};

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
          fetchData('/products', { is_active: true, page: 1, limit: 100 }),
          fetchData('/vendors', { is_active: true, page: 1, limit: 100 }),
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
      costPrice: parseFloat(formValues.vendorPrice),
      vendorSku: formValues.vendorSku || undefined,
      stockQuantity: parseInt(formValues.stock, 10),
      minimumOrderQuantity: parseInt(formValues.minOrderQty, 10) || 1,
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
      <PageHeader title="Map Product to Vendor" subtitle="Create a new vendor-product relationship with pricing and stock information." />

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
            <SearchableSelect
              label="Product*"
              name="productId"
              options={products}
              value={formValues.productId}
              onChange={handleFieldChange}
              placeholder="Search and select a product"
              required
            />
          </div>
          <div>
            <SearchableSelect
              label="Vendor*"
              name="vendorId"
              options={vendors}
              value={formValues.vendorId}
              onChange={handleFieldChange}
              placeholder="Search and select a vendor"
              required
            />
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
