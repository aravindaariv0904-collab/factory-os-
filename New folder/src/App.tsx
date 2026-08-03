import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { CommandPalette } from './components/layout/CommandPalette';
import { ToastContainer, ToastMessage } from './components/layout/ToastContainer';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { ProductList } from './components/products/ProductList';
import { ProductFormModal } from './components/products/ProductFormModal';
import { ProductDetailModal } from './components/products/ProductDetailModal';
import { QRStudio } from './components/qr/QRStudio';
import { QRScannerModal } from './components/scanner/QRScannerModal';
import { InventoryList } from './components/inventory/InventoryList';
import { TransactionHistory } from './components/transactions/TransactionHistory';
import { ReportCenter } from './components/reports/ReportCenter';
import { SupabaseSetupModal } from './components/supabase/SupabaseSetupModal';
import { SystemSettingsView } from './components/settings/SystemSettingsView';

import { store } from './services/store';
import { Product, InventoryTransaction, Category, Manufacturer, Supplier, ActivityLog, SystemSettings } from './types/inventory';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  
  // Reactive Store States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(store.getSettings());

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [duplicateProduct, setDuplicateProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialMode, setScannerInitialMode] = useState<'STOCK_IN' | 'STOCK_OUT'>('STOCK_IN');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, description }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Synchronize store data
  const refreshStoreData = () => {
    setProducts(store.getProducts());
    setCategories(store.getCategories());
    setManufacturers(store.getManufacturers());
    setSuppliers(store.getSuppliers());
    setTransactions(store.getTransactions());
    setActivityLogs(store.getActivityLogs());
    setSettings(store.getSettings());
  };

  useEffect(() => {
    refreshStoreData();
    const unsubscribe = store.subscribe(() => refreshStoreData());
    return () => unsubscribe();
  }, []);

  // Global Keyboard Short-cuts (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for Product operations
  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>, initialQty: number = 0) => {
    if (editProduct && !duplicateProduct) {
      await store.updateProduct(editProduct.id, productData);
      addToast('success', 'Product Updated', `Successfully updated product ${productData.product_name}.`);
    } else {
      const newProd = await store.addProduct(productData, initialQty);
      addToast('success', 'Product Registered', `Successfully created ${newProd.product_name} with auto-generated QR code.`);
    }
    setEditProduct(null);
    setDuplicateProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    const p = store.getProductById(id);
    if (p && confirm(`Are you sure you want to archive product "${p.product_name}"?`)) {
      store.deleteProduct(id);
      addToast('warning', 'Product Archived', `Product "${p.product_name}" has been removed from active catalog.`);
    }
  };

  const handleBulkDelete = (ids: string[]) => {
    if (confirm(`Are you sure you want to delete ${ids.length} selected products?`)) {
      store.bulkDeleteProducts(ids);
      addToast('warning', 'Bulk Delete Completed', `Archived ${ids.length} medical items.`);
    }
  };

  const handleStockIn = (productId: string, quantity: number, refNum: string, remarks?: string) => {
    store.stockIn(productId, quantity, refNum, remarks);
    const prod = store.getProductById(productId);
    addToast('success', 'Stock In Verified', `Added +${quantity} units to "${prod?.product_name}".`);
  };

  const handleStockOut = (productId: string, quantity: number, refNum: string, remarks?: string) => {
    store.stockOut(productId, quantity, refNum, remarks);
    const prod = store.getProductById(productId);
    addToast('info', 'Stock Out Dispatched', `Deducted -${quantity} units from "${prod?.product_name}".`);
  };

  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split('\n');
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',').map(s => s.replace(/^"|"$/g, ''));
        if (parts.length >= 3) {
          try {
            await store.addProduct({
              product_code: parts[0] || `P${Math.floor(100 + Math.random() * 900)}`,
              sku: parts[1] || `SKU-${Date.now()}-${i}`,
              product_name: parts[2],
              generic_name: parts[3] || '',
              category_id: categories[0]?.id || '',
              manufacturer_id: manufacturers[0]?.id || '',
              supplier_id: suppliers[0]?.id || '',
              batch_number: parts[6] || `BT${i}01`,
              barcode: '',
              expiry_date: parts[7] || '2028-01-01',
              manufacturing_date: '2025-01-01',
              purchase_price: Number(parts[10]) || 10,
              selling_price: Number(parts[9]) || 15,
              gst_percentage: 12,
              unit: 'Box',
              minimum_stock: 10,
              description: 'Imported via CSV',
              status: 'ACTIVE',
            }, Number(parts[8]) || 20);
            count++;
          } catch (err) {
            // skip duplicates
          }
        }
      }
      addToast('success', 'CSV Import Complete', `Successfully imported ${count} medical items from CSV.`);
    };
    reader.readAsText(file);
  };

  // Calculations for alerts
  const lowStockCount = products.filter(p => p.calculated_status === 'LOW_STOCK' || p.calculated_status === 'OUT_OF_STOCK').length;
  const expiringCount = products.filter(p => p.calculated_status === 'EXPIRING_SOON' || p.calculated_status === 'EXPIRED').length;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={lowStockCount}
        expiringCount={expiringCount}
      />

      {/* Main Right Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        <Header
          activeTab={activeTab}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenScanner={() => { setScannerInitialMode('STOCK_IN'); setIsScannerOpen(true); }}
          onOpenAddProduct={() => { setEditProduct(null); setDuplicateProduct(null); setIsAddModalOpen(true); }}
          isConnectedToSupabase={settings.is_connected_to_supabase}
          lowStockCount={lowStockCount}
          expiringCount={expiringCount}
        />

        {/* View Switcher */}
        <main className="flex-1 pb-12 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <ExecutiveDashboard
              products={products}
              transactions={transactions}
              activityLogs={activityLogs}
              categories={categories}
              manufacturers={manufacturers}
              onNavigate={setActiveTab}
              onOpenScanner={() => { setScannerInitialMode('STOCK_IN'); setIsScannerOpen(true); }}
              onOpenAddProduct={() => { setEditProduct(null); setDuplicateProduct(null); setIsAddModalOpen(true); }}
              onSelectProduct={(p, act) => {
                if (act === 'view') setDetailProduct(p);
                else if (act === 'stock-in') { setScannerInitialMode('STOCK_IN'); setIsScannerOpen(true); }
                else if (act === 'stock-out') { setScannerInitialMode('STOCK_OUT'); setIsScannerOpen(true); }
              }}
            />
          )}

          {activeTab === 'products' && (
            <ProductList
              products={products}
              categories={categories}
              manufacturers={manufacturers}
              suppliers={suppliers}
              onOpenAddModal={() => { setEditProduct(null); setDuplicateProduct(null); setIsAddModalOpen(true); }}
              onOpenEditModal={(p) => { setEditProduct(p); setDuplicateProduct(null); setIsAddModalOpen(true); }}
              onOpenDuplicateModal={(p) => { setEditProduct(p); setDuplicateProduct(p); setIsAddModalOpen(true); }}
              onOpenDetailModal={(p) => setDetailProduct(p)}
              onStockIn={(p) => { handleStockIn(p.id, 10, `REF-IN-${Date.now().toString().slice(-4)}`); }}
              onStockOut={(p) => {
                if ((p.current_stock ?? 0) <= 0) {
                  addToast('error', 'Cannot Stock Out', `Product "${p.product_name}" is currently Out of Stock!`);
                  return;
                }
                handleStockOut(p.id, 5, `REF-OUT-${Date.now().toString().slice(-4)}`);
              }}
              onDeleteProduct={handleDeleteProduct}
              onBulkDelete={handleBulkDelete}
              onImportCSV={handleImportCSV}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryList
              products={products}
              onStockIn={(p) => handleStockIn(p.id, 20, `PO-${Date.now().toString().slice(-4)}`)}
              onStockOut={(p) => {
                if ((p.current_stock ?? 0) <= 0) {
                  addToast('error', 'Out of Stock Warning', `Cannot dispatch "${p.product_name}" as stock is 0.`);
                  return;
                }
                handleStockOut(p.id, 5, `SO-${Date.now().toString().slice(-4)}`);
              }}
              onOpenDetailModal={(p) => setDetailProduct(p)}
            />
          )}

          {activeTab === 'qr-studio' && (
            <QRStudio products={products} />
          )}

          {activeTab === 'scanner' && (
            <div className="p-6">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-md hover:bg-brand-700 transition-all"
              >
                Launch QR Webcam Scanner Modal
              </button>
            </div>
          )}

          {activeTab === 'transactions' && (
            <TransactionHistory transactions={transactions} />
          )}

          {activeTab === 'reports' && (
            <ReportCenter
              products={products}
              transactions={transactions}
              categories={categories}
              manufacturers={manufacturers}
              suppliers={suppliers}
            />
          )}

          {activeTab === 'supabase-setup' && (
            <SupabaseSetupModal
              isConnected={settings.is_connected_to_supabase}
              onConnectionChange={(conn) => refreshStoreData()}
            />
          )}

          {activeTab === 'settings' && (
            <SystemSettingsView
              settings={settings}
              onUpdateSettings={(newSet) => {
                store.updateSettings(newSet);
                addToast('success', 'Settings Updated', 'System parameters updated.');
              }}
              onResetSeedData={() => {
                if (confirm('Reset database to clean initial medical demo seed dataset?')) {
                  store.initDefaultDataIfNeeded(true);
                  addToast('info', 'Database Reset', 'System re-initialized with 15 realistic medical products.');
                }
              }}
            />
          )}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        products={products}
        onSelectProduct={(p, act) => {
          if (act === 'view') setDetailProduct(p);
          else if (act === 'stock-in') handleStockIn(p.id, 10, `PO-${Date.now().toString().slice(-4)}`);
          else if (act === 'stock-out') handleStockOut(p.id, 5, `SO-${Date.now().toString().slice(-4)}`);
        }}
      />

      {/* Global Product Form Modal */}
      <ProductFormModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditProduct(null); setDuplicateProduct(null); }}
        onSave={handleSaveProduct}
        initialData={editProduct}
        categories={categories}
        manufacturers={manufacturers}
        suppliers={suppliers}
        isDuplicate={!!duplicateProduct}
      />

      {/* Global Product Detail Modal */}
      <ProductDetailModal
        isOpen={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        product={detailProduct}
        transactions={transactions}
        onStockIn={(p) => handleStockIn(p.id, 20, `PO-${Date.now().toString().slice(-4)}`)}
        onStockOut={(p) => handleStockOut(p.id, 5, `SO-${Date.now().toString().slice(-4)}`)}
        onEdit={(p) => { setDetailProduct(null); setEditProduct(p); setDuplicateProduct(null); setIsAddModalOpen(true); }}
        onDuplicate={(p) => { setDetailProduct(null); setEditProduct(p); setDuplicateProduct(p); setIsAddModalOpen(true); }}
        onDelete={(p) => { setDetailProduct(null); handleDeleteProduct(p.id); }}
      />

      {/* Global QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onStockIn={handleStockIn}
        onStockOut={handleStockOut}
        initialMode={scannerInitialMode}
      />

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

    </div>
  );
}

