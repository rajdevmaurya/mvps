import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { patchJson } from '../apiClient';
import './OrdersPage/OrdersPage.css';

const OrderPaymentStatusPage = () => {
  const { orderId } = useParams();
  const [paymentStatus, setPaymentStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleStatusChange = (e) => setPaymentStatus(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await patchJson(`/orders/${orderId}/payment-status`, { payment_status: paymentStatus });
      setSuccess('Payment status updated successfully.');
    } catch (e) {
      setError('Failed to update payment status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page orders-page container">
      <h1 className="page-title">Update Payment Status</h1>
      <form onSubmit={handleSubmit} className="order-form-inner">
        <div className="order-form-grid">
          <label>Payment Status
            <select className="input" value={paymentStatus} onChange={handleStatusChange} required>
              <option value="">Select payment status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="failed">Failed</option>
            </select>
          </label>
        </div>
        <div className="order-form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Update Payment Status'}</button>
        </div>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </form>
    </div>
  );
};

export default OrderPaymentStatusPage;
