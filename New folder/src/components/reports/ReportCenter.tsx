import React, { useState } from 'react';
import { FileSpreadsheet, Printer, Download, FileText, ShieldAlert, Calendar, Building, Layers } from 'lucide-react';
import { Product, InventoryTransaction, Category, Manufacturer, Supplier } from '../../types/inventory';
import jsPDF from 'jspdf';

interface ReportCenterProps {
  products: Product[];
  transactions: InventoryTransaction[];
  categories: Category[];
  manufacturers: Manufacturer[];
  suppliers: Supplier[];
}

export const ReportCenter: React.FC<ReportCenterProps> = ({
  products,
  transactions,
  categories,
  manufacturers,
  suppliers,
}) => {
  const [activeReport, setActiveReport] = useState<'inventory' | 'low_stock' | 'expiry' | 'transactions' | 'suppliers'>('inventory');

  const generatePDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MedStock Enterprise Medical Inventory Report', 14, 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated On: ${today} | System Admin`, 14, 28);
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    let startY = 40;

    if (activeReport === 'inventory') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Current Inventory Master Summary', 14, startY);
      startY += 10;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('SKU | Product Name | Category | Stock | Expiry | Status', 14, startY);
      startY += 6;

      doc.setFont('helvetica', 'normal');
      products.slice(0, 30).forEach((p) => {
        const line = `${p.sku.padEnd(12)} | ${p.product_name.slice(0, 20).padEnd(22)} | ${p.current_stock ?? 0} ${p.unit} | ${p.expiry_date} | ${p.calculated_status}`;
        doc.text(line, 14, startY);
        startY += 6;
        if (startY > 270) {
          doc.addPage();
          startY = 20;
        }
      });
    } else if (activeReport === 'low_stock') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Critical Low Stock Alert Report', 14, startY);
      startY += 10;

      const lowStockItems = products.filter(p => p.calculated_status === 'LOW_STOCK' || p.calculated_status === 'OUT_OF_STOCK');
      doc.setFontSize(9);
      lowStockItems.forEach(p => {
        doc.text(`${p.sku} - ${p.product_name} | Stock: ${p.current_stock}/${p.minimum_stock} | Mfr: ${p.manufacturer_name}`, 14, startY);
        startY += 6;
      });
    } else if (activeReport === 'expiry') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Expiry Risk & Rotational Schedule', 14, startY);
      startY += 10;

      const expiryItems = products.filter(p => p.calculated_status === 'EXPIRING_SOON' || p.calculated_status === 'EXPIRED');
      doc.setFontSize(9);
      expiryItems.forEach(p => {
        doc.text(`${p.sku} - ${p.product_name} | Exp: ${p.expiry_date} | Batch: ${p.batch_number} | Status: ${p.calculated_status}`, 14, startY);
        startY += 6;
      });
    }

    doc.save(`MedStock_${activeReport}_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-brand-600" />
            <span>Enterprise PDF Reports & Analytics Center</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate printable regulatory audit sheets, low stock lists, and supplier reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report Page</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 no-print">
        
        <button
          onClick={() => setActiveReport('inventory')}
          className={`p-3 rounded-xl border text-left font-semibold text-xs transition-all flex items-center gap-2 ${
            activeReport === 'inventory' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4 text-brand-400" />
          <span>1. Inventory Summary</span>
        </button>

        <button
          onClick={() => setActiveReport('low_stock')}
          className={`p-3 rounded-xl border text-left font-semibold text-xs transition-all flex items-center gap-2 ${
            activeReport === 'low_stock' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>2. Low Stock Alerts</span>
        </button>

        <button
          onClick={() => setActiveReport('expiry')}
          className={`p-3 rounded-xl border text-left font-semibold text-xs transition-all flex items-center gap-2 ${
            activeReport === 'expiry' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4 text-purple-400" />
          <span>3. Expiry Risk Analysis</span>
        </button>

        <button
          onClick={() => setActiveReport('transactions')}
          className={`p-3 rounded-xl border text-left font-semibold text-xs transition-all flex items-center gap-2 ${
            activeReport === 'transactions' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>4. Audit Movement Log</span>
        </button>

        <button
          onClick={() => setActiveReport('suppliers')}
          className={`p-3 rounded-xl border text-left font-semibold text-xs transition-all flex items-center gap-2 ${
            activeReport === 'suppliers' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4 text-blue-400" />
          <span>5. Supplier Summary</span>
        </button>

      </div>

      {/* Printable Report Preview Canvas */}
      <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-card print-container space-y-6">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">MedStock Enterprise Logistics</h1>
            <p className="text-xs text-slate-600 font-medium">Medical & Pharmaceutical Inventory Management Platform</p>
          </div>

          <div className="text-right text-xs text-slate-500 font-mono">
            <div>Report Date: <strong>{new Date().toLocaleDateString()}</strong></div>
            <div>Status: <span className="text-emerald-600 font-bold">Verified Audit Output</span></div>
          </div>
        </div>

        {/* Report Content based on active choice */}
        {activeReport === 'inventory' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">1. Master Inventory & Stock Status Summary</h3>
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-300">
                <tr>
                  <th className="p-2 border">SKU</th>
                  <th className="p-2 border">Product Name</th>
                  <th className="p-2 border">Category</th>
                  <th className="p-2 border">Batch</th>
                  <th className="p-2 border text-center">Available Stock</th>
                  <th className="p-2 border text-right">Selling Price</th>
                  <th className="p-2 border text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="p-2 border font-mono font-bold">{p.sku}</td>
                    <td className="p-2 border font-bold">{p.product_name}</td>
                    <td className="p-2 border">{p.category_name}</td>
                    <td className="p-2 border font-mono">{p.batch_number}</td>
                    <td className="p-2 border text-center font-bold font-mono">{p.current_stock ?? 0} {p.unit}</td>
                    <td className="p-2 border text-right font-mono">${p.selling_price.toFixed(2)}</td>
                    <td className="p-2 border text-center font-semibold">{p.calculated_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'low_stock' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 text-amber-700">2. Critical Re-Order & Low Stock Report</h3>
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-amber-50 text-amber-900 font-bold uppercase border-b border-slate-300">
                <tr>
                  <th className="p-2 border">SKU</th>
                  <th className="p-2 border">Product Name</th>
                  <th className="p-2 border">Manufacturer</th>
                  <th className="p-2 border text-center">Current Stock</th>
                  <th className="p-2 border text-center">Minimum Threshold</th>
                  <th className="p-2 border text-center">Deficit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.filter(p => p.calculated_status === 'LOW_STOCK' || p.calculated_status === 'OUT_OF_STOCK').map(p => (
                  <tr key={p.id}>
                    <td className="p-2 border font-mono font-bold">{p.sku}</td>
                    <td className="p-2 border font-bold">{p.product_name}</td>
                    <td className="p-2 border">{p.manufacturer_name}</td>
                    <td className="p-2 border text-center font-bold text-amber-700 font-mono">{p.current_stock ?? 0}</td>
                    <td className="p-2 border text-center font-mono">{p.minimum_stock}</td>
                    <td className="p-2 border text-center font-bold text-red-600 font-mono">
                      -{Math.max(0, p.minimum_stock - (p.current_stock ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'expiry' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 text-purple-700">3. Expiry Risk & Stock Rotation Schedule</h3>
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-purple-50 text-purple-900 font-bold uppercase border-b border-slate-300">
                <tr>
                  <th className="p-2 border">SKU</th>
                  <th className="p-2 border">Product Name</th>
                  <th className="p-2 border">Batch #</th>
                  <th className="p-2 border">Expiry Date</th>
                  <th className="p-2 border text-center">Stock</th>
                  <th className="p-2 border text-center">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.filter(p => p.calculated_status === 'EXPIRING_SOON' || p.calculated_status === 'EXPIRED').map(p => (
                  <tr key={p.id}>
                    <td className="p-2 border font-mono font-bold">{p.sku}</td>
                    <td className="p-2 border font-bold">{p.product_name}</td>
                    <td className="p-2 border font-mono">{p.batch_number}</td>
                    <td className="p-2 border font-semibold">{p.expiry_date}</td>
                    <td className="p-2 border text-center font-mono font-bold">{p.current_stock ?? 0}</td>
                    <td className="p-2 border text-center font-bold">
                      {p.calculated_status === 'EXPIRED' ? (
                        <span className="text-red-700 uppercase">Expired (Quarantine)</span>
                      ) : (
                        <span className="text-purple-700 uppercase">Critical Rotation</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Audit Stamp */}
        <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>MedStock Enterprise Inventory ERP System v1.0</span>
          <span>Authorized Official Stamp & Signature: _______________________</span>
        </div>

      </div>

    </div>
  );
};
