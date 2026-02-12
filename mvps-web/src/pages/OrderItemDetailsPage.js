import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchData, patchJson } from '../apiClient';
import './OrdersPage/OrdersPage.css';

const OrderItemDetailsPage = () => {
  const { orderItemId } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadItem() {
      try {
        setLoading(true);
        setError('');
        const res = await fetchData(`/order-items/${orderItemId}`);
        setItem(res.data || {});
        setFormValues(res.data || {});
      } catch (e) {
        setError('Failed to load order item.');
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [orderItemId]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await patchJson(`/order-items/${orderItemId}`, formValues);
      setEditMode(false);
      setItem(formValues);
    } catch (e) {
      setError('Failed to update order item.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!item) return <p>No order item found.</p>;

  return (
    <div className="page orders-page container">
      <h1 className="page-title">Order Item Details</h1>
      <div className="order-item-details">
        {!editMode ? (
          <>
            <p><strong>Product:</strong> {item.product_name || item.productName}</p>
            <p><strong>Vendor:</strong> {item.vendor_name || item.vendorName}</p>
            <p><strong>Quantity:</strong> {item.quantity}</p>
            <p><strong>Unit Price (₹):</strong> {item.unit_price || item.unitPrice}</p>
            <p><strong>Discount %:</strong> {item.discount_percentage || item.discountPercentage}</p>
            <p><strong>Tax %:</strong> {item.tax_percentage || item.taxPercentage}</p>
            <p><strong>Line Total (₹):</strong> {item.line_total || item.lineTotal}</p>
            <button className="btn-primary" onClick={() => setEditMode(true)}>Edit</button>
          </>
        ) : (
          <form onSubmit={handleSave} className="order-form-inner">
            <div className="order-form-grid">
              <label>Quantity
                <input name="quantity" type="number" className="input" value={formValues.quantity || ''} onChange={handleFieldChange} />
              </label>
              <label>Unit Price (₹)
                <input name="unit_price" type="number" step="0.01" className="input" value={formValues.unit_price || ''} onChange={handleFieldChange} />
              </label>
              <label>Discount %
                <input name="discount_percentage" type="number" step="0.01" className="input" value={formValues.discount_percentage || ''} onChange={handleFieldChange} />
              </label>
              <label>Tax %
                <input name="tax_percentage" type="number" step="0.01" className="input" value={formValues.tax_percentage || ''} onChange={handleFieldChange} />
              </label>
            </div>
            <div className="order-form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" className="btn-secondary" onClick={() => setEditMode(false)} disabled={saving}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrderItemDetailsPage;
