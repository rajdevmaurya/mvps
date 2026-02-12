import React, { useState, useEffect } from 'react';
import { fetchData, postJson } from '../apiClient';
import './ProductsPage/ProductsPage.css';

const MapProductVendorPage = () => {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const productsRes = await fetchData('/products', { is_active: true, limit: 100 });
        const vendorsRes = await fetchData('/vendors', { is_active: true, limit: 100 });
        setProducts(productsRes.data || []);
        setVendors(vendorsRes.data || []);
      } catch (e) {
        setMessage('Failed to load products or vendors.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!selectedProduct || !selectedVendor || !price || !stock) {
      setMessage('Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        product_id: selectedProduct,
        vendor_id: selectedVendor,
        cost_price: parseFloat(price),
        stock_quantity: parseInt(stock, 10),
        vendor_sku: sku,
      };
      const res = await postJson('/vendor-products', payload);
      if (res.success) {
        setMessage('Vendor mapping created successfully!');
        setPrice('');
        setStock('');
        setSku('');
      } else {
        setMessage('Failed to create mapping.');
      }
    } catch (e) {
      setMessage('Error creating mapping.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page container" style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h2>Map Product to Vendor</h2>
      <form className="product-form" onSubmit={handleSubmit}>
        <div className="product-form-grid">
          <label>Product</label>
          <select className="input" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} required>
            <option value="">Select product</option>
            {products.map(p => (
              <option key={p.id || p.product_id} value={p.id || p.product_id}>
                {p.product_name || p.name}
              </option>
            ))}
          </select>

          <label>Vendor</label>
          <select className="input" value={selectedVendor} onChange={e => setSelectedVendor(e.target.value)} required>
            <option value="">Select vendor</option>
            {vendors.map(v => (
              <option key={v.id || v.vendor_id} value={v.id || v.vendor_id}>
                {v.vendor_name || v.name}
              </option>
            ))}
          </select>

          <label>Cost Price (₹)</label>
          <input className="input" type="number" value={price} onChange={e => setPrice(e.target.value)} required min="0" />

          <label>Stock Quantity</label>
          <input className="input" type="number" value={stock} onChange={e => setStock(e.target.value)} required min="0" />

          <label>Vendor SKU</label>
          <input className="input" type="text" value={sku} onChange={e => setSku(e.target.value)} />
        </div>
        <div className="product-form-actions" style={{ marginTop: '1rem' }}>
          <button type="submit" className="btn-primary" disabled={loading}>Map Vendor</button>
        </div>
        {message && <p style={{ marginTop: '1rem', color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}
      </form>
    </div>
  );
};

export default MapProductVendorPage;
