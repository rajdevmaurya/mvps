import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchData, putJson, deleteJson } from '../../apiClient';
import './OrderItemDetailsPage.css';

const OrderItemDetailsPage = () => {
  const { orderItemId } = useParams();
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    quantity: '',
    price: '',
    discount: '',
    totalAmount: '',
  });
  const [productName, setProductName] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrderItem = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetchData(`/order-items/${orderItemId}`);
        const item = res.data || {};

        setFormValues({
          quantity: (item.quantity ?? 0).toString(),
          price: (item.price ?? 0).toString(),
          discount: (item.discount ?? 0).toString(),
          totalAmount: (item.totalAmount ?? item.total_amount ?? 0).toString(),
        });

        setProductName(item.productName ?? item.product_name ?? 'Unknown Product');
        setOrderId(item.orderId ?? item.order_id);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to load order item.');
      } finally {
        setLoading(false);
      }
    };

    loadOrderItem();
  }, [orderItemId]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // Auto-calculate total amount
      if (name === 'quantity' || name === 'price' || name === 'discount') {
        const qty = parseFloat(updated.quantity) || 0;
        const price = parseFloat(updated.price) || 0;
        const discount = parseFloat(updated.discount) || 0;
        updated.totalAmount = (qty * price - discount).toFixed(2);
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      quantity: parseInt(formValues.quantity, 10),
      price: parseFloat(formValues.price),
      discount: parseFloat(formValues.discount) || 0,
      totalAmount: parseFloat(formValues.totalAmount),
    };

    try {
      await putJson(`/order-items/${orderItemId}`, payload);
      if (orderId) {
        navigate(`/orders/${orderId}`);
      } else {
        navigate('/orders');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to update order item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      'Are you sure you want to delete this order item?',
    );
    if (!confirmed) return;

    setSaving(true);
    setError('');
    try {
      await deleteJson(`/order-items/${orderItemId}`);
      if (orderId) {
        navigate(`/orders/${orderId}`);
      } else {
        navigate('/orders');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to delete order item.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (orderId) {
      navigate(`/orders/${orderId}`);
    } else {
      navigate('/orders');
    }
  };

  return (
    <div className="page order-item-details-page container">
      <h1 className="page-title">Edit Order Item</h1>
      <p className="page-subtitle">
        Update quantity, price, or discount for this order line item.
      </p>

      <button
        type="button"
        className="btn-secondary"
        onClick={handleCancel}
        style={{ marginBottom: '1rem' }}
      >
        Back to Order
      </button>

      {loading && <p>Loading order item...</p>}
      {error && !loading && <p className="error-message">{error}</p>}

      {!loading && (
        <form className="order-item-form card" onSubmit={handleSubmit}>
          <h2>Order Item Details</h2>
          <div className="product-info">
            <strong>Product:</strong> {productName}
          </div>
          <div className="form-grid">
            <div>
              <label>
                Quantity*
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  className="input"
                  value={formValues.quantity}
                  onChange={handleFieldChange}
                  required
                />
              </label>
            </div>
            <div>
              <label>
                Price per Unit (₹)*
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={formValues.price}
                  onChange={handleFieldChange}
                  required
                />
              </label>
            </div>
            <div>
              <label>
                Discount (₹)
                <input
                  name="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={formValues.discount}
                  onChange={handleFieldChange}
                />
              </label>
            </div>
            <div>
              <label>
                Total Amount (₹)
                <input
                  name="totalAmount"
                  type="number"
                  step="0.01"
                  className="input"
                  value={formValues.totalAmount}
                  readOnly
                  style={{ backgroundColor: 'var(--neutral-100)' }}
                />
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Update Item'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDelete}
              disabled={saving}
              style={{ backgroundColor: '#dc2626', color: 'white' }}
            >
              Delete Item
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
      )}
    </div>
  );
};

export default OrderItemDetailsPage;
