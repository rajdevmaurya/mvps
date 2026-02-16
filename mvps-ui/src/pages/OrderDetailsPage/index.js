import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteJson, fetchData, putJson } from '../../apiClient';
import '../OrdersPage/OrdersPage.css';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [formValues, setFormValues] = useState({
    order_status: '',
    payment_status: '',
    delivery_address: '',
    notes: '',
    discount_amount: '',
    tax_amount: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchData(`/orders/${orderId}`);
      const data = res.data || {};

      setOrder(data);
      setItems((data.items || []).filter(Boolean));

      setFormValues({
        order_status: data.order_status ?? data.orderStatus ?? '',
        payment_status: data.payment_status ?? data.paymentStatus ?? '',
        delivery_address: data.delivery_address ?? data.deliveryAddress ?? '',
        notes: data.notes ?? '',
        discount_amount: data.discount_amount ?? data.discountAmount ?? '',
        tax_amount: data.tax_amount ?? data.taxAmount ?? '',
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to load order.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');

      const payload = {};
      if (formValues.order_status) payload.order_status = formValues.order_status;
      if (formValues.payment_status)
        payload.payment_status = formValues.payment_status;
      if (formValues.delivery_address)
        payload.delivery_address = formValues.delivery_address;
      if (formValues.notes) payload.notes = formValues.notes;
      if (formValues.discount_amount !== '')
        payload.discount_amount = Number(formValues.discount_amount);
      if (formValues.tax_amount !== '')
        payload.tax_amount = Number(formValues.tax_amount);

      await putJson(`/orders/${orderId}`, payload);
      await loadOrder();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to update order.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      'Are you sure you want to cancel this order?',
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      setError('');
      await deleteJson(`/orders/${orderId}`);
      navigate('/orders');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to cancel order.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/orders');
  };

  const pageTitle = useMemo(() => {
    const number = order?.order_number ?? order?.orderNumber;
    return number ? `Order ${number}` : 'Order details';
  }, [order]);

  const customerName = useMemo(() => {
    const customer = order?.customer;
    if (!customer) return '';
    return (
      customer.customer_name ??
      customer.customerName ??
      `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
    );
  }, [order]);

  return (
    <div className="page orders-page container">
      <h1 className="page-title">{pageTitle}</h1>
      <p className="page-subtitle">
        Review and update order status, payment, and key details.
      </p>

      <button
        type="button"
        className="orders-back btn-secondary"
        onClick={handleBack}
        style={{ marginBottom: '1rem' }}
      >
        Back to orders
      </button>

      {loading && <p>Loading order...</p>}
      {error && !loading && <p className="error-message">{error}</p>}

      {!loading && order && (
        <>
          <section className="order-form">
            <h2>Order summary</h2>
            <p>
              <strong>Customer:</strong> {customerName || '—'}
            </p>
            <p>
              <strong>Type:</strong> {order.order_type ?? order.orderType}
              {' · '}
              <strong>Current status:</strong>{' '}
              {order.order_status ?? order.orderStatus}
              {' · '}
              <strong>Payment:</strong>{' '}
              {order.payment_status ?? order.paymentStatus}
            </p>
            <p>
              <strong>Amount:</strong>{' '}
              {order.final_amount != null
                ? Number(order.final_amount).toFixed(2)
                : order.finalAmount != null
                  ? Number(order.finalAmount).toFixed(2)
                  : '-'}
            </p>

            <form onSubmit={handleSubmit} className="order-form-inner">
              <div className="order-form-grid">
                <div>
                  <label>
                    Order status
                    <select
                      name="order_status"
                      className="input"
                      value={formValues.order_status}
                      onChange={handleFieldChange}
                    >
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
                <div>
                  <label>
                    Payment status
                    <select
                      name="payment_status"
                      className="input"
                      value={formValues.payment_status}
                      onChange={handleFieldChange}
                    >
                      <option value="">Select payment status</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="failed">Failed</option>
                    </select>
                  </label>
                </div>
                <div>
                  <label>
                    Discount amount (₹)
                    <input
                      name="discount_amount"
                      type="number"
                      step="0.01"
                      className="input"
                      value={formValues.discount_amount}
                      onChange={handleFieldChange}
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Tax amount (₹)
                    <input
                      name="tax_amount"
                      type="number"
                      step="0.01"
                      className="input"
                      value={formValues.tax_amount}
                      onChange={handleFieldChange}
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Delivery address
                    <input
                      name="delivery_address"
                      className="input"
                      value={formValues.delivery_address}
                      onChange={handleFieldChange}
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Notes
                    <input
                      name="notes"
                      className="input"
                      value={formValues.notes}
                      onChange={handleFieldChange}
                    />
                  </label>
                </div>
              </div>
              <div className="order-form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Update order'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={saving}
                  onClick={handleCancelOrder}
                >
                  Cancel order
                </button>
              </div>
            </form>
          </section>

          <section className="orders-section order-items">
            <h2>Order items</h2>
            {items.length === 0 && <p>No items found for this order.</p>}
            {items.length > 0 && (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Vendor</th>
                      <th>Qty</th>
                      <th>Unit price (₹)</th>
                      <th>Discount %</th>
                      <th>Tax %</th>
                      <th>Line total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={
                          item.order_item_id ??
                          item.orderItemId ??
                          `${item.product_id ?? item.productId}-${
                            item.vendor_id ?? item.vendorId
                          }`
                        }
                      >
                        <td>{item.product_name ?? item.productName}</td>
                        <td>{item.vendor_name ?? item.vendorName}</td>
                        <td>{item.quantity}</td>
                        <td>
                          {item.unit_price != null
                            ? Number(item.unit_price).toFixed(2)
                            : item.unitPrice != null
                              ? Number(item.unitPrice).toFixed(2)
                              : '-'}
                        </td>
                        <td>
                          {item.discount_percentage != null
                            ? Number(item.discount_percentage).toFixed(2)
                            : item.discountPercentage != null
                              ? Number(item.discountPercentage).toFixed(2)
                              : '-'}
                        </td>
                        <td>
                          {item.tax_percentage != null
                            ? Number(item.tax_percentage).toFixed(2)
                            : item.taxPercentage != null
                              ? Number(item.taxPercentage).toFixed(2)
                              : '-'}
                        </td>
                        <td>
                          {item.line_total != null
                            ? Number(item.line_total).toFixed(2)
                            : item.lineTotal != null
                              ? Number(item.lineTotal).toFixed(2)
                              : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default OrderDetailsPage;
