import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchData, patchJson } from '../../apiClient';
import './OrderStatusPage.css';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

const OrderStatusPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [currentStatus, setCurrentStatus] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetchData(`/orders/${orderId}`);
        const order = res.data || {};

        const status = (order.orderStatus ?? order.order_status ?? 'pending').toLowerCase();
        setCurrentStatus(status);
        setNewStatus(status);
        setOrderNumber(order.orderNumber ?? order.order_number ?? '');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to load order.');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await patchJson(`/orders/${orderId}/status`, {
        orderStatus: newStatus,
      });
      navigate(`/orders/${orderId}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to update order status.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/orders/${orderId}`);
  };

  return (
    <div className="page order-status-page container">
      <h1 className="page-title">Update Order Status</h1>
      <p className="page-subtitle">
        Change the fulfillment status for Order #{orderNumber || orderId}
      </p>

      <button
        type="button"
        className="btn-secondary"
        onClick={handleCancel}
        style={{ marginBottom: '1rem' }}
      >
        Back to Order
      </button>

      {loading && <p>Loading order...</p>}
      {error && !loading && <p className="error-message">{error}</p>}

      {!loading && (
        <form className="status-form card" onSubmit={handleSubmit}>
          <h2>Order Status Update</h2>
          <div className="status-info">
            <strong>Current Status:</strong>{' '}
            <span className={`badge badge-${currentStatus}`}>
              {currentStatus.toUpperCase()}
            </span>
          </div>
          <div className="form-grid">
            <div>
              <label>
                New Status*
                <select
                  className="input"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="status-transitions">
            <h3>Typical Status Flow:</h3>
            <div className="flow-chart">
              Pending → Confirmed → Processing → Shipped → Delivered
            </div>
            <p className="hint">
              Note: Orders can be cancelled at any stage before delivery.
            </p>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Updating…' : 'Update Status'}
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

export default OrderStatusPage;
