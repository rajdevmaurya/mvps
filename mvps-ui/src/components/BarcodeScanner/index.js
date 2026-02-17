import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner, Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';

const SCANNER_ID = 'barcode-scanner-view';

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
];

// Try scanning a canvas blob with ZXing via html5-qrcode
async function tryDecode(canvas, formats) {
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const file = new File([blob], 'frame.png', { type: 'image/png' });
  const tmp = new Html5Qrcode('barcode-snap-temp', { formatsToSupport: formats });
  try {
    const result = await tmp.scanFileV2(file, false);
    tmp.clear();
    return result;
  } catch (e) {
    tmp.clear();
    return null;
  }
}

function BarcodeScanner({ onDetected, onError, className }) {
  const scannerRef = useRef(null);
  const [lastCode, setLastCode] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [snapStatus, setSnapStatus] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);

  const onDetectedRef = useRef(onDetected);
  const onErrorRef = useRef(onError);
  const lastDetectedRef = useRef({ code: null, time: 0 });
  useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const handleDetection = useCallback((decodedText, format) => {
    // Deduplicate: ignore same barcode within 3 seconds
    const now = Date.now();
    if (decodedText === lastDetectedRef.current.code && now - lastDetectedRef.current.time < 3000) {
      return;
    }
    lastDetectedRef.current = { code: decodedText, time: now };

    console.log('[Scanner] DETECTED:', decodedText, '| format:', format);
    setLastCode(decodedText);
    setScanCount(c => c + 1);
    setSnapStatus(null);
    if (onDetectedRef.current) onDetectedRef.current(decodedText, { result: { format: { formatName: format } } });
  }, []);

  const captureAndScan = useCallback(async () => {
    const container = document.getElementById(SCANNER_ID);
    const video = container ? container.querySelector('video') : null;

    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      setSnapStatus('not_found');
      return;
    }

    setSnapStatus('scanning');
    const w = video.videoWidth;
    const h = video.videoHeight;
    console.log('[Scanner] Capturing frame:', w, 'x', h);

    // Try multiple processing passes — different filters help different barcode qualities
    const passes = [
      { label: 'raw', filter: 'none' },
      { label: 'high-contrast-bw', filter: 'contrast(2.0) brightness(1.1) saturate(0)' },
      { label: 'sharpen-bw', filter: 'contrast(3.0) brightness(1.2) saturate(0)' },
    ];

    for (const pass of passes) {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.filter = pass.filter;
      ctx.drawImage(video, 0, 0);

      // Show the last processed frame as preview
      setPreviewSrc(canvas.toDataURL('image/jpeg', 0.8));

      console.log('[Scanner] Trying pass:', pass.label);
      const result = await tryDecode(canvas, BARCODE_FORMATS);
      if (result) {
        const fmt = result.result?.format?.formatName || 'unknown';
        console.log('[Scanner] Found with pass:', pass.label, '| value:', result.decodedText);
        handleDetection(result.decodedText, 'capture-' + fmt);
        return;
      }
    }

    // Also try scanning just the center 50% crop (barcode likely in center)
    const cropCanvas = document.createElement('canvas');
    const cw = Math.floor(w * 0.6);
    const ch = Math.floor(h * 0.6);
    cropCanvas.width = cw;
    cropCanvas.height = ch;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.filter = 'contrast(2.5) saturate(0)';
    cropCtx.drawImage(video, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, cw, ch);

    console.log('[Scanner] Trying center crop:', cw, 'x', ch);
    const cropResult = await tryDecode(cropCanvas, BARCODE_FORMATS);
    if (cropResult) {
      const fmt = cropResult.result?.format?.formatName || 'unknown';
      console.log('[Scanner] Found with center crop | value:', cropResult.decodedText);
      handleDetection(cropResult.decodedText, 'capture-crop-' + fmt);
      return;
    }

    console.log('[Scanner] All passes failed — no barcode found');
    setSnapStatus('not_found');
    setTimeout(() => setSnapStatus(s => s === 'not_found' ? null : s), 3000);
  }, [handleDetection]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        SCANNER_ID,
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          formatsToSupport: BARCODE_FORMATS,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA, Html5QrcodeScanType.SCAN_TYPE_FILE],
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
          useBarCodeDetectorIfSupported: true,
          videoConstraints: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            focusMode: 'continuous',
            facingMode: 'environment',
          },
        },
        false
      );
      scannerRef.current = scanner;

      scanner.render(
        (decodedText, decodedResult) => {
          const format = decodedResult?.result?.format?.formatName || 'unknown';
          handleDetection(decodedText, format);
        },
        () => {}
      );

      console.log('[Scanner] Html5QrcodeScanner rendered');
    }, 100);

    return () => {
      clearTimeout(timerId);
      if (scannerRef.current) {
        try { scannerRef.current.clear(); } catch (e) { /* ignore */ }
        scannerRef.current = null;
      }
    };
  }, [handleDetection]);

  return (
    <div className={className} style={{ width: '100%' }}>
      <div id={SCANNER_ID} />
      <div id="barcode-snap-temp" style={{ display: 'none' }} />

      {/* Capture & Scan button */}
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <button
          onClick={captureAndScan}
          disabled={snapStatus === 'scanning'}
          style={{
            padding: '10px 24px',
            fontSize: 16,
            fontWeight: 'bold',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: snapStatus === 'scanning' ? 'wait' : 'pointer',
          }}
        >
          {snapStatus === 'scanning' ? 'Scanning...' : 'Capture & Scan'}
        </button>
        {snapStatus === 'not_found' && (
          <div style={{ color: '#e65100', fontSize: 13, marginTop: 6 }}>
            No barcode found — try holding the barcode closer / better lit and click again
          </div>
        )}
        <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
          Position barcode in camera view, then click to capture and scan
        </div>
      </div>

      {/* Preview of last captured frame — helps user see what camera actually sees */}
      {previewSrc && (
        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
            Last captured frame (what the decoder sees):
          </div>
          <img
            src={previewSrc}
            alt="Captured frame"
            style={{ maxWidth: '100%', maxHeight: 200, border: '1px solid #ccc', borderRadius: 4 }}
          />
        </div>
      )}

      {/* Detected value */}
      <div style={{
        marginTop: 12, padding: '16px 20px',
        background: lastCode ? '#1a1a2e' : '#f5f5f5',
        border: lastCode ? '3px solid #00ff00' : '1px solid #ddd',
        borderRadius: 8, textAlign: 'center', minHeight: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {lastCode ? (
          <div>
            <div style={{ color: '#00ff00', fontFamily: 'monospace', fontSize: 30, fontWeight: 'bold', letterSpacing: 2 }}>
              {lastCode}
            </div>
            <div style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>
              Scanned {scanCount} time{scanCount !== 1 ? 's' : ''}
            </div>
          </div>
        ) : (
          <span style={{ color: '#999', fontSize: 14 }}>
            Scan a barcode using camera or upload a barcode image
          </span>
        )}
      </div>
    </div>
  );
}

export default BarcodeScanner;
