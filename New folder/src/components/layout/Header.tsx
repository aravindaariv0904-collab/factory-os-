import React from 'react';
import { Search, Scan, Plus, Clock, Database, ChevronRight, Bell } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
  onOpenCommandPalette: () => void;
  onOpenScanner: () => void;
  onOpenAddProduct: () => void;
  isConnectedToSupabase: boolean;
  lowStockCount: number;
  expiringCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenCommandPalette,
  onOpenScanner,
  onOpenAddProduct,
  isConnectedToSupabase,
  lowStockCount,
  expiringCount,
}) => {
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard': return 'Executive Dashboard';
      case 'products': return 'Product Catalog & Inventory Master';
      case 'inventory': return 'Real-Time Calculated Stock';
      case 'qr-studio': return 'QR Code Studio & Printable Labels';
      case 'scanner': return 'Webcam & USB QR Scanner';
      case 'transactions': return 'Stock In / Stock Out Audit History';
      case 'reports': return 'Enterprise PDF Reports & Analytics';
      case 'supabase-setup': return 'Supabase Database Engine & SQL Setup';
      case 'settings': return 'System Settings & Configurations';
      default: return 'MedStock ERP';
    }
  };

  const totalAlerts = lowStockCount + expiringCount;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
      {/* Breadcrumbs & Title */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MedStock</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <h1 className="text-base font-bold text-slate-900 tracking-tight">{getTabTitle(activeTab)}</h1>
      </div>

      {/* Center Command Search Trigger */}
      <div className="flex-1 max-w-md mx-6">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg text-slate-500 text-xs transition-colors duration-150 group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            <span className="font-medium text-slate-600">Search products, SKU, batch, or QR payload...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Action Buttons & Status */}
      <div className="flex items-center gap-3">
        {/* Supabase Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700">
          <Database className={`w-3.5 h-3.5 ${isConnectedToSupabase ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>{isConnectedToSupabase ? 'Supabase Live' : 'Local DB (Offline)'}</span>
        </div>

        {/* Quick Scanner Launch */}
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all duration-150 active:scale-95"
        >
          <Scan className="w-4 h-4" />
          <span>Scan QR</span>
        </button>

        {/* Quick Add Product */}
        <button
          onClick={onOpenAddProduct}
          className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all duration-150 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>
    </header>
  );
};
