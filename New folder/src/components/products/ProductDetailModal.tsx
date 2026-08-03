import React, { useState } from 'react';
import { X, QrCode, Download, Printer, ArrowDownRight, ArrowUpRight, Calendar, Package, Tag, Building, Factory, DollarSign, Boxes, Edit3, Copy, Trash2 } from 'lucide-react';
import { Product, InventoryTransaction } from '../../types/inventory';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  transactions: InventoryTransaction[];
  onStockIn: (product: Product) => void;
  onStockOut: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  transactions,
  onStockIn,
  onStockOut,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  if (!isOpen || !product) return null;

  const productTx = transactions.filter(t => t.product_id === product.id);
  const stock = product.current_stock ?? 0;

  const downloadQR = () => {
    if (!product.qr_code) return;
    const a = document.createElement('a');
    a.href = product.qr_code;
    a.download = `QR_${product.sku}_${product.batch_number}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-modal border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-100 text-brand-700 font-bold">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{product.product_name}</h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border">
                  {product.sku}
                </span>
              </div>
              <p className="text-xs text-slate-500">Generic Name: {product.generic_name || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(product)} title="Edit Product" className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={() => onDuplicate(product)} title="Duplicate Product" className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(product)} title="Delete Product" className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Current Stock</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{stock} <span className="text-xs font-normal text-slate-500">{product.unit}</span></div>
              <span className="text-[10px] text-slate-500">Min stock: {product.minimum_stock}</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Selling Price</span>
              <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">${product.selling_price.toFixed(2)}</div>
              <span className="text-[10px] text-emerald-600">Cost: ${product.purchase_price.toFixed(2)}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Batch Number</span>
              <div className="text-lg font-bold text-slate-900 font-mono mt-1">{product.batch_number}</div>
              <span className="text-[10px] text-slate-500">Barcode: {product.barcode || 'N/A'}</span>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider block">Expiry Date</span>
              <div className="text-lg font-bold text-purple-900 font-mono mt-1">{product.expiry_date}</div>
              <span className="text-[10px] text-purple-700">Mfg: {product.manufacturing_date || 'N/A'}</span>
            </div>

          </div>

          {/* QR Code & Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* QR Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center">
              {product.qr_code && product.qr_code.startsWith('data:') ? (
                <img src={product.qr_code} alt="QR Code" className="w-36 h-36 border p-1 rounded-lg bg-white shadow-xs" />
              ) : (
                <div className="w-36 h-36 bg-white border rounded-lg flex items-center justify-center text-xs text-slate-400">
                  <QrCode className="w-12 h-12" />
                </div>
              )}
              <div className="mt-3 text-xs font-mono font-bold text-slate-800">{product.sku}</div>
              <div className="text-[11px] text-slate-500">Batch: {product.batch_number}</div>

              <div className="mt-4 flex items-center gap-2 w-full">
                <button
                  onClick={downloadQR}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Product Metadata Table */}
            <div className="md:col-span-2 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-200">Pharmaceutical Specification</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-medium">Category:</span>
                  <p className="font-semibold text-slate-800">{product.category_name}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Manufacturer:</span>
                  <p className="font-semibold text-slate-800">{product.manufacturer_name}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Supplier:</span>
                  <p className="font-semibold text-slate-800">{product.supplier_name}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">GST Tax Percentage:</span>
                  <p className="font-semibold text-slate-800">{product.gst_percentage}%</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Total Stock Received (In):</span>
                  <p className="font-semibold text-emerald-600">+{product.total_stock_in}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Total Stock Dispatched (Out):</span>
                  <p className="font-semibold text-amber-600">-{product.total_stock_out}</p>
                </div>
              </div>

              {product.description && (
                <div className="pt-2">
                  <span className="text-slate-400 font-medium">Description / Usage Notes:</span>
                  <p className="text-slate-700 mt-0.5 italic">{product.description}</p>
                </div>
              )}
            </div>

          </div>

          {/* Transaction History for this Product */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-200">Stock Movement Audit History</h4>
            
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5">Date & Time</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Quantity</th>
                    <th className="p-2.5">Reference #</th>
                    <th className="p-2.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productTx.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">No stock transactions logged yet.</td>
                    </tr>
                  ) : (
                    productTx.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-600">{new Date(t.created_at).toLocaleString()}</td>
                        <td className="p-2.5 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            t.transaction_type === 'STOCK_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {t.transaction_type}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold">{t.transaction_type === 'STOCK_IN' ? `+${t.quantity}` : `-${t.quantity}`}</td>
                        <td className="p-2.5 font-mono text-slate-600">{t.reference_number}</td>
                        <td className="p-2.5 text-slate-500">{t.remarks || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer Quick Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStockIn(product)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Perform Stock In</span>
            </button>
            <button
              onClick={() => onStockOut(product)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Perform Stock Out</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
