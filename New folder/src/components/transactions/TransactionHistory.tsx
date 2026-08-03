import React, { useState, useMemo } from 'react';
import { History, Search, Download, Filter, ArrowDownRight, ArrowUpRight, User, Calendar, Tag } from 'lucide-react';
import { InventoryTransaction } from '../../types/inventory';

interface TransactionHistoryProps {
  transactions: InventoryTransaction[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || (
        (t.product_name && t.product_name.toLowerCase().includes(q)) ||
        (t.sku && t.sku.toLowerCase().includes(q)) ||
        t.reference_number.toLowerCase().includes(q) ||
        (t.remarks && t.remarks.toLowerCase().includes(q))
      );

      const matchesType = selectedType === 'ALL' || t.transaction_type === selectedType;

      return matchesQuery && matchesType;
    });
  }, [transactions, searchQuery, selectedType]);

  const exportCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [
      'Transaction ID,Timestamp,Product Name,SKU,Type,Quantity,Old Stock,New Stock,Reference Number,Operator,Remarks',
      ...filteredTransactions.map(t => [
        `"${t.id}"`,
        `"${new Date(t.created_at).toLocaleString()}"`,
        `"${(t.product_name || '').replace(/"/g, '""')}"`,
        `"${t.sku || ''}"`,
        `"${t.transaction_type}"`,
        t.quantity,
        t.old_quantity ?? 0,
        t.new_quantity ?? 0,
        `"${t.reference_number}"`,
        `"${t.operator || 'System Admin'}"`,
        `"${(t.remarks || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `inventory_audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-brand-600" />
            <span>Stock Transaction History & Audit Log</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable audit record of every Stock In (+) and Stock Out (-) entry logged by operators.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Audit Log CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU, reference number, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              selectedType === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            All Logs ({transactions.length})
          </button>

          <button
            onClick={() => setSelectedType('STOCK_IN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              selectedType === 'STOCK_IN' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Stock In Only (+)
          </button>

          <button
            onClick={() => setSelectedType('STOCK_OUT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              selectedType === 'STOCK_OUT' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Stock Out Only (-)
          </button>
        </div>

      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">SKU</th>
                <th className="p-3 text-center">Type</th>
                <th className="p-3 text-center">Qty Change</th>
                <th className="p-3 text-center">Stock Snapshot (Old &rarr; New)</th>
                <th className="p-3 font-mono">Reference #</th>
                <th className="p-3">Operator</th>
                <th className="p-3">Remarks / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No transaction history found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-slate-600 font-mono text-[11px]">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {tx.product_name || 'Medical Item'}
                    </td>
                    <td className="p-3 font-mono text-slate-700 font-semibold">
                      {tx.sku || '-'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.transaction_type === 'STOCK_IN' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-sm">
                      <span className={tx.transaction_type === 'STOCK_IN' ? 'text-emerald-600' : 'text-amber-600'}>
                        {tx.transaction_type === 'STOCK_IN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-600">
                      <span className="text-slate-400">{tx.old_quantity ?? 0}</span> &rarr; <span className="font-bold text-slate-900">{tx.new_quantity ?? 0}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-800 font-semibold">{tx.reference_number}</td>
                    <td className="p-3 text-slate-600 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tx.operator || 'System Admin'}</span>
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{tx.remarks || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
