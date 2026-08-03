import React from 'react';
import { 
  LayoutDashboard, Package, Boxes, QrCode, Scan, History, 
  FileSpreadsheet, Database, Settings, Activity, ShieldAlert, Sparkles 
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'products' 
  | 'inventory' 
  | 'qr-studio' 
  | 'scanner' 
  | 'transactions' 
  | 'reports' 
  | 'supabase-setup' 
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  lowStockCount: number;
  expiringCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  lowStockCount, 
  expiringCount 
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<any>; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Product Catalog', icon: Package },
    { id: 'inventory', label: 'Live Inventory', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'qr-studio', label: 'QR Label Studio', icon: QrCode },
    { id: 'scanner', label: 'QR Webcam Scanner', icon: Scan, badgeColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'transactions', label: 'Audit Transactions', icon: History },
    { id: 'reports', label: 'Reports & PDF', icon: FileSpreadsheet },
    { id: 'supabase-setup', label: 'Supabase Engine', icon: Database },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 font-bold text-lg">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-50 tracking-tight text-base">MedStock</span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
              ENT
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium truncate">Medical Inventory ERP</p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Core Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/50 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-150 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-red-500/20 text-red-400'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Expiry & Low Stock Quick Alert Box */}
      {(lowStockCount > 0 || expiringCount > 0) && (
        <div className="m-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Attention Needed</span>
          </div>
          <p className="text-[11px] text-slate-300">
            {lowStockCount > 0 && `${lowStockCount} items low on stock.`}
            {lowStockCount > 0 && expiringCount > 0 && ' '}
            {expiringCount > 0 && `${expiringCount} items expiring soon.`}
          </p>
          <button 
            onClick={() => setActiveTab('inventory')}
            className="mt-2 text-xs text-brand-400 font-semibold hover:underline flex items-center gap-1"
          >
            Review Alerts &rarr;
          </button>
        </div>
      )}

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono text-[11px] text-slate-300">Engine v1.0 Active</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Supabase SQL</span>
      </div>
    </aside>
  );
};
