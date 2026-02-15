import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  setOrders,
  setPagination,
  setLoading,
  setError,
} from '../../store/slices/ordersSlice';
import { fetchData } from '../../apiClient';
import Pagination from '../../components/Pagination';
import './OrdersPage.css';

const OrdersPage = () => {
  const dispatch = useDispatch();
  const { list: orders, pagination, loading, error } = useSelector(
    (state) => state.orders,
  );
  const { page, totalPages, totalItems } = pagination;

  const [sampleItems, setSampleItems] = useState([]);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [itemsModalOpen, setItemsModalOpen] = useState(false);

  const navigate = useNavigate();

  const PAGE_SIZE = 20;

  useEffect(() => {
    async function loadOrders() {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

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

        dispatch(setOrders(uiOrders));
        setSampleItems([]);
        setSelectedOrderNumber('');

        let itemsCount = ordersData.length;
        let pagesCount = 1;
        const paginationRes = ordersRes.pagination;
        if (paginationRes) {
          const totalItemsValue =
            typeof paginationRes.total_items === 'number'
              ? paginationRes.total_items
              : paginationRes.totalItems;
          const totalPagesValue =
            typeof paginationRes.total_pages === 'number'
              ? paginationRes.total_pages
              : paginationRes.totalPages;

          if (typeof totalItemsValue === 'number') {
            itemsCount = totalItemsValue;
          }
          if (typeof totalPagesValue === 'number') {
            pagesCount = totalPagesValue;
          }
        }

        dispatch(
          setPagination({
            page,
            totalItems: itemsCount,
            totalPages: pagesCount || 1,
          }),
        );
      } catch (e) {
        console.error(e);
        dispatch(setError('Failed to load orders.'));
      } finally {
        dispatch(setLoading(false));
      }
    }

    loadOrders();
  }, [page, dispatch]);

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

  const handlePageChange = (newPage) => {
    dispatch(setPagination({ page: newPage }));
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
          onPageChange={handlePageChange}
        />
      </section>

      {itemsModalOpen && (
        <div className="modal-backdrop" onClick={closeItemsModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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
            <div className="modal-footer">
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
