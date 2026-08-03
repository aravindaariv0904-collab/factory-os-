import React from 'react';
import { 
  Package, Boxes, ArrowDownRight, ArrowUpRight, ShieldAlert, AlertTriangle, 
  Calendar, Layers, Factory, Activity, HeartPulse, Scan, Plus, QrCode, FileText, CheckCircle2 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Product, InventoryTransaction, ActivityLog, Category, Manufacturer } from '../../types/inventory';
import { NavTab } from '../layout/Sidebar';

interface ExecutiveDashboardProps {
  products: Product[];
  transactions: InventoryTransaction[];
  activityLogs: ActivityLog[];
  categories: Category[];
  manufacturers: Manufacturer[];
  onNavigate: (tab: NavTab) => void;
  onOpenScanner: () => void;
  onOpenAddProduct: () => void;
  onSelectProduct: (product: Product, action: 'view' | 'stock-in' | 'stock-out') => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  products,
  transactions,
  activityLogs,
  categories,
  manufacturers,
  onNavigate,
  onOpenScanner,
  onOpenAddProduct,
  onSelectProduct,
}) => {
  // Metrics calculation
  const totalProducts = products.length;
  const totalInventoryUnits = products.reduce((acc, p) => acc + (p.current_stock || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayStockIn = transactions
    .filter(t => t.transaction_type === 'STOCK_IN' && t.created_at.startsWith(todayStr))
    .reduce((acc, t) => acc + t.quantity, 0);

  const todayStockOut = transactions
    .filter(t => t.transaction_type === 'STOCK_OUT' && t.created_at.startsWith(todayStr))
    .reduce((acc, t) => acc + t.quantity, 0);

  const lowStockProducts = products.filter(p => p.calculated_status === 'LOW_STOCK' || p.calculated_status === 'OUT_OF_STOCK');
  const expiredProducts = products.filter(p => p.calculated_status === 'EXPIRED');
  const expiringSoonProducts = products.filter(p => p.calculated_status === 'EXPIRING_SOON');

  // Inventory Health Score calculation (percentage of healthy items)
  const healthyCount = products.filter(p => p.calculated_status === 'HEALTHY').length;
  const healthScore = totalProducts > 0 ? Math.round((healthyCount / totalProducts) * 100) : 100;

  // Chart Data Preparation - Stock Movement over recent 7 entries
  const movementChartData = transactions.slice(-10).reverse().map((t, idx) => ({
    time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: t.transaction_type,
    stockIn: t.transaction_type === 'STOCK_IN' ? t.quantity : 0,
    stockOut: t.transaction_type === 'STOCK_OUT' ? t.quantity : 0,
  }));

  // Category Distribution Chart
  const categoryMap: Record<string, number> = {};
  products.forEach(p => {
    const catName = p.category_name || 'Uncategorized';
    categoryMap[catName] = (categoryMap[catName] || 0) + (p.current_stock || 0);
  });

  const categoryChartData = Object.keys(categoryMap).map(catName => ({
    name: catName,
    value: categoryMap[catName],
  }));

  const COLORS = ['#0284C7', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner / Quick Actions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Overview & Analytics</h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live Real-Time Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculated dynamic stock levels across {totalProducts} registered pharmaceuticals & medical supplies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Scan className="w-4 h-4" />
            <span>Launch QR Scanner</span>
          </button>
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </button>
          <button
            onClick={() => onNavigate('qr-studio')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            <QrCode className="w-4 h-4 text-slate-500" />
            <span>Print Labels</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>PDF Reports</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        
        {/* Total Products */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Products</span>
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{totalProducts}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>{categories.length} Categories</span> • <span>{manufacturers.length} Mfrs</span>
          </div>
        </div>

        {/* Total Inventory Units */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Stock Units</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{totalInventoryUnits.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Derived from transactions</div>
        </div>

        {/* Today Stock In */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Stock In</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">+{todayStockIn}</div>
          <div className="text-[11px] text-slate-500 mt-1">Units received today</div>
        </div>

        {/* Today Stock Out */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Stock Out</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 font-mono">-{todayStockOut}</div>
          <div className="text-[11px] text-slate-500 mt-1">Units dispatched today</div>
        </div>

        {/* Inventory Health Score */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Health Index</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{healthScore}%</span>
            <span className="text-xs font-semibold text-emerald-600">Healthy</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${healthScore}%` }}></div>
          </div>
        </div>

      </div>

      {/* Alert Counter Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Low Stock Alert Card */}
        <div 
          onClick={() => onNavigate('inventory')}
          className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 cursor-pointer hover:bg-amber-100/60 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-amber-100 text-amber-800">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-900">Low Stock Products</div>
              <div className="text-xl font-bold text-amber-900 font-mono">{lowStockProducts.length} items</div>
              <p className="text-[11px] text-amber-700">Below minimum quantity threshold</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-800 underline">View Items &rarr;</span>
        </div>

        {/* Expiring Soon Alert Card */}
        <div 
          onClick={() => onNavigate('inventory')}
          className="bg-purple-50/60 p-4 rounded-xl border border-purple-200/80 cursor-pointer hover:bg-purple-100/60 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-800">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-purple-900">Expiring Within 30 Days</div>
              <div className="text-xl font-bold text-purple-900 font-mono">{expiringSoonProducts.length} items</div>
              <p className="text-[11px] text-purple-700">Requires priority rotation</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-purple-800 underline">View Items &rarr;</span>
        </div>

        {/* Expired Products Alert Card */}
        <div 
          onClick={() => onNavigate('inventory')}
          className="bg-red-50/60 p-4 rounded-xl border border-red-200/80 cursor-pointer hover:bg-red-100/60 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-100 text-red-800">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-red-900">Expired Products</div>
              <div className="text-xl font-bold text-red-900 font-mono">{expiredProducts.length} items</div>
              <p className="text-[11px] text-red-700">Quarantine & disposal needed</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-red-800 underline">View Items &rarr;</span>
        </div>

      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Stock Movement Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Stock Movement Activity</h3>
              <p className="text-xs text-slate-500">Live timeline of Stock In (+) vs Stock Out (-)</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border">
              Real-time Feed
            </span>
          </div>

          <div className="h-64 w-full">
            {movementChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No recent stock movement records
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={movementChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="stockIn" name="Stock In (+)" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                  <Area type="monotone" dataKey="stockOut" name="Stock Out (-)" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Distribution Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Category Distribution</h3>
            <p className="text-xs text-slate-500">Share of available stock by medical category</p>
          </div>

          <div className="h-48 my-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {categoryChartData.slice(0, 4).map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="font-medium text-slate-700 truncate max-w-[140px]">{cat.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{cat.value} units</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Row: Expiring & Low Stock Items + Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Critical Attention Required Widget */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Action Items (Low Stock & Expiring)</span>
              </h3>
              <p className="text-xs text-slate-500">Products requiring immediate re-order or quarantine</p>
            </div>
            <button 
              onClick={() => onNavigate('inventory')}
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              View All &rarr;
            </button>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-80 pr-1 flex-1">
            {[...lowStockProducts, ...expiringSoonProducts, ...expiredProducts].slice(0, 6).map((product) => {
              const stock = product.current_stock ?? 0;
              let badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
              let badgeText = `Low Stock (${stock}/${product.minimum_stock})`;

              if (product.calculated_status === 'EXPIRED') {
                badgeColor = 'bg-red-800 text-white border-red-900';
                badgeText = 'EXPIRED';
              } else if (product.calculated_status === 'EXPIRING_SOON') {
                badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
                badgeText = `Expiring ${product.expiry_date}`;
              } else if (product.calculated_status === 'OUT_OF_STOCK') {
                badgeColor = 'bg-red-100 text-red-800 border-red-200';
                badgeText = 'OUT OF STOCK (0)';
              }

              return (
                <div 
                  key={product.id}
                  onClick={() => onSelectProduct(product, 'stock-in')}
                  className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs truncate">{product.product_name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{product.sku}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Batch: <span className="font-mono font-medium text-slate-700">{product.batch_number}</span> • Mfr: {product.manufacturer_name}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                      {badgeText}
                    </span>
                    <button className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 text-[11px] font-semibold rounded transition-colors">
                      + Stock In
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Activity Timeline Stream */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-600" />
                <span>Recent Activity Stream</span>
              </h3>
              <p className="text-xs text-slate-500">Audit trail of system events & inventory changes</p>
            </div>
            <button 
              onClick={() => onNavigate('transactions')}
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              Full Audit &rarr;
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-80 pr-1 flex-1">
            {activityLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-xs pb-2 border-b border-slate-100 last:border-none">
                <div className="p-1.5 rounded-full bg-slate-100 text-slate-600 mt-0.5 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-800 font-medium leading-snug">{log.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span className="uppercase text-slate-500">{log.event}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
