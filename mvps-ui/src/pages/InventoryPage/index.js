import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setItems,
  setLoading,
  setError,
} from '../../store/slices/inventorySlice';
import { fetchData, patchJson } from '../../apiClient';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import './InventoryPage.css';

const PAGE_SIZE = 10;

const InventoryPage = () => {
  const dispatch = useDispatch();
  const { items: rows, loading, error } = useSelector(
    (state) => state.inventory,
  );

  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [vendorStocks, setVendorStocks] = useState([]);
  const [stockEdits, setStockEdits] = useState({});
  const [stockHistory, setStockHistory] = useState([]);
  const [serverStockHistory, setServerStockHistory] = useState([]);
  const [serverHistoryLoading, setServerHistoryLoading] = useState(false);
  const [serverHistoryError, setServerHistoryError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.trim().toLowerCase();
    return rows.filter((r) => r.productName && r.productName.toLowerCase().includes(term));
  }, [rows, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    async function loadInventory() {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        const [inventoryResult, comparisonResult] = await Promise.allSettled([
          fetchData('/analytics/inventory-status'),
          fetchData('/vendor-products/price-comparison'),
        ]);

        const inventoryRes =
          inventoryResult.status === 'fulfilled' ? inventoryResult.value : null;
        const comparisonRes =
          comparisonResult.status === 'fulfilled' ? comparisonResult.value : null;

        const inventory = inventoryRes?.data;
        const comparison = comparisonRes?.data || [];

        const priceByProduct = new Map();
        comparison.forEach((item) => {
          const productId = item.product_id ?? item.productId;
          const price = item.final_price ?? item.finalPrice;
          if (productId == null || price == null) return;
          const current = priceByProduct.get(productId) || {
            min: Number.POSITIVE_INFINITY,
            max: Number.NEGATIVE_INFINITY,
          };
          priceByProduct.set(productId, {
            min: Math.min(current.min, price),
            max: Math.max(current.max, price),
          });
        });

        const productRows = (inventory?.products || []).map((p) => {
          const productId = p.product_id ?? p.productId;
          const productName = p.product_name ?? p.productName;
          const totalStock = p.total_stock ?? p.totalStock;
          const vendorsCarrying = p.vendors_carrying ?? p.vendorsCarrying;

          const priceInfo = priceByProduct.get(productId) || null;
          return {
            productId,
            productName,
            totalStockAllVendors: totalStock,
            numberOfVendors: vendorsCarrying,
            lowestPrice:
              priceInfo && isFinite(priceInfo.min) ? priceInfo.min : null,
            highestPrice:
              priceInfo && isFinite(priceInfo.max) ? priceInfo.max : null,
          };
        });

        dispatch(setItems(productRows));

        if (!inventoryRes || !comparisonRes) {
          dispatch(setError('Some inventory data is currently unavailable.'));
        }
      } catch (e) {
        console.error(e);
        dispatch(setError('Failed to load inventory.'));
      } finally {
        dispatch(setLoading(false));
      }
    }

    loadInventory();
  }, [dispatch]);

  const openStockManager = async (productRow) => {
    setSelectedProduct(productRow);
    setStockModalOpen(true);
    setStockLoading(true);
    setStockError('');
    setVendorStocks([]);
    setStockEdits({});
    setServerStockHistory([]);
    setServerHistoryLoading(false);
    setServerHistoryError('');

    try {
      const res = await fetchData('/vendor-products', {
        product_id: productRow.productId,
        is_available: true,
        page: 1,
        limit: 100,
      });

      const list = res?.data || [];
      const mapped = list
        .map((vp) => {
          const vendorProductId = vp.vendor_product_id ?? vp.vendorProductId;
          let vendorName = vp.vendor_name ?? vp.vendorName;
          if (!vendorName && vp.vendor) {
            vendorName = vp.vendor.vendor_name ?? vp.vendor.vendorName ?? vp.vendor.name;
          }
          const vendorId = vp.vendor_id ?? vp.vendorId ?? vp.vendor?.vendor_id ?? vp.vendor?.vendorId;
          if (!vendorName && vendorId != null) vendorName = `Vendor #${vendorId}`;

          const vendorSku = vp.vendor_sku ?? vp.vendorSku ?? vp.sku ?? vp.vendor?.sku ?? '';
          const stockQuantity = vp.stock_quantity ?? vp.stockQuantity ?? 0;

          return {
            vendorProductId,
            vendorId,
            vendorName,
            vendorSku,
            stockQuantity,
          };
        })
        .filter((v) => v.vendorProductId != null);

      setVendorStocks(mapped);

      if (mapped.length > 0) {
        try {
          setServerHistoryLoading(true);
          const allHistory = [];
          for (const v of mapped) {
            const historyRes = await fetchData(
              `/vendor-products/${v.vendorProductId}/stock-history`,
            );
            const rawList = Array.isArray(historyRes?.data)
              ? historyRes.data
              : Array.isArray(historyRes)
                ? historyRes
                : [];

            rawList.forEach((h) => {
              allHistory.push({
                vendorProductId: v.vendorProductId,
                vendorId: v.vendorId,
                vendorName: v.vendorName ?? `Vendor #${v.vendorProductId}`,
                vendorSku: v.vendorSku,
                previousQuantity: h.previous_quantity ?? h.previousQuantity ?? null,
                newQuantity: h.new_quantity ?? h.newQuantity ?? null,
                changeAmount: h.change_amount ?? h.changeAmount ?? null,
                changedAt: h.changed_at ?? h.changedAt ?? null,
              });
            });
          }

          allHistory.sort((a, b) => {
            const da = a.changedAt ? new Date(a.changedAt).getTime() : 0;
            const db = b.changedAt ? new Date(b.changedAt).getTime() : 0;
            return db - da;
          });

          setServerStockHistory(allHistory);
          setServerHistoryError('');
        } catch (historyErr) {
          console.error(historyErr);
          setServerHistoryError('Failed to load full stock history.');
        } finally {
          setServerHistoryLoading(false);
        }
      }
    } catch (e) {
      console.error(e);
      setStockError('Failed to load vendor stock for this product.');
    } finally {
      setStockLoading(false);
    }
  };

  const closeStockManager = () => {
    setStockModalOpen(false);
    setSelectedProduct(null);
    setVendorStocks([]);
    setStockEdits({});
    setStockError('');
    setServerStockHistory([]);
    setServerHistoryLoading(false);
    setServerHistoryError('');
  };

  const handleStockEditChange = (vendorProductId, value) => {
    setStockEdits((prev) => ({
      ...prev,
      [vendorProductId]: value,
    }));
  };

  const applyStockUpdates = async () => {
    if (!selectedProduct || vendorStocks.length === 0) {
      closeStockManager();
      return;
    }

    const updates = [];
    const changes = [];

    vendorStocks.forEach((v) => {
      const raw = stockEdits[v.vendorProductId];
      if (raw == null || raw === '') return;
      const nextQty = Number(raw);
      if (!Number.isFinite(nextQty) || nextQty < 0) return;
      if (nextQty === v.stockQuantity) return;
      updates.push({
        vendorProductId: v.vendorProductId,
        stockQuantity: nextQty,
      });
      changes.push({
        vendorName: v.vendorName,
        vendorSku: v.vendorSku,
        previous: v.stockQuantity,
        next: nextQty,
      });
    });

    if (updates.length === 0) {
      closeStockManager();
      return;
    }

    try {
      setStockLoading(true);
      setStockError('');

      await patchJson('/vendor-products/update-stock', { updates });

      const updatedVendorStocks = vendorStocks.map((v) => {
        const update = updates.find((u) => u.vendorProductId === v.vendorProductId);
        if (!update) return v;
        return { ...v, stockQuantity: update.stockQuantity };
      });
      setVendorStocks(updatedVendorStocks);

      const newTotal = updatedVendorStocks.reduce(
        (sum, v) => sum + (Number(v.stockQuantity) || 0),
        0,
      );

      dispatch(
        setItems(
          rows.map((r) =>
            r.productId === selectedProduct.productId
              ? { ...r, totalStockAllVendors: newTotal }
              : r,
          ),
        ),
      );

      setStockHistory((prev) => [
        {
          timestamp: new Date().toISOString(),
          productId: selectedProduct.productId,
          productName: selectedProduct.productName,
          changes,
        },
        ...prev,
      ]);

      setStockEdits({});
      setStockLoading(false);
      setStockError('');
      setStockModalOpen(false);
    } catch (e) {
      console.error(e);
      setStockError('Failed to update stock. Please try again.');
      setStockLoading(false);
    }
  };

  return (
    <div className="page inventory-page container">
      <PageHeader title="Inventory &amp; Stock" subtitle="Track available stock across vendors and identify high-demand items." />

      <div className="inventory-search">
        <input
          type="text"
          className="input"
          placeholder="Search by product name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        {loading && <p>Loading inventory...</p>}
        {error && !loading && <p className="error-message">{error}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Total Stock</th>
              <th>Vendors</th>
              <th>Lowest Price (₹)</th>
              <th>Highest Price (₹)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.productId}>
                <td>{row.productName}</td>
                <td>{row.totalStockAllVendors}</td>
                <td>{row.numberOfVendors}</td>
                <td>
                  {row.lowestPrice != null
                    ? row.lowestPrice.toFixed(2)
                    : '-'}
                </td>
                <td>
                  {row.highestPrice != null
                    ? row.highestPrice.toFixed(2)
                    : '-'}
                </td>
                <td>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => openStockManager(row)}
                  >
                    Manage stock
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
        totalItems={filteredRows.length}
        pageSize={PAGE_SIZE}
        entityLabel="products"
        onPageChange={setPage}
      />

      {stockHistory.length > 0 && (
        <section className="inventory-history">
          <h2>Stock change history (this session)</h2>
          <ul>
            {stockHistory.map((entry, index) => (
              <li key={`${entry.productId}-${index}`}>
                <div className="inventory-history-entry">
                  <div className="inventory-history-meta">
                    <span className="inventory-history-product">
                      {entry.productName}
                    </span>
                    <span className="inventory-history-timestamp">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <ul className="inventory-history-changes">
                    {entry.changes.map((change, idx) => (
                      <li key={`${change.vendorSku ?? change.vendorName}-${idx}`}>
                        {change.vendorName}
                        {change.vendorSku ? ` (${change.vendorSku})` : ''}: {change.previous} → {change.next}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stockModalOpen && (
        <div className="modal-backdrop" onClick={closeStockManager}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <h2>
              Manage stock — {selectedProduct?.productName}
            </h2>
            {stockLoading && <p>Loading vendor stock...</p>}
            {stockError && !stockLoading && (
              <p className="error-message">{stockError}</p>
            )}
            {!stockLoading && vendorStocks.length === 0 && !stockError && (
              <p>No vendor stock found for this product.</p>
            )}
            {!stockLoading && vendorStocks.length > 0 && (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>SKU</th>
                      <th>Current stock</th>
                      <th>New stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorStocks.map((v) => (
                      <tr key={v.vendorProductId}>
                        <td>{v.vendorName}{v.vendorId != null ? ` (${v.vendorId})` : ''}</td>
                        <td>{v.vendorSku}</td>
                        <td>{v.stockQuantity}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            className="input"
                            value={
                              stockEdits[v.vendorProductId] ?? v.stockQuantity
                            }
                            onChange={(e) =>
                              handleStockEditChange(
                                v.vendorProductId,
                                e.target.value,
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!stockLoading && (
              <section className="inventory-modal-history">
                <h3>Full stock history (all vendors)</h3>
                {serverHistoryLoading && (
                  <p>Loading stock history...</p>
                )}
                {serverHistoryError && !serverHistoryLoading && (
                  <p className="error-message">{serverHistoryError}</p>
                )}
                {!serverHistoryLoading &&
                  !serverHistoryError &&
                  serverStockHistory.length === 0 && (
                    <p>No historical stock changes recorded yet.</p>
                  )}
                {!serverHistoryLoading &&
                  !serverHistoryError &&
                  serverStockHistory.length > 0 && (
                    <ul className="inventory-modal-history-list">
                      {serverStockHistory.slice(0, 3).map((h, idx) => (
                        <li key={`${h.vendorProductId}-${idx}`}>
                          <div className="inventory-modal-history-entry">
                            <div className="inventory-modal-history-meta">
                              <span className="inventory-modal-history-vendor">
                                {h.vendorName}
                                {h.vendorId != null ? ` (${h.vendorId})` : ''}
                              </span>
                              <span className="inventory-modal-history-timestamp">
                                {h.changedAt
                                  ? new Date(h.changedAt).toLocaleString()
                                  : ''}
                              </span>
                            </div>
                            <div className="inventory-modal-history-change">
                              {h.previousQuantity} → {h.newQuantity}
                              {typeof h.changeAmount === 'number' &&
                                h.changeAmount !== 0 &&
                                ` (Δ ${h.changeAmount > 0 ? '+' : ''}${h.changeAmount})`}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
              </section>
            )}
            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={applyStockUpdates}
                disabled={stockLoading}
              >
                {stockLoading ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={closeStockManager}
                disabled={stockLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
