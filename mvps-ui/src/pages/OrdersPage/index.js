import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  setOrders,
  setFilters,
  setPagination,
  setLoading,
  setError,
} from '../../store/slices/ordersSlice';
import { fetchData } from '../../apiClient';
import Pagination from '../../components/Pagination';
import './OrdersPage.css';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'partial', 'failed'];
const ORDER_TYPES = ['online', 'door_to_door'];

const OrdersPage = () => {
  const dispatch = useDispatch();
  const { list: orders, filters, pagination, loading, error } = useSelector(
    (state) => state.orders,
  );
  const { page, totalPages, totalItems } = pagination;

  const [sampleItems, setSampleItems] = useState([]);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [itemsModalOpen, setItemsModalOpen] = useState(false);

  // Local search input (debounced before dispatching)
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const navigate = useNavigate();

  const PAGE_SIZE = 20;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        dispatch(setFilters({ search: searchInput }));
        dispatch(setPagination({ page: 1 }));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, dispatch]);

  const loadOrders = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const hasSearch = filters.search || filters.status || filters.paymentStatus;

      // Use /orders/search endpoint when filters are active, otherwise /orders
      let ordersRes;
      if (hasSearch) {
        ordersRes = await fetchData('/orders/search', {
          search: filters.search || undefined,
          orderStatus: filters.status || undefined,
          paymentStatus: filters.paymentStatus || undefined,
          page,
          limit: PAGE_SIZE,
        });
      } else {
        ordersRes = await fetchData('/orders', { page, limit: PAGE_SIZE });
      }

      // Fetch customers for name mapping
      const customersRes = await fetchData('/customers', { is_active: true, page: 1, limit: 100 });

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
          customerPhone: customer?.phone ?? '',
          orderType: o.order_type ?? o.orderType,
          finalAmount: o.final_amount ?? o.finalAmount,
          paymentStatus: o.payment_status ?? o.paymentStatus,
          orderStatus: o.order_status ?? o.orderStatus,
          orderDate: o.order_date ?? o.orderDate,
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
  }, [page, filters.search, filters.status, filters.paymentStatus, dispatch]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

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

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
    dispatch(setPagination({ page: 1 }));
  };

  const clearFilters = () => {
    setSearchInput('');
    dispatch(setFilters({ search: '', status: '', paymentStatus: '' }));
    dispatch(setPagination({ page: 1 }));
  };

  const hasActiveFilters = filters.search || filters.status || filters.paymentStatus;

  const formatStatus = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '';

  const statusBadgeClass = (status) => {
    switch (status) {
      case 'delivered': case 'paid': return 'badge-success';
      case 'cancelled': case 'failed': return 'badge-danger';
      case 'processing': case 'shipped': case 'partial': return 'badge-warning';
      case 'confirmed': return 'badge-info';
      default: return 'badge-default';
    }
  };

  return (
    <div className="page orders-page container">
      <h1 className="page-title">Orders</h1>
      <p className="page-subtitle">
        View recent customer orders and their fulfillment status.
      </p>

      {/* Search & Filter Bar */}
      <div className="orders-search-bar">
        <div className="search-input-wrap">
          <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by order number, customer name, or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button className="search-clear-btn" onClick={() => setSearchInput('')} title="Clear search">
              &times;
            </button>
          )}
        </div>

        <select
          className="filter-select"
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => (
            <option key={s} value={s}>{formatStatus(s)}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filters.paymentStatus || ''}
          onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
        >
          <option value="">All Payments</option>
          {PAYMENT_STATUSES.map(s => (
            <option key={s} value={s}>{formatStatus(s)}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button className="btn-clear-filters" onClick={clearFilters}>
            Clear Filters
          </button>
        )}

        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate('/orders/new')}
        >
          + Create order
        </button>
      </div>

      {hasActiveFilters && (
        <div className="active-filters-bar">
          Showing filtered results
          {filters.search && <span className="filter-tag">Search: "{filters.search}"</span>}
          {filters.status && <span className="filter-tag">Status: {formatStatus(filters.status)}</span>}
          {filters.paymentStatus && <span className="filter-tag">Payment: {formatStatus(filters.paymentStatus)}</span>}
          <span className="filter-count">({totalItems} result{totalItems !== 1 ? 's' : ''})</span>
        </div>
      )}

      <section className="orders-section">
        {loading && <p>Loading orders...</p>}
        {error && !loading && <p className="error-message">{error}</p>}
        {!loading && !error && orders.length === 0 && (
          <div className="empty-state">
            <p>No orders found{hasActiveFilters ? ' matching your filters.' : '.'}</p>
            {hasActiveFilters && (
              <button className="link-button" onClick={clearFilters}>Clear filters and show all orders</button>
            )}
          </div>
        )}
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Amount ({'\u20B9'})</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><span className="order-number">{order.orderNumber}</span></td>
                  <td>{order.customerName}</td>
                  <td>{formatStatus(order.orderType)}</td>
                  <td>
                    {order.finalAmount != null
                      ? order.finalAmount.toFixed(2)
                      : '-'}
                  </td>
                  <td>
                    <span className={`status-badge ${statusBadgeClass(order.paymentStatus)}`}>
                      {formatStatus(order.paymentStatus)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${statusBadgeClass(order.orderStatus)}`}>
                      {formatStatus(order.orderStatus)}
                    </span>
                  </td>
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
                      <th>Unit Price ({'\u20B9'})</th>
                      <th>Line Total ({'\u20B9'})</th>
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
