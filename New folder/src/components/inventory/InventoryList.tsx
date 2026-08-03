import React, { useState, useMemo } from 'react';
import { 
  Boxes, ShieldAlert, AlertTriangle, Calendar, Search, Filter, 
  Download, ArrowDownRight, ArrowUpRight, CheckCircle2, Eye, QrCode 
} from 'lucide-react';
import { Product, CalculatedStockStatus } from '../../types/inventory';

interface InventoryListProps {
  products: Product[];
  onStockIn: (product: Product) => void;
  onStockOut: (product: Product) => void;
  onOpenDetailModal: (product: Product) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  products,
  onStockIn,
  onStockOut,
  onOpenDetailModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        p.product_name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.batch_number.toLowerCase().includes(q)
      );

      const matchesStatus = selectedStatusFilter === 'ALL' || p.calculated_status === selectedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, selectedStatusFilter]);

  // Counts
  const healthyCount = products.filter(p => p.calculated_status === 'HEALTHY').length;
  const lowStockCount = products.filter(p => p.calculated_status === 'LOW_STOCK').length;
  const outOfStockCount = products.filter(p => p.calculated_status === 'OUT_OF_STOCK').length;
  const expiringSoonCount = products.filter(p => p.calculated_status === 'EXPIRING_SOON').length;
  const expiredCount = products.filter(p => p.calculated_status === 'EXPIRED').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-brand-600" />
            <span>Calculated Real-Time Inventory Control</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic calculated stock derived continuously from <strong className="font-mono text-slate-700">Total Stock In - Total Stock Out</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const csvContent = 'data:text/csv;charset=utf-8,' + [
                'SKU,Product Name,Category,Batch,Available Stock,Minimum Stock,Status',
                ...filteredProducts.map(p => `"${p.sku}","${p.product_name}","${p.category_name}","${p.batch_number}",${p.current_stock ?? 0},${p.minimum_stock},"${p.calculated_status}"`)
              ].join('\n');
              const link = document.createElement('a');
              link.href = encodeURI(csvContent);
              link.download = `inventory_status_${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Stock Status CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs / Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        
        <button
          onClick={() => setSelectedStatusFilter('ALL')}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedStatusFilter === 'ALL' 
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">All Products</span>
          <div className="text-xl font-bold font-mono mt-0.5">{products.length}</div>
        </button>

        <button
          onClick={() => setSelectedStatusFilter('HEALTHY')}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedStatusFilter === 'HEALTHY' 
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-600">Healthy Stock</span>
          <div className="text-xl font-bold font-mono mt-0.5">{healthyCount}</div>
        </button>

        <button
          onClick={() => setSelectedStatusFilter('LOW_STOCK')}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedStatusFilter === 'LOW_STOCK' 
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-600">Low Stock Alert</span>
          <div className="text-xl font-bold font-mono mt-0.5">{lowStockCount}</div>
        </button>

        <button
          onClick={() => setSelectedStatusFilter('EXPIRING_SOON')}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedStatusFilter === 'EXPIRING_SOON' 
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-purple-600">Expiring (&le; 30d)</span>
          <div className="text-xl font-bold font-mono mt-0.5">{expiringSoonCount}</div>
        </button>

        <button
          onClick={() => setSelectedStatusFilter('EXPIRED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedStatusFilter === 'EXPIRED' 
              ? 'bg-red-800 text-white border-red-800 shadow-sm' 
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-red-600">Expired Items</span>
          <div className="text-xl font-bold font-mono mt-0.5">{expiredCount}</div>
        </button>

      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        
        {/* Table Search Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search inventory by name, SKU, or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none"
            />
          </div>
          
          <div className="text-xs text-slate-500">
            Filtered: <strong className="font-mono text-slate-900">{filteredProducts.length}</strong> items
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Product Name</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Category</th>
                <th className="p-3">Batch Number</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3 text-center">Calculated Available</th>
                <th className="p-3 text-center">Minimum Threshold</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Quick Stock Action</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No products match the selected status or query.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const stock = product.current_stock ?? 0;

                  let badge = <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Healthy</span>;
                  if (product.calculated_status === 'LOW_STOCK') {
                    badge = <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Low Stock</span>;
                  } else if (product.calculated_status === 'OUT_OF_STOCK') {
                    badge = <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">Out of Stock</span>;
                  } else if (product.calculated_status === 'EXPIRING_SOON') {
                    badge = <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Expiring Soon</span>;
                  } else if (product.calculated_status === 'EXPIRED') {
                    badge = <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-800 text-white border border-red-900">Expired</span>;
                  }

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      <td className="p-3">
                        <button 
                          onClick={() => onOpenDetailModal(product)} 
                          className="font-bold text-slate-900 hover:text-brand-600 text-left block"
                        >
                          {product.product_name}
                        </button>
                        <span className="text-[11px] text-slate-400 block">{product.generic_name || 'N/A'}</span>
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-900">{product.sku}</td>

                      <td className="p-3 text-slate-600 font-medium">{product.category_name}</td>

                      <td className="p-3 font-mono text-slate-700">{product.batch_number}</td>

                      <td className="p-3 text-slate-600">{product.expiry_date}</td>

                      <td className="p-3 text-center font-mono font-bold text-sm">
                        <span className={stock <= 0 ? 'text-red-600' : stock < product.minimum_stock ? 'text-amber-600' : 'text-slate-900'}>
                          {stock}
                        </span>
                        <span className="text-[10px] font-normal text-slate-400 block">{product.unit}</span>
                      </td>

                      <td className="p-3 text-center font-mono text-slate-600">{product.minimum_stock}</td>

                      <td className="p-3 text-center">{badge}</td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onStockIn(product)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-md border border-emerald-200 transition-colors flex items-center gap-1"
                          >
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            <span>Stock In</span>
                          </button>

                          <button
                            onClick={() => onStockOut(product)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold rounded-md border border-amber-200 transition-colors flex items-center gap-1"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Stock Out</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
