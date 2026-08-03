import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Scan, X, ArrowDownRight, ArrowUpRight, CheckCircle2, AlertCircle, 
  Volume2, VolumeX, Camera, RefreshCw, AlertTriangle, Package, Zap 
} from 'lucide-react';
import { Product, InventoryTransaction, QRPayload } from '../../types/inventory';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onStockIn: (productId: string, quantity: number, refNum: string, remarks?: string) => void;
  onStockOut: (productId: string, quantity: number, refNum: string, remarks?: string) => void;
  initialMode?: 'STOCK_IN' | 'STOCK_OUT';
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onStockIn,
  onStockOut,
  initialMode = 'STOCK_IN',
}) => {
  const [scanMode, setScanMode] = useState<'STOCK_IN' | 'STOCK_OUT'>(initialMode);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scannedRawText, setScannedRawText] = useState<string>('');
  
  // Form fields for transaction
  const [quantity, setQuantity] = useState<number>(10);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Scanner Hardware Controls
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraDevices, setCameraDevices] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [manualInput, setManualInput] = useState<string>('');

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = 'html5qr-code-full-region';

  // Sound Feedback Generator using Web Audio API
  const playBeep = (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime); // Low warning pitch
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn('Audio Context sound play error:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setScannedProduct(null);
      setErrorMsg('');
      setSuccessMsg('');
      setReferenceNumber(`${scanMode === 'STOCK_IN' ? 'PO' : 'SO'}-${Date.now().toString().slice(-6)}`);
      
      // Enumerate camera hardware devices
      Html5Qrcode.getCameras()
        .then(devices => {
          if (devices && devices.length > 0) {
            setCameraDevices(devices);
            setSelectedCameraId(devices[0].id);
          }
        })
        .catch(err => {
          console.warn('Unable to get cameras:', err);
        });
    } else {
      stopCamera();
    }
  }, [isOpen, scanMode]);

  const startCamera = async (cameraId?: string) => {
    const targetCamId = cameraId || selectedCameraId;
    if (!targetCamId) return;

    try {
      if (html5QrcodeRef.current) {
        await stopCamera();
      }

      const scanner = new Html5Qrcode(scannerRegionId);
      html5QrcodeRef.current = scanner;

      await scanner.start(
        targetCamId,
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // ignore scan errors per frame
        }
      );
      setCameraActive(true);
      setErrorMsg('');
    } catch (err: any) {
      console.error('Camera start failed:', err);
      setCameraActive(false);
      setErrorMsg('Camera access denied or device busy. You can use the manual code typist below.');
    }
  };

  const stopCamera = async () => {
    if (html5QrcodeRef.current && cameraActive) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      setCameraActive(false);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    setScannedRawText(decodedText);
    playBeep('success');

    // Parse JSON payload or fallback to SKU/Product Code match
    let matchedProduct: Product | undefined;

    try {
      const parsed: QRPayload = JSON.parse(decodedText);
      if (parsed.id || parsed.sku) {
        matchedProduct = products.find(p => p.id === parsed.id || p.sku.toUpperCase() === parsed.sku.toUpperCase());
      }
    } catch (e) {
      // Plain string scan match
      const clean = decodedText.trim().toUpperCase();
      matchedProduct = products.find(p => 
        p.sku.toUpperCase() === clean || 
        p.product_code.toUpperCase() === clean ||
        p.batch_number.toUpperCase() === clean
      );
    }

    if (matchedProduct) {
      setScannedProduct(matchedProduct);
      setErrorMsg('');
      setQuantity(10);
      setReferenceNumber(`${scanMode === 'STOCK_IN' ? 'PO' : 'SO'}-${Date.now().toString().slice(-6)}`);
    } else {
      setScannedProduct(null);
      setErrorMsg(`Unrecognized QR Code payload: "${decodedText}". Product not found in database.`);
      playBeep('error');
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScanSuccess(manualInput.trim());
  };

  const handleConfirmTransaction = () => {
    if (!scannedProduct) return;
    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      playBeep('error');
      return;
    }

    const currentStock = scannedProduct.current_stock ?? 0;

    if (scanMode === 'STOCK_OUT' && quantity > currentStock) {
      setErrorMsg(`CRITICAL INVENTORY RULE VIOLATION: Cannot Stock Out ${quantity} units! Available inventory is only ${currentStock} units.`);
      playBeep('error');
      return;
    }

    try {
      if (scanMode === 'STOCK_IN') {
        onStockIn(scannedProduct.id, quantity, referenceNumber, remarks);
        setSuccessMsg(`Successfully received +${quantity} units for "${scannedProduct.product_name}"!`);
      } else {
        onStockOut(scannedProduct.id, quantity, referenceNumber, remarks);
        setSuccessMsg(`Successfully dispatched -${quantity} units for "${scannedProduct.product_name}"!`);
      }

      playBeep('success');
      setScannedProduct(null);
      setRemarks('');
      
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Transaction failed.');
      playBeep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-modal border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150">
        
        {/* Modal Header & Mode Switcher */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">QR Barcode Scanner Station</h3>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
                title={soundEnabled ? 'Mute Audio Beep' : 'Enable Audio Beep'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">Scan QR codes for instant Stock In or Stock Out verification.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Selector Tabs */}
            <div className="bg-slate-200/80 p-1 rounded-lg flex items-center gap-1 text-xs font-semibold">
              <button
                onClick={() => { setScanMode('STOCK_IN'); setScannedProduct(null); }}
                className={`px-3 py-1 rounded-md transition-all ${
                  scanMode === 'STOCK_IN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stock In Mode (+)
              </button>

              <button
                onClick={() => { setScanMode('STOCK_OUT'); setScannedProduct(null); }}
                className={`px-3 py-1 rounded-md transition-all ${
                  scanMode === 'STOCK_OUT' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stock Out Mode (-)
              </button>
            </div>

            <button onClick={() => { stopCamera(); onClose(); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Camera Feed Viewport */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-brand-600" />
                  <span>Webcam Scanner Viewfinder</span>
                </span>

                {cameraDevices.length > 0 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      if (cameraActive) startCamera(e.target.value);
                    }}
                    className="text-[11px] px-2 py-0.5 bg-slate-100 border rounded text-slate-700 max-w-[150px] truncate"
                  >
                    {cameraDevices.map(d => (
                      <option key={d.id} value={d.id}>{d.label || `Camera ${d.id.slice(0, 5)}`}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Viewfinder Video Frame */}
              <div className="bg-slate-900 rounded-xl overflow-hidden min-h-[250px] relative border-2 border-slate-800 flex items-center justify-center">
                <div id={scannerRegionId} className="w-full h-full"></div>

                {!cameraActive && (
                  <div className="p-6 text-center text-slate-400 space-y-3">
                    <Scan className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                    <p className="text-xs text-slate-300">Camera is currently paused.</p>
                    <button
                      onClick={() => startCamera()}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Start Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Preset Selector for Testing without Camera */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Quick Testing Preset Barcode Selector
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {products.slice(0, 5).map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleScanSuccess(p.sku)}
                      className="px-2 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 font-mono text-[10px] rounded border border-slate-200"
                    >
                      {p.sku}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Scanned Product Action Card */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Product Verification Card
              </span>

              {!scannedProduct ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 space-y-2 bg-slate-50/50">
                  <Package className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No Product Scanned Yet</p>
                  <p className="text-[11px] text-slate-400">Position a QR code in front of the camera or click a test preset button.</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/40 space-y-4 animate-in fade-in duration-150">
                  
                  {/* Scanned Product Info */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-brand-100 text-brand-800 rounded border">
                        {scannedProduct.sku}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">Batch: {scannedProduct.batch_number}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-1">{scannedProduct.product_name}</h4>
                    <p className="text-xs text-slate-500">Generic: {scannedProduct.generic_name || 'N/A'}</p>
                  </div>

                  {/* Stock Stat Badge */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Current Calculated Inventory</span>
                      <span className="text-lg font-bold text-slate-900 font-mono">
                        {scannedProduct.current_stock ?? 0} <span className="text-xs font-normal text-slate-500">{scannedProduct.unit}</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px]">Unit Selling Price</span>
                      <span className="text-sm font-bold text-emerald-700 font-mono">
                        ${scannedProduct.selling_price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Transaction Quantity & Reference Form */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {scanMode === 'STOCK_IN' ? 'Stock In Quantity (+)' : 'Stock Out Quantity (-)'} *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={scanMode === 'STOCK_OUT' ? (scannedProduct.current_stock ?? 0) : 10000}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Number (PO/SO) *</label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Note</label>
                      <input
                        type="text"
                        placeholder="e.g. Dispensed to ER Ward"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleConfirmTransaction}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        scanMode === 'STOCK_IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      {scanMode === 'STOCK_IN' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      <span>Confirm {scanMode === 'STOCK_IN' ? 'Stock In (+)' : 'Stock Out (-)'}</span>
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>

          {/* Manual Code Typist Search */}
          <form onSubmit={handleManualSearch} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <input
              type="text"
              placeholder="Or manually type SKU, Barcode, or Batch number..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs"
            >
              Verify Code
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
