import React, { useEffect, useMemo, useState } from 'react';
import { fetchData } from '../../apiClient';
import './StockHistoryPage.css';

const StockHistoryPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        setError('');

        const res = await fetchData('/analytics/stock-history');
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

        const mapped = list.map((h) => ({
          vendorProductId: h.vendor_product_id ?? h.vendorProductId,
          productId: h.product_id ?? h.productId,
          productName: h.product_name ?? h.productName,
          vendorId: h.vendor_id ?? h.vendorId,
          vendorName: h.vendor_name ?? h.vendorName,
          vendorSku: h.vendor_sku ?? h.vendorSku,
          previousQuantity: h.previous_quantity ?? h.previousQuantity,
          newQuantity: h.new_quantity ?? h.newQuantity,
          changeAmount: h.change_amount ?? h.changeAmount,
          changedAt: h.changed_at ?? h.changedAt,
        }));

        // Sort newest first just in case backend changes ordering later
        mapped.sort((a, b) => {
          const da = a.changedAt ? new Date(a.changedAt).getTime() : 0;
          const db = b.changedAt ? new Date(b.changedAt).getTime() : 0;
          return db - da;
        });

        setRows(mapped);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to load stock history.');
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      return (
        (row.productName && row.productName.toLowerCase().includes(term)) ||
        (row.vendorName && row.vendorName.toLowerCase().includes(term)) ||
        (row.vendorSku && row.vendorSku.toLowerCase().includes(term))
      );
    });
  }, [rows, search]);

  return (
    <div className="page stock-history-page container">
      <h1 className="page-title">Stock History</h1>
      <p className="page-subtitle">
        Audit trail of stock changes across all products and vendors.
      </p>

      <div className="toolbar stock-history-toolbar">
        <input
          type="search"
          className="input"
          placeholder="Search by product, vendor, or SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        {loading && <p>Loading stock history...</p>}
        {error && !loading && <p className="error-message">{error}</p>}
        {!loading && !error && filteredRows.length === 0 && (
          <p>No stock history records found.</p>
        )}
        {!loading && !error && filteredRows.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Product</th>
                <th>Vendor</th>
                <th>SKU</th>
                <th>Previous</th>
                <th>New</th>
                <th>Δ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => (
                <tr key={`${row.vendorProductId ?? idx}-${row.changedAt ?? idx}`}>
                  <td>
                    {row.changedAt
                      ? new Date(row.changedAt).toLocaleString()
                      : ''}
                  </td>
                  <td>{row.productName}</td>
                  <td>{row.vendorName}</td>
                  <td>{row.vendorSku}</td>
                  <td>{row.previousQuantity}</td>
                  <td>{row.newQuantity}</td>
                  <td>
                    {typeof row.changeAmount === 'number' && row.changeAmount !== 0
                      ? `${row.changeAmount > 0 ? '+' : ''}${row.changeAmount}`
                      : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StockHistoryPage;
