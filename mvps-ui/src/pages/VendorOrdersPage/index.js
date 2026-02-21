import React, { useEffect, useMemo, useState, useRef } from 'react';
import { fetchData, postJson, putJson, deleteJson } from '../../apiClient';
import Pagination from '../../components/Pagination';
import SearchableSelect from '../../components/SearchableSelect';
import PageHeader from '../../components/PageHeader';
import './VendorOrdersPage.css';

const PAGE_SIZE = 20;

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
];

const VendorOrdersPage = () => {
  const [vendors, setVendors] = useState([]);
  const createRef = useRef(null);
  const [showCreate, setShowCreate] = useState(false);
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    vendorId: '',
    status: '',
    fromDate: '',
    toDate: '',
  });

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newOrder, setNewOrder] = useState({
    vendorId: '',
    totalAmount: '',
    expectedDeliveryDate: '',
    notes: '',
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailForm, setDetailForm] = useState({
    total_amount: '',
    status: '',
    expected_delivery_date: '',
    actual_delivery_date: '',
    notes: '',
  });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const vendorsById = useMemo(() => {
    const m = new Map();
    (vendors || []).forEach((v) => {
      const id = v?.vendor_id ?? v?.vendorId;
      if (id != null) m.set(id, v);
    });
    return m;
  }, [vendors]);

  const vendorOptions = useMemo(() => {
    return (vendors || [])
      .filter((v) => v && (v.vendor_id ?? v.vendorId) != null)
      .map((v) => {
        const id = v.vendor_id ?? v.vendorId;
        const name = v.vendor_name ?? v.vendorName;
        return { value: String(id), label: name || `Vendor #${id}` };
      });
  }, [vendors]);

  const formatDate = (value) => {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  const toDateInputValue = (value) => {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '';
      // yyyy-mm-dd
      return d.toISOString().slice(0, 10);
    } catch (e) {
      return '';
    }
  };
  const loadOrders = async (pageToLoad = page) => {
    try {
      setLoading(true);
      setError('');

      const params = { page: pageToLoad, limit: PAGE_SIZE };
      if (filters.vendorId) params.vendor_id = Number(filters.vendorId);
      if (filters.status) params.status = filters.status;
      if (filters.fromDate) params.from_date = filters.fromDate;
      if (filters.toDate) params.to_date = filters.toDate;

      const res = await fetchData('/vendor-orders', params);
      const data = res.data || [];
      const pagination = res.pagination;

      const mapped = data
        .map((o) => {
          if (!o) return null;
          const id = o.vendor_order_id ?? o.vendorOrderId;
          const vendorId = o.vendor_id ?? o.vendorId;
          const vendor = vendorsById.get(vendorId);
          const vendorName = vendor?.vendor_name ?? vendor?.vendorName ?? `Vendor #${vendorId || ''}`;

          const orderDateRaw = o.order_date ?? o.orderDate;
          const expectedDateRaw = o.expected_delivery_date ?? o.expectedDeliveryDate;
          const actualDateRaw = o.actual_delivery_date ?? o.actualDeliveryDate;

          return {
            id,
            vendorId,
            vendorName,
            poNumber: o.po_number ?? o.poNumber,
            totalAmount: o.total_amount ?? o.totalAmount,
            status: o.status,
            orderDate: formatDate(orderDateRaw),
            expectedDeliveryDate: formatDate(expectedDateRaw),
            actualDeliveryDate: formatDate(actualDateRaw),
          };
        })
        .filter(Boolean);

      setOrders(mapped);

      let itemsCount = data.length;
      let pagesCount = 1;
      if (pagination) {
        const totalItemsValue = typeof pagination.total_items === 'number' ? pagination.total_items : pagination.totalItems;
        const totalPagesValue = typeof pagination.total_pages === 'number' ? pagination.total_pages : pagination.totalPages;

        if (typeof totalItemsValue === 'number') itemsCount = totalItemsValue;
        if (typeof totalPagesValue === 'number') pagesCount = totalPagesValue;
      }

      setTotalItems(itemsCount);
      setTotalPages(pagesCount || 1);
      setPage(pageToLoad);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setError('Failed to load vendor orders.');
    } finally {
      setLoading(false);
    }
  };
  // Load vendors on mount
  useEffect(() => {
    async function loadVendors() {
      try {
        // Load vendors with maximum allowed limit (100)
        const res = await fetchData('/vendors', { is_active: true, page: 1, limit: 100 });
        setVendors(res.data || []);
      } catch (e) {
        console.error('Failed to load vendors:', e);
      }
    }
    loadVendors();
  }, []);

  useEffect(() => {
    loadOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.vendorId, filters.status, filters.fromDate, filters.toDate, vendorsById]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewOrderFieldChange = (field, value) => {
    setNewOrder((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateOrder = async (event) => {
    event.preventDefault();
    setCreateError('');

    const vendorIdNum = Number(newOrder.vendorId);
    const totalAmountNum = Number(newOrder.totalAmount);

    if (!vendorIdNum || !totalAmountNum || totalAmountNum <= 0) {
      setCreateError('Please select a vendor and enter a valid amount.');
      return;
    }

    const payload = {
      vendorId: vendorIdNum,
      totalAmount: totalAmountNum,
    };

    if (newOrder.expectedDeliveryDate) {
      payload.expectedDeliveryDate = newOrder.expectedDeliveryDate;
    }
    if (newOrder.notes) {
      payload.notes = newOrder.notes;
    }

    try {
      setCreating(true);
      await postJson('/vendor-orders', payload);
      setNewOrder({ vendorId: '', totalAmount: '', expectedDeliveryDate: '', notes: '' });
      await loadOrders(1);
      // close modal when created
      setCreateModalOpen(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setCreateError('Failed to create vendor order. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const openDetailModal = async (orderId) => {
    setSelectedOrderId(orderId);
    setDetailError('');
    setDetailForm({
      total_amount: '',
      status: '',
      expected_delivery_date: '',
      actual_delivery_date: '',
      notes: '',
    });
    setDetailModalOpen(true);

    try {
      setDetailLoading(true);
      const res = await fetchData(`/vendor-orders/${orderId}`);
      const data = res.data || {};
      setOrderDetail(data);

      setDetailForm({
        total_amount: data.total_amount ?? data.totalAmount ?? '',
        status: data.status ?? '',
        expected_delivery_date: toDateInputValue(data.expected_delivery_date ?? data.expectedDeliveryDate ?? ''),
        actual_delivery_date: toDateInputValue(data.actual_delivery_date ?? data.actualDeliveryDate ?? ''),
        notes: data.notes ?? '',
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setDetailError('Failed to load vendor order details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedOrderId(null);
    setOrderDetail(null);
    setDetailError('');
    setDetailLoading(false);
    setDetailSaving(false);
  };

  const handleDetailFieldChange = (field, value) => {
    setDetailForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDetail = async (event) => {
    event.preventDefault();
    if (!selectedOrderId) return;

    const payload = {};

    if (detailForm.total_amount !== '') {
      const amount = Number(detailForm.total_amount);
      if (!Number.isNaN(amount)) {
        payload.totalAmount = amount;
      }
    }
    if (detailForm.status) {
      payload.status = detailForm.status;
    }
    if (detailForm.expected_delivery_date) {
      payload.expectedDeliveryDate = detailForm.expected_delivery_date;
    }
    if (detailForm.actual_delivery_date) {
      payload.actualDeliveryDate = detailForm.actual_delivery_date;
    }
    if (detailForm.notes) {
      payload.notes = detailForm.notes;
    }

    try {
      setDetailSaving(true);
      const res = await putJson(`/vendor-orders/${selectedOrderId}`, payload);

      // if server returned updated data, update detail and list immediately
      const updated = res?.data || res;
      if (updated) {
        setOrderDetail(updated);
        setDetailForm({
          total_amount: updated.total_amount ?? updated.totalAmount ?? '',
          status: updated.status ?? '',
          expected_delivery_date: toDateInputValue(updated.expected_delivery_date ?? updated.expectedDeliveryDate ?? ''),
          actual_delivery_date: toDateInputValue(updated.actual_delivery_date ?? updated.actualDeliveryDate ?? ''),
          notes: updated.notes ?? '',
        });
      }
      // optimistically update the list row so the table reflects saved dates immediately
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== selectedOrderId) return o;
          return {
            ...o,
            totalAmount:
              payload.totalAmount !== undefined ? payload.totalAmount : o.totalAmount,
            expectedDeliveryDate:
              payload.expectedDeliveryDate !== undefined
                ? formatDate(payload.expectedDeliveryDate)
                : o.expectedDeliveryDate,
            actualDeliveryDate:
              payload.actualDeliveryDate !== undefined
                ? formatDate(payload.actualDeliveryDate)
                : o.actualDeliveryDate,
            status: payload.status !== undefined ? payload.status : o.status,
          };
        }),
      );

      // refresh list and details to ensure authoritative server state
      await loadOrders(page);
      await openDetailModal(selectedOrderId);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setDetailError('Failed to update vendor order.');
    } finally {
      setDetailSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderId) return;
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Are you sure you want to cancel this vendor order?');
    if (!confirmed) return;

    try {
      setDetailSaving(true);
      setDetailError('');
      await deleteJson(`/vendor-orders/${selectedOrderId}`);
      await loadOrders(1);
      closeDetailModal();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setDetailError('Failed to cancel vendor order.');
    } finally {
      setDetailSaving(false);
    }
  };

  const pageTitle = 'Vendor Orders';

  return (
    <div className="page vendor-orders-page customers-page container">
      <PageHeader title={pageTitle} subtitle="Purchase orders placed to vendors, with status tracking." />

      <div className="toolbar customers-toolbar">
        <div className="filters-group">
          <SearchableSelect
            options={[{ value: '', label: 'All vendors' }, ...vendorOptions]}
            value={filters.vendorId}
            onChange={(val) => handleFilterChange('vendorId', val)}
            placeholder="All vendors"
          />

          <select
            className="input"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="input"
            value={filters.fromDate}
            onChange={(e) => handleFilterChange('fromDate', e.target.value)}
          />

          <input
            type="date"
            className="input"
            value={filters.toDate}
            onChange={(e) => handleFilterChange('toDate', e.target.value)}
          />
        </div>
        <div className="actions-group">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setShowCreate((s) => !s);
              // if opening, scroll to form after render
              if (!showCreate) {
                setTimeout(() => createRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
              }
            }}
          >
            {showCreate ? 'Hide new order' : '+ New order'}
          </button>
        </div>
      </div>

      {showCreate && (
        <section className="vendor-orders-form" ref={createRef}>
        <h2>Create vendor order</h2>
        {createError && <p className="error-message">{createError}</p>}
        <form onSubmit={handleCreateOrder}>
          <div className="vendor-orders-form-grid">
            <div>
              <label>
                Vendor
                <SearchableSelect
                  options={vendorOptions}
                  value={newOrder.vendorId}
                  onChange={(val) => handleNewOrderFieldChange('vendorId', val)}
                  placeholder="Select vendor"
                />
              </label>
            </div>
            <div>
              <label>
                Total amount (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={newOrder.totalAmount}
                  onChange={(e) => handleNewOrderFieldChange('totalAmount', e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                Expected delivery date
                <input
                  type="date"
                  className="input"
                  value={newOrder.expectedDeliveryDate}
                  onChange={(e) =>
                    handleNewOrderFieldChange('expectedDeliveryDate', e.target.value)
                  }
                />
              </label>
            </div>
            <div>
              <label>
                Notes
                <input
                  type="text"
                  className="input"
                  value={newOrder.notes}
                  onChange={(e) => handleNewOrderFieldChange('notes', e.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="vendor-orders-form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={creating}
            >
              {creating ? 'Creating…' : 'Create vendor order'}
            </button>
          </div>
        </form>
        </section>
        )}

      <section style={{ marginTop: '1.5rem' }}>
        {loading && <p>Loading vendor orders...</p>}
        {error && !loading && <p className="error-message">{error}</p>}
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>Vendor</th>
                <th>Order date</th>
                <th>Total amount (₹)</th>
                <th>Status</th>
                <th>Expected delivery</th>
                <th>Actual delivery</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.poNumber}</td>
                  <td>{o.vendorName}</td>
                  <td>{o.orderDate}</td>
                  <td>
                    {o.totalAmount != null
                      ? Number(o.totalAmount).toFixed(2)
                      : '-'}
                  </td>
                  <td>{o.status}</td>
                  <td>{o.expectedDeliveryDate || '—'}</td>
                  <td>{o.actualDeliveryDate || '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => openDetailModal(o.id)}
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
          entityLabel="vendor orders"
          onPageChange={loadOrders}
        />
      </section>

      {/* Create modal */}
      {createModalOpen && (
        <div className="vendor-orders-modal-backdrop">
          <div className="vendor-orders-modal">
            <h2>Create vendor order</h2>
            <div className="vendor-orders-modal-body">
              {createError && <p className="error-message">{createError}</p>}
              <form onSubmit={handleCreateOrder}>
                <div className="vendor-orders-modal-grid">
                  <div>
                    <label>
                      Vendor
                      <SearchableSelect
                        options={vendorOptions}
                        value={newOrder.vendorId}
                        onChange={(val) => handleNewOrderFieldChange('vendorId', val)}
                        placeholder="Select vendor"
                      />
                    </label>
                  </div>
                  <div>
                    <label>
                      Total amount (₹)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input"
                        value={newOrder.totalAmount}
                        onChange={(e) => handleNewOrderFieldChange('totalAmount', e.target.value)}
                      />
                    </label>
                  </div>
                  <div>
                    <label>
                      Expected delivery date
                      <input
                        type="date"
                        className="input"
                        value={newOrder.expectedDeliveryDate}
                        onChange={(e) => handleNewOrderFieldChange('expectedDeliveryDate', e.target.value)}
                      />
                    </label>
                  </div>
                  <div>
                    <label>
                      Notes
                      <input
                        type="text"
                        className="input"
                        value={newOrder.notes}
                        onChange={(e) => handleNewOrderFieldChange('notes', e.target.value)}
                      />
                    </label>
                  </div>
                </div>
                <div className="vendor-orders-modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setCreateModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creating…' : 'Create vendor order'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && (
        <div className="vendor-orders-modal-backdrop">
          <div className="vendor-orders-modal">
            <h2>Vendor order details</h2>
            <div className="vendor-orders-modal-body">
              {detailLoading && <p>Loading order...</p>}
              {detailError && !detailLoading && (
                <p className="error-message">{detailError}</p>
              )}
              {!detailLoading && orderDetail && (
                <>
                  <p>
                    <strong>PO #:</strong> {orderDetail.po_number ?? orderDetail.poNumber}
                  </p>
                  <p>
                    <strong>Vendor ID:</strong>{' '}
                    {orderDetail.vendor_id ?? orderDetail.vendorId}
                  </p>
                  <p>
                    <strong>Created at:</strong>{' '}
                    {formatDate(orderDetail.created_at ?? orderDetail.createdAt)}
                  </p>

                  <form onSubmit={handleSaveDetail}>
                    <div className="vendor-orders-modal-grid">
                      <div>
                        <label>
                          Total amount (₹)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input"
                            value={detailForm.total_amount}
                            onChange={(e) =>
                              handleDetailFieldChange('total_amount', e.target.value)
                            }
                          />
                        </label>
                      </div>
                      <div>
                        <label>
                          Status
                          <select
                            className="input"
                            value={detailForm.status}
                            onChange={(e) =>
                              handleDetailFieldChange('status', e.target.value)
                            }
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value || 'all-detail'} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div>
                        <label>
                          Expected delivery date
                          <input
                            type="date"
                            className="input"
                            value={detailForm.expected_delivery_date}
                            onChange={(e) =>
                              handleDetailFieldChange(
                                'expected_delivery_date',
                                e.target.value,
                              )
                            }
                          />
                        </label>
                      </div>
                      <div>
                        <label>
                          Actual delivery date
                          <input
                            type="date"
                            className="input"
                            value={detailForm.actual_delivery_date}
                            onChange={(e) =>
                              handleDetailFieldChange(
                                'actual_delivery_date',
                                e.target.value,
                              )
                            }
                          />
                        </label>
                      </div>
                      <div>
                        <label>
                          Notes
                          <input
                            type="text"
                            className="input"
                            value={detailForm.notes}
                            onChange={(e) =>
                              handleDetailFieldChange('notes', e.target.value)
                            }
                          />
                        </label>
                      </div>
                    </div>
                    <div className="vendor-orders-modal-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCancelOrder}
                        disabled={detailSaving}
                      >
                        Cancel order
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={closeDetailModal}
                        disabled={detailSaving}
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={detailSaving}
                      >
                        {detailSaving ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrdersPage;
