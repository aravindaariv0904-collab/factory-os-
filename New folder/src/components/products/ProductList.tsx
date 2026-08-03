import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, Upload, Plus, Trash2, Edit3, Copy, 
  Eye, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, 
  CheckSquare, Square, Columns, RefreshCw, QrCode, FileSpreadsheet, Package 
} from 'lucide-react';
import { Product, Category, Manufacturer, Supplier } from '../../types/inventory';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  manufacturers: Manufacturer[];
  suppliers: Supplier[];
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onOpenDuplicateModal: (product: Product) => void;
  onOpenDetailModal: (product: Product) => void;
  onStockIn: (product: Product) => void;
  onStockOut: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onImportCSV: (file: File) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  categories,
  manufacturers,
  suppliers,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDuplicateModal,
  onOpenDetailModal,
  onStockIn,
  onStockOut,
  onDeleteProduct,
  onBulkDelete,
  onImportCSV,
}) => {
  // State for search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof Product>('product_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection & Columns state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    sku: true,
    name: true,
    category: true,
    manufacturer: true,
    batch: true,
    expiry: true,
    price: true,
    stock: true,
    status: true,
    actions: true,
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Filtering & Sorting Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        p.product_name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.product_code.toLowerCase().includes(q) ||
        (p.generic_name && p.generic_name.toLowerCase().includes(q)) ||
        p.batch_number.toLowerCase().includes(q)
      );

      const matchesCat = selectedCategory === 'ALL' || p.category_id === selectedCategory;
      const matchesMfg = selectedManufacturer === 'ALL' || p.manufacturer_id === selectedManufacturer;
      const matchesStatus = selectedStatus === 'ALL' || p.calculated_status === selectedStatus;

      return matchesSearch && matchesCat && matchesMfg && matchesStatus;
    }).sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'current_stock') {
        aVal = a.current_stock ?? 0;
        bVal = b.current_stock ?? 0;
      }

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [products, searchQuery, selectedCategory, selectedManufacturer, selectedStatus, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map(p => p.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Export to CSV
  const exportToCSV = () => {
    const itemsToExport = selectedIds.length > 0 
      ? products.filter(p => selectedIds.includes(p.id))
      : filteredProducts;

    const headers = ['Product Code', 'SKU', 'Product Name', 'Generic Name', 'Category', 'Manufacturer', 'Batch Number', 'Expiry Date', 'Available Stock', 'Selling Price', 'Purchase Price', 'Status'];
    const rows = itemsToExport.map(p => [
      `"${p.product_code}"`,
      `"${p.sku}"`,
      `"${p.product_name.replace(/"/g, '""')}"`,
      `"${(p.generic_name || '').replace(/"/g, '""')}"`,
      `"${p.category_name || ''}"`,
      `"${p.manufacturer_name || ''}"`,
      `"${p.batch_number}"`,
      `"${p.expiry_date}"`,
      p.current_stock ?? 0,
      p.selling_price,
      p.purchase_price,
      `"${p.calculated_status || 'HEALTHY'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medstock_products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportCSV(e.target.files[0]);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4 animate-in fade-in duration-150">
      
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU, code, batch number..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          
          {selectedIds.length > 0 && (
            <button
              onClick={() => onBulkDelete(selectedIds)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}

          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Column Selector Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
            >
              <Columns className="w-3.5 h-3.5 text-slate-500" />
              <span>Columns</span>
            </button>

            {showColumnDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-modal p-2 z-20 space-y-1 text-xs">
                {Object.keys(visibleColumns).map((col) => (
                  <label key={col} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer capitalize">
                    <input
                      type="checkbox"
                      checked={(visibleColumns as any)[col]}
                      onChange={(e) => setVisibleColumns(prev => ({ ...prev, [col]: e.target.checked }))}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>{col}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>

        </div>

      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Manufacturer Filter */}
          <select
            value={selectedManufacturer}
            onChange={(e) => { setSelectedManufacturer(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Manufacturers</option>
            {manufacturers.map(m => <option key={m.id} value={m.id}>{m.company_name}</option>)}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="HEALTHY">Healthy Stock</option>
            <option value="LOW_STOCK">Low Stock Alert</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="EXPIRING_SOON">Expiring Soon (&le; 30 Days)</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        <div className="text-slate-500 text-xs">
          Showing <strong className="text-slate-900 font-mono">{filteredProducts.length}</strong> products
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                </th>
                {visibleColumns.code && <th className="p-3 font-mono">Code</th>}
                {visibleColumns.sku && <th className="p-3">SKU</th>}
                {visibleColumns.name && (
                  <th 
                    className="p-3 cursor-pointer hover:text-slate-900"
                    onClick={() => {
                      setSortField('product_name');
                      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Product Name & Generic
                  </th>
                )}
                {visibleColumns.category && <th className="p-3">Category</th>}
                {visibleColumns.manufacturer && <th className="p-3">Manufacturer</th>}
                {visibleColumns.batch && <th className="p-3 font-mono">Batch</th>}
                {visibleColumns.expiry && <th className="p-3">Expiry</th>}
                {visibleColumns.price && <th className="p-3 text-right">Price ($)</th>}
                {visibleColumns.stock && (
                  <th 
                    className="p-3 text-center cursor-pointer hover:text-slate-900"
                    onClick={() => {
                      setSortField('current_stock');
                      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Available Stock
                  </th>
                )}
                {visibleColumns.status && <th className="p-3 text-center">Status</th>}
                {visibleColumns.actions && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    No medical products match your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(product => {
                  const isSelected = selectedIds.includes(product.id);
                  const stock = product.current_stock ?? 0;

                  // Status badge mapping
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      HEALTHY
                    </span>
                  );

                  if (product.calculated_status === 'LOW_STOCK') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        LOW STOCK
                      </span>
                    );
                  } else if (product.calculated_status === 'OUT_OF_STOCK') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                        OUT OF STOCK
                      </span>
                    );
                  } else if (product.calculated_status === 'EXPIRING_SOON') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        EXPIRING SOON
                      </span>
                    );
                  } else if (product.calculated_status === 'EXPIRED') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-800 text-white border border-red-900">
                        EXPIRED
                      </span>
                    );
                  }

                  return (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-brand-50/50' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(product.id)}
                          className="rounded text-brand-600 focus:ring-brand-500"
                        />
                      </td>

                      {visibleColumns.code && (
                        <td className="p-3 font-mono text-slate-500 font-medium">{product.product_code}</td>
                      )}

                      {visibleColumns.sku && (
                        <td className="p-3 font-mono font-bold text-slate-900">{product.sku}</td>
                      )}

                      {visibleColumns.name && (
                        <td className="p-3">
                          <button 
                            onClick={() => onOpenDetailModal(product)} 
                            className="font-bold text-slate-900 hover:text-brand-600 text-left block"
                          >
                            {product.product_name}
                          </button>
                          <span className="text-[11px] text-slate-400 block">{product.generic_name || 'N/A'}</span>
                        </td>
                      )}

                      {visibleColumns.category && (
                        <td className="p-3 text-slate-600 font-medium">{product.category_name}</td>
                      )}

                      {visibleColumns.manufacturer && (
                        <td className="p-3 text-slate-600 truncate max-w-[120px]">{product.manufacturer_name}</td>
                      )}

                      {visibleColumns.batch && (
                        <td className="p-3 font-mono text-slate-700">{product.batch_number}</td>
                      )}

                      {visibleColumns.expiry && (
                        <td className="p-3 text-slate-600">{product.expiry_date}</td>
                      )}

                      {visibleColumns.price && (
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          ${product.selling_price.toFixed(2)}
                        </td>
                      )}

                      {visibleColumns.stock && (
                        <td className="p-3 text-center font-mono font-bold text-sm">
                          <span className={stock <= 0 ? 'text-red-600' : stock < product.minimum_stock ? 'text-amber-600' : 'text-slate-900'}>
                            {stock}
                          </span>
                          <span className="text-[10px] font-normal text-slate-400 block">{product.unit}</span>
                        </td>
                      )}

                      {visibleColumns.status && (
                        <td className="p-3 text-center">{statusBadge}</td>
                      )}

                      {visibleColumns.actions && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenDetailModal(product)}
                              title="View Product Specs"
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onStockIn(product)}
                              title="Stock In"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            >
                              <ArrowDownRight className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onStockOut(product)}
                              title="Stock Out"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onOpenEditModal(product)}
                              title="Edit Product"
                              className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 bg-white border border-slate-300 rounded-md font-mono"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div>
            Page <strong className="text-slate-900 font-mono">{currentPage}</strong> of <strong className="text-slate-900 font-mono">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
