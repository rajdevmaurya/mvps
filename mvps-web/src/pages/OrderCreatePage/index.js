import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchData, postJson } from '../../apiClient';
import '../OrdersPage/OrdersPage.css';

const OrderCreatePage = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [newOrder, setNewOrder] = useState({
    customerId: '',
    orderType: 'online',
    deliveryAddress: '',
    notes: '',
    productId: '',
    quantity: 1,
  });

  useEffect(() => {
    async function loadLookups() {
      try {
        setLoading(true);
        setError('');

        const [customersRes, productsRes] = await Promise.all([
          fetchData('/customers', { is_active: true, page: 1, limit: 100 }),
          fetchData('/products', { is_active: true, page: 1, limit: 100 }),
        ]);

        setCustomers(customersRes.data || []);
        setProducts(productsRes.data || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        setError('Failed to load customers or products.');
      } finally {
        setLoading(false);
      }
    }

    loadLookups();
  }, []);

  const handleCreateFieldChange = (field, value) => {
    setNewOrder((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCreateError('');

    const customerIdNum = Number(newOrder.customerId);
    const productIdNum = Number(newOrder.productId);
    const quantityNum = Number(newOrder.quantity);

    if (!customerIdNum || !productIdNum || !quantityNum || quantityNum <= 0) {
      setCreateError('Please select customer, product and a valid quantity.');
      return;
    }

    const payload = {
      customerId: customerIdNum,
      orderType: newOrder.orderType,
      deliveryAddress: newOrder.deliveryAddress || undefined,
      notes: newOrder.notes || undefined,
      items: [
        {
          productId: productIdNum,
          quantity: quantityNum,
        },
      ],
    };

    try {
      setCreating(true);
      await postJson('/orders', payload);
      navigate('/orders');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setCreateError('Failed to create order. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    navigate('/orders');
  };

  return (
    <div className="page orders-page container">
      <h1 className="page-title">Create order</h1>
      <p className="page-subtitle">
        Create a new customer order. The system will automatically route
        items to the lowest-price eligible vendor.
      </p>

      <button
        type="button"
        className="btn-secondary"
        onClick={handleCancel}
        style={{ marginBottom: '1rem' }}
      >
        Back to orders
      </button>

      {loading && <p>Loading customers and products...</p>}
      {error && !loading && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <section className="order-form">
          <h2>Create order (lowest price auto-selection)</h2>
          {createError && <p className="error-message">{createError}</p>}
          <form onSubmit={handleSubmit}>
            <div className="order-form-grid">
              <div>
                <label htmlFor="customer-select">Customer</label>
                <select
                  id="customer-select"
                  className="input"
                  value={newOrder.customerId}
                  onChange={(e) =>
                    handleCreateFieldChange('customerId', e.target.value)
                  }
                >
                  <option key="customer-placeholder" value="">
                    Select customer
                  </option>
                  {customers.map((c, index) => {
                    if (!c) return null;
                    const id = c.customer_id ?? c.customerId;
                    const name = c.customer_name ?? c.customerName;
                    const phone = c.phone;
                    if (id == null) return null;
                    return (
                      <option key={id ?? `customer-${index}`} value={id}>
                        {name} {phone ? `(${phone})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="product-select">Product</label>
                <select
                  id="product-select"
                  className="input"
                  value={newOrder.productId}
                  onChange={(e) =>
                    handleCreateFieldChange('productId', e.target.value)
                  }
                >
                  <option key="product-placeholder" value="">
                    Select product
                  </option>
                  {products.map((p, index) => {
                    if (!p) return null;
                    const id = p.product_id ?? p.productId;
                    const name = p.product_name ?? p.productName;
                    if (id == null) return null;
                    return (
                      <option key={id ?? `product-${index}`} value={id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="quantity-input">Quantity</label>
                <input
                  id="quantity-input"
                  type="number"
                  min="1"
                  className="input"
                  value={newOrder.quantity}
                  onChange={(e) =>
                    handleCreateFieldChange('quantity', e.target.value)
                  }
                />
              </div>
              <div>
                <label htmlFor="order-type">Order type</label>
                <select
                  id="order-type"
                  className="input"
                  value={newOrder.orderType}
                  onChange={(e) =>
                    handleCreateFieldChange('orderType', e.target.value)
                  }
                >
                  <option key="order-type-online" value="online">
                    Online
                  </option>
                  <option key="order-type-door" value="door_to_door">
                    Door to door
                  </option>
                </select>
              </div>
              <div>
                <label htmlFor="delivery-address">Delivery address (optional)</label>
                <input
                  id="delivery-address"
                  type="text"
                  className="input"
                  value={newOrder.deliveryAddress}
                  onChange={(e) =>
                    handleCreateFieldChange('deliveryAddress', e.target.value)
                  }
                />
              </div>
              <div>
                <label htmlFor="order-notes">Notes (optional)</label>
                <input
                  id="order-notes"
                  type="text"
                  className="input"
                  value={newOrder.notes}
                  onChange={(e) =>
                    handleCreateFieldChange('notes', e.target.value)
                  }
                />
              </div>
            </div>
            <div className="order-form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={creating}
              >
                {creating ? 'Creating order…' : 'Create order'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setNewOrder({
                    customerId: '',
                    orderType: 'online',
                    deliveryAddress: '',
                    notes: '',
                    productId: '',
                    quantity: 1,
                  });
                  setCreateError('');
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default OrderCreatePage;
