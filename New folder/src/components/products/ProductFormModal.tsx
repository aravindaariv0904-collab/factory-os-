import React, { useState, useEffect } from 'react';
import { X, QrCode, AlertTriangle, Save, RefreshCw, Package, Tag, Layers, Factory, DollarSign, Calendar } from 'lucide-react';
import { Product, Category, Manufacturer, Supplier } from '../../types/inventory';
import QRCode from 'qrcode';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>, initialQty?: number) => Promise<void>;
  initialData?: Product | null;
  categories: Category[];
  manufacturers: Manufacturer[];
  suppliers: Supplier[];
  isDuplicate?: boolean;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  manufacturers,
  suppliers,
  isDuplicate = false,
}) => {
  const [formData, setFormData] = useState({
    product_code: '',
    sku: '',
    product_name: '',
    generic_name: '',
    category_id: '',
    manufacturer_id: '',
    supplier_id: '',
    batch_number: '',
    barcode: '',
    expiry_date: '',
    manufacturing_date: '',
    purchase_price: 0,
    selling_price: 0,
    gst_percentage: 12,
    unit: 'Strip',
    minimum_stock: 10,
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'ARCHIVED',
    initial_stock: 0,
  });

  const [qrPreviewUrl, setQrPreviewUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        product_code: isDuplicate ? `P-${Math.floor(1000 + Math.random() * 9000)}` : initialData.product_code,
        sku: isDuplicate ? `${initialData.sku}-COPY` : initialData.sku,
        product_name: isDuplicate ? `${initialData.product_name} (Copy)` : initialData.product_name,
        generic_name: initialData.generic_name || '',
        category_id: initialData.category_id || (categories[0]?.id || ''),
        manufacturer_id: initialData.manufacturer_id || (manufacturers[0]?.id || ''),
        supplier_id: initialData.supplier_id || (suppliers[0]?.id || ''),
        batch_number: isDuplicate ? `BT${Math.floor(100 + Math.random() * 900)}` : initialData.batch_number,
        barcode: initialData.barcode || '',
        expiry_date: initialData.expiry_date || '',
        manufacturing_date: initialData.manufacturing_date || '',
        purchase_price: initialData.purchase_price,
        selling_price: initialData.selling_price,
        gst_percentage: initialData.gst_percentage || 12,
        unit: initialData.unit || 'Strip',
        minimum_stock: initialData.minimum_stock || 10,
        description: initialData.description || '',
        status: initialData.status as 'ACTIVE' | 'ARCHIVED',
        initial_stock: 0, // only for new products
      });
    } else {
      // Default auto-generated codes
      const autoCode = `P${Math.floor(100 + Math.random() * 900)}`;
      const autoSku = `MED-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const autoBatch = `BT${new Date().getFullYear().toString().slice(-2)}${Math.floor(10 + Math.random() * 90)}`;
      
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const expiryStr = futureDate.toISOString().split('T')[0];

      setFormData({
        product_code: autoCode,
        sku: autoSku,
        product_name: '',
        generic_name: '',
        category_id: categories[0]?.id || '',
        manufacturer_id: manufacturers[0]?.id || '',
        supplier_id: suppliers[0]?.id || '',
        batch_number: autoBatch,
        barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
        expiry_date: expiryStr,
        manufacturing_date: new Date().toISOString().split('T')[0],
        purchase_price: 10.0,
        selling_price: 15.0,
        gst_percentage: 12,
        unit: 'Strip',
        minimum_stock: 15,
        description: '',
        status: 'ACTIVE',
        initial_stock: 50,
      });
    }
  }, [initialData, isDuplicate, isOpen, categories, manufacturers, suppliers]);

  // Generate live QR preview when SKU, product_name, or batch changes
  useEffect(() => {
    const payload = JSON.stringify({
      id: initialData?.id || 'PREVIEW',
      sku: formData.sku || 'MED-SKU',
      name: formData.product_name || 'Medical Product',
      batch: formData.batch_number || 'BT001',
      exp: formData.expiry_date
    });
    QRCode.toDataURL(payload, { width: 180, margin: 1 })
      .then(url => setQrPreviewUrl(url))
      .catch(() => setQrPreviewUrl(''));
  }, [formData.sku, formData.product_name, formData.batch_number, formData.expiry_date, initialData]);

  // Live Warning checks
  useEffect(() => {
    const warnList: string[] = [];
    if (formData.purchase_price > 0 && formData.selling_price > 0 && formData.purchase_price >= formData.selling_price) {
      warnList.push('Warning: Purchase price is higher than or equal to selling price!');
    }
    if (formData.expiry_date) {
      const today = new Date().toISOString().split('T')[0];
      if (formData.expiry_date <= today) {
        warnList.push('Warning: Selected expiry date is in the past!');
      }
    }
    setWarnings(warnList);
  }, [formData.purchase_price, formData.selling_price, formData.expiry_date]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.product_name.trim()) errs.product_name = 'Product name is required.';
    if (!formData.sku.trim()) errs.sku = 'SKU is required.';
    if (!formData.product_code.trim()) errs.product_code = 'Product Code is required.';
    if (!formData.batch_number.trim()) errs.batch_number = 'Batch Number is required.';
    if (!formData.expiry_date) errs.expiry_date = 'Expiry date is required.';
    if (formData.purchase_price < 0) errs.purchase_price = 'Purchase price cannot be negative.';
    if (formData.selling_price < 0) errs.selling_price = 'Selling price cannot be negative.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        product_code: formData.product_code,
        sku: formData.sku,
        product_name: formData.product_name,
        generic_name: formData.generic_name,
        category_id: formData.category_id,
        manufacturer_id: formData.manufacturer_id,
        supplier_id: formData.supplier_id,
        batch_number: formData.batch_number,
        barcode: formData.barcode,
        expiry_date: formData.expiry_date,
        manufacturing_date: formData.manufacturing_date,
        purchase_price: Number(formData.purchase_price),
        selling_price: Number(formData.selling_price),
        gst_percentage: Number(formData.gst_percentage),
        unit: formData.unit,
        minimum_stock: Number(formData.minimum_stock),
        description: formData.description,
        status: formData.status,
      }, Number(formData.initial_stock || 0));

      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-modal border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {initialData && !isDuplicate ? 'Edit Medical Product' : isDuplicate ? 'Duplicate Product' : 'Register New Medical Product'}
            </h3>
            <p className="text-xs text-slate-500">Provide full pharmaceutical parameters, pricing, and QR metadata.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Notice */}
        {errors.form && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
            {errors.form}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Package className="w-4 h-4 text-brand-600" />
              <span>1. Basic Product Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Code *</label>
                <input
                  type="text"
                  value={formData.product_code}
                  onChange={(e) => handleChange('product_code', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
                {errors.product_code && <p className="text-[10px] text-red-600 mt-1">{errors.product_code}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-brand-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
                {errors.sku && <p className="text-[10px] text-red-600 mt-1">{errors.sku}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="Strip">Strip</option>
                  <option value="Box">Box</option>
                  <option value="Bottle">Bottle</option>
                  <option value="Vial">Vial</option>
                  <option value="Ampoule">Ampoule</option>
                  <option value="Pack">Pack</option>
                  <option value="Sachet">Sachet</option>
                  <option value="Piece">Piece</option>
                  <option value="Unit">Unit</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Brand Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 500mg"
                  value={formData.product_name}
                  onChange={(e) => handleChange('product_name', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
                {errors.product_name && <p className="text-[10px] text-red-600 mt-1">{errors.product_name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Name / Composition</label>
                <input
                  type="text"
                  placeholder="e.g. Acetaminophen"
                  value={formData.generic_name}
                  onChange={(e) => handleChange('generic_name', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Category, Manufacturer & Supplier */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>2. Classification & Vendor Relationships</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => handleChange('category_id', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer</label>
                <select
                  value={formData.manufacturer_id}
                  onChange={(e) => handleChange('manufacturer_id', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id}>{m.company_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Supplier</label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => handleChange('supplier_id', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.company_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Batch, Expiry & Pricing */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>3. Batch Control & Financial Pricing</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number *</label>
                <input
                  type="text"
                  value={formData.batch_number}
                  onChange={(e) => handleChange('batch_number', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturing Date</label>
                <input
                  type="date"
                  value={formData.manufacturing_date}
                  onChange={(e) => handleChange('manufacturing_date', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date *</label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => handleChange('expiry_date', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Alert Stock *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minimum_stock}
                  onChange={(e) => handleChange('minimum_stock', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchase_price}
                  onChange={(e) => handleChange('purchase_price', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.selling_price}
                  onChange={(e) => handleChange('selling_price', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GST Tax %</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.gst_percentage}
                  onChange={(e) => handleChange('gst_percentage', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {!initialData && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Opening Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.initial_stock}
                    onChange={(e) => handleChange('initial_stock', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Warnings list */}
            {warnings.map((w, idx) => (
              <div key={idx} className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{w}</span>
              </div>
            ))}
          </div>

          {/* Section 4: Live QR Code Preview Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm shrink-0 text-center">
              {qrPreviewUrl ? (
                <img src={qrPreviewUrl} alt="QR Code Preview" className="w-32 h-32 mx-auto" />
              ) : (
                <div className="w-32 h-32 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
              <span className="text-[10px] font-mono text-slate-500 block mt-1">Auto-Generated QR</span>
            </div>

            <div className="space-y-1 text-xs text-slate-600 flex-1">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-brand-600" />
                <span>Embedded JSON QR Payload Preview</span>
              </h4>
              <p className="text-slate-500">Every product created receives a standardized JSON payload structure embedded into a high-density 2D barcode for fast scanning:</p>
              <pre className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto mt-2">
{JSON.stringify({
  id: initialData?.id || 'P001',
  sku: formData.sku || 'MED-SKU',
  name: formData.product_name || 'Paracetamol 500mg',
  batch: formData.batch_number || 'BT2601',
  exp: formData.expiry_date
}, null, 2)}
              </pre>
            </div>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : initialData && !isDuplicate ? 'Update Product' : 'Save & Generate QR'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
