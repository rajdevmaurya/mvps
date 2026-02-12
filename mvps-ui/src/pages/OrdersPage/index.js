import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchData } from '../../apiClient';
import Pagination from '../../components/Pagination';
import './OrdersPage.css';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [sampleItems, setSampleItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrderNumber, setSelectedOrderNumber] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [itemsModalOpen, setItemsModalOpen] = useState(false);

  const navigate = useNavigate();

  const PAGE_SIZE = 20;

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setError('');

        const [ordersRes, customersRes] = await Promise.all([
          fetchData('/orders', { page, limit: PAGE_SIZE }),
          fetchData('/customers', { is_active: true, page: 1, limit: 100 }),
        ]);

        const ordersData = ordersRes.data || [];
        const customersData = customersRes.data || [];

        const customersById = new Map();
        customersData.forEach((c) => {
          if (!c) return;
          const id = c.customer_id ?? c.customerId;
          if (typeof id === 'number') {
            customersById.set(id, c);
          }
        });

        const uiOrders = ordersData.map((o) => {
          const orderId = o.order_id ?? o.orderId;
          const customerId = o.customer_id ?? o.customerId;
          const customer = customersById.get(customerId);
          return {
            id: orderId,
            orderNumber: o.order_number ?? o.orderNumber,
            customerName:
              customer?.customer_name ?? customer?.customerName ??
              `Customer #${customerId || ''}`,
            orderType: o.order_type ?? o.orderType,
            finalAmount: o.final_amount ?? o.finalAmount,
            paymentStatus: o.payment_status ?? o.paymentStatus,
            orderStatus: o.order_status ?? o.orderStatus,
          };
        });

        setOrders(uiOrders);
        setSampleItems([]);
        setSelectedOrderNumber('');

        // Update pagination info from orders response
        let itemsCount = ordersData.length;
        let pagesCount = 1;
        const pagination = ordersRes.pagination;
        if (pagination) {
          const totalItemsValue =
            typeof pagination.total_items === 'number'
              ? pagination.total_items
              : pagination.totalItems;
          const totalPagesValue =
            typeof pagination.total_pages === 'number'
              ? pagination.total_pages
              : pagination.totalPages;

          if (typeof totalItemsValue === 'number') {
            itemsCount = totalItemsValue;
          }
          if (typeof totalPagesValue === 'number') {
            pagesCount = totalPagesValue;
          }
        }

        setTotalItems(itemsCount);
        setTotalPages(pagesCount || 1);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [page]);

  const handleViewDetails = async (order) => {
    setDetailsError('');
    setSelectedOrderNumber(order.orderNumber);
    setSampleItems([]);
    setItemsModalOpen(true);

    try {
      setDetailsLoading(true);
      const orderDetailRes = await fetchData(`/orders/${order.id}`);
      const orderDetail = orderDetailRes.data || {};
      const items = (orderDetail.items || []).map((item) => ({
        productName: item.product_name ?? item.productName,
        vendorName: item.vendor_name ?? item.vendorName,
        quantity: item.quantity,
        unitPrice: item.unit_price ?? item.unitPrice,
        lineTotal: item.line_total ?? item.lineTotal,
      }));
      setSampleItems(items);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setDetailsError('Failed to load order details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeItemsModal = () => {
    setItemsModalOpen(false);
    setSampleItems([]);
    setSelectedOrderNumber('');
    setDetailsError('');
    setDetailsLoading(false);
  };

  return (
    <div className="page orders-page container">
      <h1 className="page-title">Orders</h1>
      <p className="page-subtitle">
        View recent customer orders and their fulfillment status.
      </p>

      <div className="toolbar orders-toolbar">
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate('/orders/new')}
        >
          + Create order
        </button>
      </div>

      <section className="orders-section">
        {loading && <p>Loading orders...</p>}
        {error && !loading && <p className="error-message">{error}</p>}
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Amount (₹)</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{order.customerName}</td>
                  <td>{order.orderType}</td>
                  <td>
                    {order.finalAmount != null
                      ? order.finalAmount.toFixed(2)
                      : '-'}
                  </td>
                  <td>{order.paymentStatus}</td>
                  <td>{order.orderStatus}</td>
                  <td>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleViewDetails(order)}
                    >
                      View items
                    </button>
                    {' | '}
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          entityLabel="orders"
          onPageChange={setPage}
        />
      </section>

      {itemsModalOpen && (
        <div className="orders-modal-backdrop">
          <div className="orders-modal">
            <h2>Order Breakdown</h2>
            {selectedOrderNumber && (
              <p>
                Showing items for order <strong>{selectedOrderNumber}</strong>
              </p>
            )}
            {detailsLoading && <p>Loading order details...</p>}
            {detailsError && !detailsLoading && (
              <p className="error-message">{detailsError}</p>
            )}
            {!detailsLoading && !detailsError && sampleItems.length === 0 && (
              <p>No items found for this order.</p>
            )}
            {sampleItems.length > 0 && (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Vendor</th>
                      <th>Qty</th>
                      <th>Unit Price (₹)</th>
                      <th>Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.productName}</td>
                        <td>{item.vendorName}</td>
                        <td>{item.quantity}</td>
                        <td>
                          {item.unitPrice != null
                            ? item.unitPrice.toFixed(2)
                            : '-'}
                        </td>
                        <td>
                          {item.lineTotal != null
                            ? item.lineTotal.toFixed(2)
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="orders-modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeItemsModal}
                disabled={detailsLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
