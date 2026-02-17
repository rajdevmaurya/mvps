import React, { useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';

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

let scannerCounter = 0;

function BarcodeScanner({ onDetected, onError }) {
  const containerRef = useRef(null);
  const scannerRef = useRef(null);
  const idRef = useRef('scanner-' + (++scannerCounter));
  const onDetectedRef = useRef(onDetected);
  const lastCodeRef = useRef({ code: null, time: 0 });

  useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);

  const initScanner = useCallback(() => {
    if (scannerRef.current) return;
    const containerId = idRef.current;
    const el = document.getElementById(containerId);
    if (!el) {
      console.error('[Scanner] No element with id:', containerId);
      return;
    }

    console.log('[Scanner] Creating Html5QrcodeScanner for:', containerId);

    const scanner = new Html5QrcodeScanner(
      containerId,
      {
        fps: 10,
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

    scanner.render(
      (decodedText, decodedResult) => {
        // Dedup: skip same code within 3s
        const now = Date.now();
        if (decodedText === lastCodeRef.current.code && now - lastCodeRef.current.time < 3000) {
          // Still resume so scanner keeps running
          setTimeout(() => { try { scanner.resume(); } catch (e) {} }, 200);
          return;
        }
        lastCodeRef.current = { code: decodedText, time: now };

        const format = decodedResult?.result?.format?.formatName || 'unknown';
        console.log('[Scanner] DETECTED:', decodedText, '| format:', format);
        if (onDetectedRef.current) onDetectedRef.current(decodedText, decodedResult);

        // Auto-resume scanning for next barcode (POS continuous mode)
        setTimeout(() => {
          try { scanner.resume(); } catch (e) {}
          console.log('[Scanner] Resumed — ready for next scan');
        }, 500);
      },
      () => {} // ignore per-frame errors
    );

    scannerRef.current = scanner;
    console.log('[Scanner] Rendered successfully');
  }, []);

  useEffect(() => {
    // Small delay to ensure DOM is ready after React commit
    const timer = setTimeout(initScanner, 300);
    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try { scannerRef.current.clear(); } catch (e) { /* ok */ }
        scannerRef.current = null;
      }
    };
  }, [initScanner]);

  return (
    <div style={{ width: '100%' }}>
      <div id={idRef.current} ref={containerRef} style={{ minHeight: 300, background: '#000' }} />
    </div>
  );
}

export default BarcodeScanner;
