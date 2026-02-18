import { useCallback, useRef, useState, useMemo } from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import { fetchData, postJson } from '../apiClient';

const GST_RATE = 18;

function ScannerPage() {
  const [items, setItems] = useState([]);
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerName, setCustomerName] = useState('');

  const [error, setError] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scans, setScans] = useState([]);
  const [ordering, setOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [lastBarcode, setLastBarcode] = useState(null);

  const lastLookupRef = useRef(null);

  // ---- Calculations ----
  const { subtotal, totalDiscount, taxAmount, grandTotal } = useMemo(() => {
    let sub = 0;
    let disc = 0;
    items.forEach(item => {
      const lineGross = item.price * item.quantity;
      const lineDisc = lineGross * (item.discountPct / 100);
      sub += lineGross;
      disc += lineDisc;
    });
    const afterDiscount = sub - disc;
    const tax = afterDiscount * (GST_RATE / 100);
    return { subtotal: sub, totalDiscount: disc, taxAmount: tax, grandTotal: afterDiscount + tax };
  }, [items]);

  // ---- Auto-lookup customer name when mobile number is entered ----
  const autoLookupCustomer = useCallback(async (phone) => {
    const trimmed = phone.trim();
    if (trimmed.length < 10) return;
    try {
      const data = await fetchData(`/customers/phone/${encodeURIComponent(trimmed)}`);
      if (data && data.success && data.data) {
        setCustomerName(data.data.customerName || '');
      }
    } catch (_) {
      // Not found — user can type name manually
    }
  }, []);

  // ---- Barcode lookup & add to invoice ----
  const lookupAndAdd = useCallback(async (rawCode) => {
    const code = rawCode.trim();
    if (!code) return;

    if (lastLookupRef.current === code) return;
    lastLookupRef.current = code;
    setTimeout(() => { if (lastLookupRef.current === code) lastLookupRef.current = null; }, 2000);

    setLastBarcode(code);
    setError(null);
    setLookupLoading(true);

    try {
      const data = await fetchData(`/products/barcode/${encodeURIComponent(code)}`);
      console.log('[POS] API response for', code, ':', JSON.stringify(data, null, 2));
      if (data && data.success && data.data) {
        const p = data.data;
        setItems(prev => {
          const existing = prev.find(i => i.productId === p.productId);
          if (existing) {
            return prev.map(i => i.productId === p.productId ? { ...i, quantity: i.quantity + 1 } : i);
          }
          return [...prev, {
            productId: p.productId,
            productName: p.productName || 'Unknown',
            genericName: p.genericName || '',
            manufacturer: p.manufacturer || '',
            unitOfMeasure: p.unitOfMeasure || '',
            price: parseFloat(p.price) || 0,
            mrp: parseFloat(p.mrp) || 0,
            discountPct: parseFloat(p.discountPercentage) || 0,
            vendorProductId: p.vendorProductId || null,
            quantity: 1,
            prescriptionRequired: p.prescriptionRequired || false,
          }];
        });
      } else {
        setError('Product not found for barcode: ' + code);
      }
    } catch (e) {
      setError(e.message || 'Product lookup failed');
    } finally {
      setLookupLoading(false);
    }
  }, []);

  const onDetected = useCallback((code, result) => {
    console.log('[POS] onDetected fired — code:', code);
    if (code) {
      setScans(s => [...s, { code, at: new Date().toLocaleTimeString() }]);
      lookupAndAdd(code);
    }
  }, [lookupAndAdd]);

  const onError = useCallback((e) => setError(String(e)), []);

  // ---- Item actions ----
  const updateQty = (productId, delta) => {
    setItems(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      return { ...i, quantity: Math.max(1, i.quantity + delta) };
    }));
  };

  const updatePrice = (productId, value) => {
    const price = Math.max(0, parseFloat(value) || 0);
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, price } : i));
  };

  const updateDiscount = (productId, value) => {
    const pct = Math.min(100, Math.max(0, parseFloat(value) || 0));
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, discountPct: pct } : i));
  };

  const removeItem = (productId) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const clearAll = () => {
    setItems([]);
    setMobileNumber('');
    setCustomerName('');
    setError(null);
    setOrderResult(null);
    setScans([]);
    setLastBarcode(null);
  };

  // ---- Place order ----
  const placeOrder = async () => {
    if (items.length === 0) { setError('Add at least one product'); return; }
    const phone = mobileNumber.trim();
    if (!phone) { setError('Please enter a mobile number'); return; }
    setOrdering(true);
    setError(null);
    setOrderResult(null);
    try {
      let customerId;

      // Try to find existing customer by phone
      try {
        const custData = await fetchData(`/customers/phone/${encodeURIComponent(phone)}`);
        if (custData && custData.success && custData.data) {
          customerId = custData.data.customerId;
        }
      } catch (_) {
        // Customer not found — auto-create
      }

      // If not found, create a new customer
      if (!customerId) {
        const name = customerName.trim() || 'Walk-in Customer';
        const newCust = await postJson('/customers', {
          customerName: name,
          phone: phone,
          customerType: 'retail',
          isActive: true,
        });
        if (newCust && newCust.success && newCust.data) {
          customerId = newCust.data.customerId;
        } else {
          setError('Failed to create customer');
          setOrdering(false);
          return;
        }
      }

      const payload = {
        customerId,
        orderType: 'door_to_door',
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          ...(i.vendorProductId ? { vendorProductId: i.vendorProductId } : {}),
        })),
      };
      const res = await postJson('/orders', payload);
      setOrderResult(res);
    } catch (e) {
      setError(e.message || 'Order failed');
    } finally {
      setOrdering(false);
    }
  };

  const printInvoice = () => window.print();

  const doManualLookup = () => {
    const trimmed = manualCode.trim();
    if (!trimmed) return;
    lookupAndAdd(trimmed);
    setManualCode('');
  };

  const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <>
      <style>{`
        @media print {
          .scanner-col, .scan-history, .action-bar, .manual-lookup, .error-bar, .order-success { display: none !important; }
          .pos-page { padding: 0 !important; }
          .pos-layout { display: block !important; }
          .invoice-col { width: 100% !important; min-width: 100% !important; border: none !important; box-shadow: none !important; }
          .invoice-header-print { display: block !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @media screen { .invoice-header-print { display: none !important; } }
      `}</style>

      <div className="pos-page" style={styles.page}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>POS Billing</h2>
          <div style={styles.headerRight}>
            <span style={styles.headerDate}>{today}</span>
            <span style={styles.headerInvoice}>{invoiceNo}</span>
          </div>
        </div>

        <div className="pos-layout" style={styles.layout}>
          {/* ====== LEFT: Scanner ====== */}
          <div className="scanner-col" style={styles.scannerCol}>
            <BarcodeScanner onDetected={onDetected} onError={onError} />

            {lastBarcode && (
              <div style={styles.lastBarcode}>
                Scanned: <strong>{lastBarcode}</strong>
              </div>
            )}

            <div className="manual-lookup" style={styles.manualLookup}>
              <input
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doManualLookup()}
                placeholder="Enter barcode manually"
                style={styles.manualInput}
              />
              <button onClick={doManualLookup} disabled={lookupLoading} style={styles.lookupBtn}>
                {lookupLoading ? 'Looking up...' : 'Add'}
              </button>
            </div>

            <div className="scan-history" style={styles.scanHistory}>
              <div style={styles.scanHistoryTitle}>
                Scan History ({scans.length})
                {scans.length > 0 && (
                  <button onClick={() => setScans([])} style={styles.clearHistoryBtn}>Clear</button>
                )}
              </div>
              <div style={styles.scanHistoryList}>
                {scans.length === 0 && <div style={{ color: '#999', fontSize: 12 }}>No scans yet</div>}
                {scans.slice().reverse().slice(0, 10).map((s, idx) => (
                  <div key={idx} style={styles.scanHistoryItem}>
                    <span style={styles.scanCode}>{s.code}</span>
                    <span style={styles.scanTime}>{s.at}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ====== RIGHT: Invoice ====== */}
          <div className="invoice-col" style={styles.invoiceCol}>
            <div className="invoice-header-print" style={styles.printHeader}>
              <h2 style={{ margin: 0, color: '#00372c' }}>Echo Healthcare</h2>
              <div style={{ fontSize: 12, color: '#666' }}>Invoice: {invoiceNo} | Date: {today}</div>
              {(mobileNumber || customerName) && (
                <div style={{ fontSize: 12, color: '#333', marginTop: 4 }}>
                  {customerName && <span>Customer: {customerName}</span>}
                  {mobileNumber && <span> | Mobile: {mobileNumber}</span>}
                </div>
              )}
            </div>

            {/* Customer info */}
            <div style={styles.customerRow}>
              <div style={styles.customerField}>
                <label style={styles.label}>Mobile Number</label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={e => {
                    const val = e.target.value;
                    setMobileNumber(val);
                    if (val.trim().length >= 10) autoLookupCustomer(val);
                  }}
                  onBlur={() => autoLookupCustomer(mobileNumber)}
                  placeholder="Enter mobile number"
                  style={{ ...styles.custInput, width: 180 }}
                />
              </div>
              <div style={{ ...styles.customerField, flex: 1 }}>
                <label style={styles.label}>Customer Name</label>
                <input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  style={{ ...styles.custInput, width: '100%' }}
                />
              </div>
            </div>

            {error && <div className="error-bar" style={styles.errorBar}>{error}</div>}

            {/* Invoice table — NO HSN column */}
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th style={{ ...styles.th, width: 36 }}>#</th>
                    <th style={styles.th}>Product</th>
                    <th style={{ ...styles.th, width: 90, textAlign: 'right' }}>MRP (₹)</th>
                    <th style={{ ...styles.th, width: 100, textAlign: 'right' }}>Price (₹)</th>
                    <th style={{ ...styles.th, width: 110, textAlign: 'center' }}>Qty</th>
                    <th style={{ ...styles.th, width: 80, textAlign: 'center' }}>Disc %</th>
                    <th style={{ ...styles.th, width: 100, textAlign: 'right' }}>Total (₹)</th>
                    <th style={{ ...styles.th, width: 36 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={8} style={styles.emptyRow}>
                        Scan a barcode or enter one manually to add products
                      </td>
                    </tr>
                  )}
                  {items.map((item, idx) => {
                    const lineTotal = item.price * item.quantity * (1 - item.discountPct / 100);
                    return (
                      <tr key={item.productId} style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                        <td style={styles.td}>{idx + 1}</td>
                        <td style={styles.td}>
                          <div style={styles.productName}>{item.productName}</div>
                          {item.genericName && <div style={styles.genericName}>{item.genericName}</div>}
                          {item.manufacturer && <div style={{ fontSize: 10, color: '#aaa' }}>{item.manufacturer}</div>}
                          {item.prescriptionRequired && <span style={styles.rxBadge}>Rx</span>}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace', color: '#888', fontSize: 12 }}>
                          {item.mrp > 0 ? item.mrp.toFixed(2) : '—'}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={e => updatePrice(item.productId, e.target.value)}
                            style={styles.priceInput}
                          />
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <div style={styles.qtyControls}>
                            <button onClick={() => updateQty(item.productId, -1)} style={styles.qtyBtn}>−</button>
                            <span style={styles.qtyValue}>{item.quantity}</span>
                            <button onClick={() => updateQty(item.productId, 1)} style={styles.qtyBtn}>+</button>
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPct}
                            onChange={e => updateDiscount(item.productId, e.target.value)}
                            style={styles.discountInput}
                          />
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>
                          {lineTotal.toFixed(2)}
                        </td>
                        <td style={styles.td}>
                          <button onClick={() => removeItem(item.productId)} style={styles.removeBtn} title="Remove">
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={styles.totalsBox}>
              <div style={styles.totalRow}>
                <span>Subtotal</span>
                <span style={styles.totalValue}>₹{subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div style={{ ...styles.totalRow, color: '#e65100' }}>
                  <span>Discount</span>
                  <span style={styles.totalValue}>-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div style={styles.totalRow}>
                <span>GST ({GST_RATE}%)</span>
                <span style={styles.totalValue}>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div style={styles.grandTotalRow}>
                <span>Grand Total</span>
                <span style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</span>
              </div>
              <div style={styles.itemCount}>
                {items.length} item{items.length !== 1 ? 's' : ''} | {items.reduce((s, i) => s + i.quantity, 0)} unit{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
              </div>
            </div>

            {orderResult && (
              <div className="order-success" style={styles.orderSuccess}>
                <strong>Order placed successfully!</strong>
                {orderResult.data?.orderNumber && <span> | Order #: {orderResult.data.orderNumber}</span>}
                {orderResult.data?.finalAmount != null && <span> | Total: ₹{orderResult.data.finalAmount}</span>}
              </div>
            )}

            <div className="action-bar" style={styles.actionBar}>
              <button onClick={clearAll} style={styles.clearBtn}>Clear All</button>
              <button onClick={printInvoice} disabled={items.length === 0} style={styles.printBtn}>
                Print Invoice
              </button>
              <button onClick={placeOrder} disabled={ordering || items.length === 0} style={styles.orderBtn}>
                {ordering ? 'Placing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: { padding: 16, fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', background: '#f5f6fa' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #00372c' },
  headerTitle: { margin: 0, fontSize: 22, color: '#00372c', fontWeight: 700 },
  headerRight: { display: 'flex', gap: 16, alignItems: 'center' },
  headerDate: { fontSize: 13, color: '#666' },
  headerInvoice: { fontSize: 13, fontFamily: 'monospace', background: '#e8f5e9', padding: '2px 8px', borderRadius: 4, color: '#2e7d32' },
  layout: { display: 'flex', gap: 20, alignItems: 'flex-start' },
  scannerCol: { width: '38%', minWidth: 340 },
  lastBarcode: { marginTop: 8, padding: '6px 12px', background: '#1a1a2e', color: '#00ff00', fontFamily: 'monospace', fontSize: 16, borderRadius: 6, textAlign: 'center' },
  manualLookup: { display: 'flex', gap: 8, marginTop: 12 },
  manualInput: { flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14 },
  lookupBtn: { padding: '8px 16px', background: '#00372c', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  scanHistory: { marginTop: 16, background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: 12 },
  scanHistoryTitle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#333' },
  clearHistoryBtn: { fontSize: 11, color: '#999', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' },
  scanHistoryList: { maxHeight: 120, overflow: 'auto' },
  scanHistoryItem: { display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f0f0f0', fontSize: 12 },
  scanCode: { fontFamily: 'monospace', fontWeight: 600 },
  scanTime: { color: '#999' },
  invoiceCol: { flex: 1, background: '#fff', borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: 20, minWidth: 500 },
  printHeader: { marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #00372c', textAlign: 'center' },
  customerRow: { display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-end' },
  customerField: { display: 'flex', flexDirection: 'column', gap: 4 },
  customerInfo: { padding: '8px 14px', background: '#e8f5e9', borderRadius: 8, border: '1px solid #a5d6a7', minWidth: 180 },
  label: { fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 },
  custInput: { padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, width: 180 },
  errorBar: { background: '#fff3f0', color: '#c00', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12, border: '1px solid #ffcdd2' },
  tableWrap: { overflowX: 'auto', marginBottom: 0 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  tableHead: { background: '#00372c' },
  th: { padding: '10px 8px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' },
  td: { padding: '10px 8px', borderBottom: '1px solid #eee', verticalAlign: 'middle' },
  rowEven: { background: '#fff' },
  rowOdd: { background: '#fafbfc' },
  emptyRow: { textAlign: 'center', padding: 32, color: '#aaa', fontSize: 14 },
  productName: { fontWeight: 600, color: '#222' },
  genericName: { fontSize: 11, color: '#888', marginTop: 2 },
  rxBadge: { display: 'inline-block', fontSize: 10, fontWeight: 700, color: '#c00', background: '#ffebee', padding: '1px 6px', borderRadius: 3, marginTop: 2 },
  qtyControls: { display: 'inline-flex', alignItems: 'center', gap: 0, border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden' },
  qtyBtn: { width: 28, height: 28, border: 'none', background: '#f0f0f0', cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qtyValue: { width: 32, textAlign: 'center', fontWeight: 600, fontSize: 14, fontFamily: 'monospace' },
  priceInput: { width: 75, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, textAlign: 'right', fontSize: 13, fontFamily: 'monospace' },
  discountInput: { width: 55, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, textAlign: 'center', fontSize: 13 },
  removeBtn: { background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 16, padding: 4 },
  totalsBox: { borderTop: '2px solid #e0e0e0', marginTop: 0, padding: '16px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontSize: 14 },
  totalValue: { fontFamily: 'monospace', fontWeight: 500 },
  grandTotalRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 8px', fontSize: 20, fontWeight: 700, color: '#00372c', borderTop: '2px solid #00372c', marginTop: 8 },
  grandTotalValue: { fontFamily: 'monospace' },
  itemCount: { textAlign: 'right', fontSize: 12, color: '#888', padding: '4px 8px' },
  orderSuccess: { background: '#e8f5e9', color: '#2e7d32', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginTop: 12, border: '1px solid #a5d6a7' },
  actionBar: { display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' },
  clearBtn: { padding: '10px 20px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', color: '#666', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  printBtn: { padding: '10px 20px', border: 'none', borderRadius: 6, background: '#1565c0', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  orderBtn: { padding: '10px 24px', border: 'none', borderRadius: 6, background: '#00372c', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
};

export default ScannerPage;
