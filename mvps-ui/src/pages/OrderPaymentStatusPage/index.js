import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchData, patchJson } from '../../apiClient';
import './OrderPaymentStatusPage.css';

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const OrderPaymentStatusPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [currentStatus, setCurrentStatus] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [finalAmount, setFinalAmount] = useState(0);
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

        const status = (
          order.paymentStatus ?? order.payment_status ?? 'pending'
        ).toLowerCase();
        setCurrentStatus(status);
        setNewStatus(status);
        setOrderNumber(order.orderNumber ?? order.order_number ?? '');
        setFinalAmount(order.finalAmount ?? order.final_amount ?? 0);
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
      await patchJson(`/orders/${orderId}/payment-status`, {
        paymentStatus: newStatus,
      });
      navigate(`/orders/${orderId}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to update payment status.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/orders/${orderId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'badge-success';
      case 'failed':
        return 'badge-error';
      case 'refunded':
        return 'badge-warning';
      case 'pending':
      default:
        return 'badge-muted';
    }
  };

  return (
    <div className="page payment-status-page container">
      <h1 className="page-title">Update Payment Status</h1>
      <p className="page-subtitle">
        Change the payment status for Order #{orderNumber || orderId}
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
        <form className="payment-form card" onSubmit={handleSubmit}>
          <h2>Payment Status Update</h2>
          <div className="payment-info">
            <div className="info-row">
              <strong>Order Amount:</strong> ₹{finalAmount.toFixed(2)}
            </div>
            <div className="info-row">
              <strong>Current Status:</strong>{' '}
              <span className={`badge ${getStatusColor(currentStatus)}`}>
                {currentStatus.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="form-grid">
            <div>
              <label>
                New Payment Status*
                <select
                  className="input"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="payment-notes">
            <h3>Payment Status Guide:</h3>
            <ul>
              <li>
                <strong>Pending:</strong> Payment not yet received or processing
              </li>
              <li>
                <strong>Paid:</strong> Payment successfully received and confirmed
              </li>
              <li>
                <strong>Failed:</strong> Payment attempt failed or declined
              </li>
              <li>
                <strong>Refunded:</strong> Payment returned to customer
              </li>
            </ul>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Updating…' : 'Update Payment Status'}
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

export default OrderPaymentStatusPage;
