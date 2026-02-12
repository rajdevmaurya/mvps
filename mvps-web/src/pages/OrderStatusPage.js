import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { patchJson } from '../apiClient';
import './OrdersPage/OrdersPage.css';

const OrderStatusPage = () => {
  const { orderId } = useParams();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleStatusChange = (e) => setStatus(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await patchJson(`/orders/${orderId}/status`, { status });
      setSuccess('Order status updated successfully.');
    } catch (e) {
      setError('Failed to update order status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page orders-page container">
      <h1 className="page-title">Update Order Status</h1>
      <form onSubmit={handleSubmit} className="order-form-inner">
        <div className="order-form-grid">
          <label>Order Status
            <select className="input" value={status} onChange={handleStatusChange} required>
              <option value="">Select status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>
        <div className="order-form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Update Status'}</button>
        </div>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </form>
    </div>
  );
};

export default OrderStatusPage;
