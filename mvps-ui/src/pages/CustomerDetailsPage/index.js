import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchData, postJson, putJson, deleteJson } from '../../apiClient';
import '../OrdersPage/OrdersPage.css';

const defaultFormValues = {
  customerName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  customerType: 'retail',
  isActive: true,
};

const CustomerDetailsPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(customerId);

  const [formValues, setFormValues] = useState(defaultFormValues);
  const [registrationDate, setRegistrationDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    if (!isEdit) {
      setFormValues(defaultFormValues);
      setRegistrationDate('');
      setOrders([]);
      return;
    }

    const loadCustomer = async () => {
      try {
        setLoadingCustomer(true);
        setError('');
        const res = await fetchData(`/customers/${customerId}`);
        const c = res.data || {};
        setFormValues({
          customerName: c.customerName ?? c.customer_name ?? '',
          email: c.email || '',
          phone: c.phone || '',
          address: c.address || '',
          city: c.city || '',
          state: c.state || '',
          pincode: c.pincode || '',
          customerType: (c.customerType ?? c.customer_type ?? 'retail').toString(),
          isActive:
            typeof (c.isActive ?? c.is_active) === 'boolean'
              ? c.isActive ?? c.is_active
              : true,
        });
        const reg = c.registrationDate ?? c.registration_date;
        setRegistrationDate(reg || '');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to load customer.');
      } finally {
        setLoadingCustomer(false);
      }
    };

    loadCustomer();
  }, [isEdit, customerId]);

  useEffect(() => {
    if (!isEdit) {
      setOrders([]);
      return;
    }

    const loadOrders = async () => {
      try {
        setLoadingOrders(true);
        setOrdersError('');
        const res = await fetchData(`/customers/${customerId}/orders`);
        const list = res.data || [];
        const mapped = list.map((o) => ({
          id: o.orderId ?? o.order_id,
          orderNumber: o.orderNumber ?? o.order_number,
          orderType: o.orderType ?? o.order_type,
          orderStatus: o.orderStatus ?? o.order_status,
          paymentStatus: o.paymentStatus ?? o.payment_status,
          finalAmount: o.finalAmount ?? o.final_amount,
          orderDate: o.orderDate ?? o.order_date,
        }));
        setOrders(mapped);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setOrdersError('Failed to load customer orders.');
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [isEdit, customerId]);

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
      customerName: formValues.customerName,
      email: formValues.email || undefined,
      phone: formValues.phone,
      address: formValues.address || undefined,
      city: formValues.city || undefined,
      state: formValues.state || undefined,
      pincode: formValues.pincode || undefined,
      customerType: formValues.customerType || undefined,
      isActive: formValues.isActive,
    };

    try {
      if (isEdit) {
        await putJson(`/customers/${customerId}`, payload);
      } else {
        await postJson('/customers', payload);
      }
      navigate('/customers');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to save customer.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Are you sure you want to delete this customer?');
    if (!confirmed) return;

    setSaving(true);
    setError('');
    try {
      await deleteJson(`/customers/${customerId}`);
      navigate('/customers');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to delete customer.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/customers');
  };

  const pageTitle = isEdit ? 'Edit customer' : 'Add customer';

  const formatDate = (value) => {
    if (!value) return '';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="page orders-page container">
      <h1 className="page-title">{pageTitle}</h1>
      <p className="page-subtitle">
        {isEdit
          ? 'Update customer details and review their order history.'
          : 'Register a new customer for ordering and tracking.'}
      </p>

      <button
        type="button"
        className="btn-secondary"
        onClick={handleCancel}
        style={{ marginBottom: '1rem' }}
      >
        Back to customers
      </button>

      {loadingCustomer && <p>Loading customer...</p>}
      {error && !loadingCustomer && <p className="error-message">{error}</p>}

      <form className="order-form" onSubmit={handleSubmit}>
        <h2>{pageTitle}</h2>
        <div className="order-form-grid">
          <div>
            <label>
              Customer name*
              <input
                name="customerName"
                className="input"
                value={formValues.customerName}
                onChange={handleFieldChange}
                required
              />
            </label>
          </div>
          <div>
            <label>
              Email
              <input
                name="email"
                type="email"
                className="input"
                value={formValues.email}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div>
            <label>
              Phone*
              <input
                name="phone"
                className="input"
                value={formValues.phone}
                onChange={handleFieldChange}
                required
              />
            </label>
          </div>
          <div className="order-form-full">
            <label>
              Address
              <input
                name="address"
                className="input"
                value={formValues.address}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div>
            <label>
              City
              <input
                name="city"
                className="input"
                value={formValues.city}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div>
            <label>
              State
              <input
                name="state"
                className="input"
                value={formValues.state}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div>
            <label>
              Pincode
              <input
                name="pincode"
                className="input"
                value={formValues.pincode}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div>
            <label>
              Customer type
              <select
                name="customerType"
                className="input"
                value={formValues.customerType}
                onChange={handleFieldChange}
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="institution">Institution</option>
              </select>
            </label>
          </div>
          <div>
            <label>
              Registered on
              <input
                className="input"
                value={formatDate(registrationDate) || '-'}
                disabled
              />
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={formValues.isActive}
                onChange={handleFieldChange}
              />{' '}
              Active
            </label>
          </div>
        </div>
        <div className="order-form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : isEdit ? 'Update customer' : 'Create customer'}
          </button>
          {isEdit && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDelete}
              disabled={saving}
            >
              Delete customer
            </button>
          )}
        </div>
      </form>

      {isEdit && (
        <section className="orders-section">
          <h2>Order history</h2>
          {loadingOrders && <p>Loading orders...</p>}
          {ordersError && !loadingOrders && (
            <p className="error-message">{ordersError}</p>
          )}
          {!loadingOrders && !ordersError && orders.length === 0 && (
            <p>No orders found for this customer.</p>
          )}
          {orders.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Type</th>
                    <th>Amount (₹)</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Order date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.orderNumber}</td>
                      <td>{order.orderType}</td>
                      <td>
                        {order.finalAmount != null
                          ? order.finalAmount.toFixed(2)
                          : '-'}
                      </td>
                      <td>{order.paymentStatus}</td>
                      <td>{order.orderStatus}</td>
                      <td>{formatDate(order.orderDate) || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default CustomerDetailsPage;
