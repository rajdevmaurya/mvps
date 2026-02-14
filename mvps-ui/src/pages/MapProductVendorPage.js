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
  const [mrp, setMrp] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [sku, setSku] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const productsRes = await fetchData('/products', { is_active: true, limit: 100 });
        const vendorsRes = await fetchData('/vendors', { is_active: true, limit: 100 });

        const productsData = productsRes?.data || [];
        const vendorsData = vendorsRes?.data || [];

        const normalizedProducts = productsData
          .filter(Boolean)
          .map((p) => ({
            id: p.product_id ?? p.productId ?? p.id,
            name: p.product_name ?? p.productName ?? p.name ?? '',
          }))
          .filter((p) => p.id != null);

        const normalizedVendors = vendorsData
          .filter(Boolean)
          .map((v) => ({
            id: v.vendor_id ?? v.vendorId ?? v.id,
            name: v.vendor_name ?? v.vendorName ?? v.name ?? '',
          }))
          .filter((v) => v.id != null);

        setProducts(normalizedProducts);
        setVendors(normalizedVendors);
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
        productId: Number(selectedProduct),
        vendorId: Number(selectedVendor),
        costPrice: parseFloat(price),
        mrp: mrp ? parseFloat(mrp) : undefined,
        discountPercentage: discountPercentage ? parseFloat(discountPercentage) : undefined,
        stockQuantity: parseInt(stock, 10),
        vendorSku: sku || undefined,
      };
      const res = await postJson('/vendor-products', payload);
      if (res.success) {
        setMessage('Vendor mapping created successfully!');
        setPrice('');
        setMrp('');
        setDiscountPercentage('');
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
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <label>Vendor</label>
          <select className="input" value={selectedVendor} onChange={e => setSelectedVendor(e.target.value)} required>
            <option value="">Select vendor</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <label>Cost Price (₹)</label>
          <input className="input" type="number" value={price} onChange={e => setPrice(e.target.value)} required min="0" step="0.01" />

          <label>MRP (₹)</label>
          <input className="input" type="number" value={mrp} onChange={e => setMrp(e.target.value)} min="0" step="0.01" />

          <label>Discount Percentage (%)</label>
          <input className="input" type="number" value={discountPercentage} onChange={e => setDiscountPercentage(e.target.value)} min="0" max="100" step="0.01" />

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
