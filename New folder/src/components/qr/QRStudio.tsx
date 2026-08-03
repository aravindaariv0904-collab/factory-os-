import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Printer, Download, Settings, Grid, FileText, Check, Copy } from 'lucide-react';
import { Product, QRPrintConfig } from '../../types/inventory';
import QRCode from 'qrcode';

interface QRStudioProps {
  products: Product[];
}

export const QRStudio: React.FC<QRStudioProps> = ({ products }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [config, setConfig] = useState<QRPrintConfig>({
    labelSize: 'a4-24',
    includeLogo: true,
    includeProductName: true,
    includeSKU: true,
    includeBatch: true,
    includeExpiry: true,
    includePrice: true,
    copiesPerProduct: 24,
  });

  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [qrPngUrl, setQrPngUrl] = useState<string>('');
  const printContainerRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];

  useEffect(() => {
    if (selectedProduct) {
      const payload = JSON.stringify({
        id: selectedProduct.id,
        sku: selectedProduct.sku,
        name: selectedProduct.product_name,
        batch: selectedProduct.batch_number,
        exp: selectedProduct.expiry_date
      });

      // Generate PNG
      QRCode.toDataURL(payload, { width: 300, margin: 1 })
        .then(url => setQrPngUrl(url))
        .catch(console.error);

      // Generate SVG
      QRCode.toString(payload, { type: 'svg', margin: 1 })
        .then(svg => setQrSvgString(svg))
        .catch(console.error);
    }
  }, [selectedProduct]);

  const handlePrint = () => {
    window.print();
  };

  const downloadPNG = () => {
    if (!qrPngUrl || !selectedProduct) return;
    const a = document.createElement('a');
    a.href = qrPngUrl;
    a.download = `QR_${selectedProduct.sku}_${selectedProduct.batch_number}.png`;
    a.click();
  };

  const downloadSVG = () => {
    if (!qrSvgString || !selectedProduct) return;
    const blob = new Blob([qrSvgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${selectedProduct.sku}_${selectedProduct.batch_number}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Determine grid count based on labelSize
  const getGridCols = () => {
    switch (config.labelSize) {
      case 'thermal-50-30':
      case 'thermal-100-50':
      case 'a4-1': return 'grid-cols-1 max-w-sm mx-auto';
      case 'a4-4': return 'grid-cols-2';
      case 'a4-12': return 'grid-cols-3';
      case 'a4-24': return 'grid-cols-4';
      case 'a4-48': return 'grid-cols-6';
      default: return 'grid-cols-4';
    }
  };

  const getCopiesCount = () => {
    switch (config.labelSize) {
      case 'a4-1': return 1;
      case 'a4-4': return 4;
      case 'a4-12': return 12;
      case 'a4-24': return 24;
      case 'a4-48': return 48;
      default: return config.copiesPerProduct || 1;
    }
  };

  const totalCopies = getCopiesCount();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      
      {/* Control Bar Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <QrCode className="w-6 h-6 text-brand-600" />
            <span>QR Label Studio & Batch Printer</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure custom medical product barcode tags and print standard sheet layouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadPNG}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download PNG</span>
          </button>
          
          <button
            onClick={downloadSVG}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download SVG</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Label Sheet</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Configuration Sidebar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card space-y-5 no-print">
          
          {/* Product Select */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Target Pharmaceutical Item
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.product_name} ({p.sku}) - Batch: {p.batch_number}
                </option>
              ))}
            </select>
          </div>

          {/* Label Preset Layout */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Print Sheet Layout & Format
            </label>
            <select
              value={config.labelSize}
              onChange={(e) => setConfig(prev => ({ ...prev, labelSize: e.target.value as any }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="a4-24">A4 Sheet - 24 Labels (3x8 Grid Standard)</option>
              <option value="a4-48">A4 Sheet - 48 Micro Labels (4x12 Grid High Density)</option>
              <option value="a4-12">A4 Sheet - 12 Large Labels (3x4 Grid)</option>
              <option value="a4-4">A4 Sheet - 4 Quad Shipping Labels (2x2 Grid)</option>
              <option value="a4-1">Single Large Label Sheet</option>
              <option value="thermal-50-30">Thermal Printer Label (50mm x 30mm)</option>
              <option value="thermal-100-50">Thermal Printer Label (100mm x 50mm)</option>
            </select>
          </div>

          {/* Label Display Customizations */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Label Field Customization
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeLogo}
                onChange={(e) => setConfig(prev => ({ ...prev, includeLogo: e.target.checked }))}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Include MedStock Enterprise Logo</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeProductName}
                onChange={(e) => setConfig(prev => ({ ...prev, includeProductName: e.target.checked }))}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Include Product Brand Name</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeSKU}
                onChange={(e) => setConfig(prev => ({ ...prev, includeSKU: e.target.checked }))}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Include SKU Code</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeBatch}
                onChange={(e) => setConfig(prev => ({ ...prev, includeBatch: e.target.checked }))}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Include Batch Number</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeExpiry}
                onChange={(e) => setConfig(prev => ({ ...prev, includeExpiry: e.target.checked }))}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Include Expiry Date</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includePrice}
                onChange={(e) => setConfig(prev => ({ ...prev, includePrice: e.target.checked }))}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Include Selling Price ($)</span>
            </label>
          </div>

          {/* QR Payload Code Preview */}
          <div className="pt-3 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Embedded QR JSON Payload</span>
            <pre className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto">
{JSON.stringify({
  id: selectedProduct?.id,
  sku: selectedProduct?.sku,
  name: selectedProduct?.product_name,
  batch: selectedProduct?.batch_number,
  exp: selectedProduct?.expiry_date
}, null, 2)}
            </pre>
          </div>

        </div>

        {/* Right Column: Live Printable Sheet Preview */}
        <div className="lg:col-span-2 bg-slate-200/70 p-6 rounded-xl border border-slate-300 min-h-[600px] flex flex-col items-center justify-start overflow-y-auto">
          
          <div className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wider no-print">
            Live Print Preview Sheet ({totalCopies} Labels Output)
          </div>

          {/* Printable Page Container */}
          <div 
            ref={printContainerRef}
            className="bg-white p-6 rounded-lg shadow-card border border-slate-300 w-full max-w-[794px] min-h-[1050px] print-container"
          >
            <div className={`grid gap-3 ${getGridCols()}`}>
              {Array.from({ length: totalCopies }).map((_, index) => (
                <div 
                  key={index}
                  className="p-2.5 border border-slate-900/30 rounded-lg flex flex-col items-center justify-between text-center bg-white break-inside-avoid"
                  style={{ minHeight: config.labelSize.includes('thermal') ? '120px' : '110px' }}
                >
                  {config.includeLogo && (
                    <div className="text-[9px] font-bold tracking-tight text-slate-800 uppercase flex items-center gap-1 border-b border-slate-200 pb-0.5 w-full justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
                      <span>MEDSTOCK ERP</span>
                    </div>
                  )}

                  <div className="my-1">
                    {qrPngUrl ? (
                      <img src={qrPngUrl} alt="QR Code" className="w-20 h-20 mx-auto" />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                        [QR]
                      </div>
                    )}
                  </div>

                  <div className="w-full space-y-0.5 text-slate-900">
                    {config.includeProductName && (
                      <div className="text-[10px] font-bold truncate leading-tight">
                        {selectedProduct?.product_name}
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-2 text-[9px] font-mono font-semibold">
                      {config.includeSKU && <span>{selectedProduct?.sku}</span>}
                      {config.includeBatch && <span>B:{selectedProduct?.batch_number}</span>}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[8px] text-slate-600">
                      {config.includeExpiry && <span>EXP: {selectedProduct?.expiry_date}</span>}
                      {config.includePrice && <span className="font-bold font-mono">${selectedProduct?.selling_price.toFixed(2)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
