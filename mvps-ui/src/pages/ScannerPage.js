import React, { useCallback, useRef, useState } from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import { fetchData, postJson } from '../apiClient';

function ScannerPage() {
  const [barcode, setBarcode] = useState(null);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);
  const [scans, setScans] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const lookupBarcode = useCallback(async (rawCode) => {
    const code = rawCode.trim();
    const apiPath = `/products/barcode/${encodeURIComponent(code)}`;
    console.log('[ScannerPage] lookupBarcode called — code:', code, '| API path:', apiPath);
    setBarcode(code);
    setError(null);
    setProduct(null);
    setOrderResult(null);
    setLookupLoading(true);
    try {
      const data = await fetchData(apiPath);
      console.log('[ScannerPage] API response:', JSON.stringify(data, null, 2));
      if (data && data.success && data.data) {
        console.log('[ScannerPage] Product found:', data.data.productName, '| ID:', data.data.productId);
        setProduct(data.data);
      } else {
        console.warn('[ScannerPage] No product in response:', data);
        setError('Product not found for barcode: ' + code);
      }
    } catch (e) {
      console.error('[ScannerPage] API error:', e.message || e);
      setError(e.message || 'Product lookup failed');
    } finally {
      setLookupLoading(false);
    }
  }, []);

  const onDetected = useCallback((code, result) => {
    console.log('[ScannerPage] Barcode detected:', code);
    if (code) setScans((s) => [...s, { code, at: new Date().toISOString() }]);
    // Use ref to check lock (avoids stale closure — Quagga holds old callback)
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    console.log('[ScannerPage] Sending to backend:', `/products/barcode/${code}`);
    lookupBarcode(code);
  }, [lookupBarcode]);

  const onError = useCallback((e) => {
    setError(String(e));
  }, []);

  const resetScan = () => {
    lockedRef.current = false;
    setLocked(false);
    setBarcode(null);
    setProduct(null);
    setError(null);
    setOrderResult(null);
  };

  const createOrder = async () => {
    if (!product) return;
    if (!customerId) {
      setError('Please enter a Customer ID before placing an order');
      return;
    }
    setOrdering(true);
    setOrderResult(null);
    setError(null);
    try {
      const payload = {
        customerId: parseInt(customerId, 10),
        items: [{ productId: product.productId, quantity }],
      };
      const res = await postJson('/orders', payload);
      setOrderResult(res);
    } catch (e) {
      setError(e.message || 'Order failed');
    } finally {
      setOrdering(false);
    }
  };

  const doManualLookup = async () => {
    const trimmed = manualCode.trim();
    if (!trimmed) return;
    console.log('[ScannerPage] Manual lookup:', trimmed);
    setLocked(true);
    lockedRef.current = true;
    lookupBarcode(trimmed);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Barcode Scanner</h2>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <BarcodeScanner onDetected={onDetected} onError={onError} />
          {/* Fallback barcode display below camera (always visible in document flow) */}
          {barcode && (
            <div style={{
              marginTop: 8, padding: '8px 12px', background: '#1a1a2e', color: '#00ff00',
              fontFamily: 'monospace', fontSize: 20, fontWeight: 'bold', borderRadius: 6, textAlign: 'center',
            }}>
              Scanned: {barcode}
            </div>
          )}
        </div>
        <div style={{ width: 400 }}>
          {/* Current scanned barcode */}
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong>Scanned:</strong> {barcode || '—'}
            {locked && (
              <button onClick={resetScan} style={{ marginLeft: 8, fontSize: 12 }}>
                Scan Again
              </button>
            )}
          </div>

          {/* Last detected value banner */}
          {scans.length > 0 && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e8f4fd', border: '1px solid #90caf9', borderRadius: 6, fontSize: 13 }}>
              <strong>Last detected:</strong>{' '}
              <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700 }}>
                {scans[scans.length - 1].code}
              </span>
              <span style={{ color: '#555', marginLeft: 8 }}>
                → will send to <code>/products/barcode/{scans[scans.length - 1].code}</code>
              </span>
            </div>
          )}

          {/* Scan history */}
          <div style={{ marginBottom: 12 }}>
            <strong>Scan History:</strong>
            <div style={{ maxHeight: 140, overflow: 'auto', marginTop: 6, background: '#fff', padding: 8, borderRadius: 4, border: '1px solid #eee' }}>
              {scans.length === 0 && <div style={{ color: '#999' }}>No scans yet</div>}
              {scans.map((s, idx) => (
                <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid #eee', fontSize: 13 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.code}</span>
                  <span style={{ fontSize: 11, color: '#666', marginLeft: 8 }}>{s.at}</span>
                </div>
              ))}
            </div>
            {scans.length > 0 && (
              <button onClick={() => setScans([])} style={{ marginTop: 4, fontSize: 12 }}>Clear History</button>
            )}
          </div>

          {/* Manual lookup */}
          <div style={{ marginBottom: 12 }}>
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doManualLookup()}
              placeholder="Enter barcode manually"
              style={{ width: '65%', padding: '4px 8px' }}
            />
            <button onClick={doManualLookup} disabled={lookupLoading} style={{ marginLeft: 8 }}>
              {lookupLoading ? 'Looking up...' : 'Lookup'}
            </button>
          </div>

          {/* Loading indicator */}
          {lookupLoading && <div style={{ color: '#555', marginBottom: 8 }}>Looking up product...</div>}

          {/* Error display */}
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

          {/* Product details */}
          {product ? (
            <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6, background: '#fafafa' }}>
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>{product.productName || 'Product'}</h3>
              {product.genericName && (
                <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>{product.genericName}</div>
              )}
              <div><strong>Product ID:</strong> {product.productId}</div>
              {product.manufacturer && <div><strong>Manufacturer:</strong> {product.manufacturer}</div>}
              {product.hsnCode && <div><strong>HSN Code:</strong> {product.hsnCode}</div>}
              {product.unitOfMeasure && <div><strong>Unit:</strong> {product.unitOfMeasure}</div>}
              {product.prescriptionRequired && (
                <div style={{ color: '#c00', marginTop: 4 }}>Prescription Required</div>
              )}

              {/* Order section */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #ddd' }}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Customer ID:</label>
                  <input
                    type="number"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="Enter customer ID"
                    style={{ width: '60%', padding: '4px 8px' }}
                  />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{ width: '60px', padding: '4px 8px' }}
                  />
                </div>
                <button onClick={createOrder} disabled={ordering}>
                  {ordering ? 'Placing Order...' : `Create Order (qty ${quantity})`}
                </button>
              </div>
            </div>
          ) : (
            !lookupLoading && <div style={{ color: '#666' }}>No product loaded. Scan a barcode or enter one manually.</div>
          )}

          {/* Order result */}
          {orderResult && (
            <div style={{ marginTop: 12, border: '1px solid #0a0', padding: 8, borderRadius: 6, background: '#f0fff0' }}>
              <strong>Order created successfully!</strong>
              {orderResult.data && orderResult.data.orderNumber && (
                <div style={{ marginTop: 4 }}>Order #: {orderResult.data.orderNumber}</div>
              )}
              {orderResult.data && orderResult.data.finalAmount != null && (
                <div>Total: ${orderResult.data.finalAmount}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScannerPage;
