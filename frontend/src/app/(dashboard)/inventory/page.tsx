"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DataTable, Column } from "@/components/ui/DataTable";
import { MOCK_INVENTORY } from "@/mock";
import { InventoryService } from "@/services";
import { useApiData } from "@/hooks/useApiData";
import { InventoryItem } from "@/types";
import { Package, AlertTriangle, Truck, DollarSign, ShoppingCart, CheckCircle2 } from "lucide-react";

export default function InventoryPage() {
  const { data: inventory, setData: setInventory } = useApiData(
    InventoryService.getStock,
    MOCK_INVENTORY
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleReorder = async (row: InventoryItem) => {
    const res = await InventoryService.reorderItem(row.sku, Math.max(row.minThreshold * 2, 500));
    if (res) {
      setInventory(
        inventory.map((i) =>
          i.sku === row.sku
            ? { ...i, status: "Optimal", quantity: Math.max(i.minThreshold * 2, 500) }
            : i
        )
      );
      showNotice(`Purchase Order successfully initiated for ${row.sku} (${row.supplier})`);
    }
  };

  const handleBulkReorderAll = async () => {
    const lowItems = inventory.filter((i) => i.quantity < i.minThreshold);
    await Promise.all(lowItems.map((item) => InventoryService.reorderItem(item.sku, item.minThreshold * 2)));
    setInventory(
      inventory.map((i) =>
        i.quantity < i.minThreshold
          ? { ...i, status: "Optimal", quantity: i.minThreshold * 2 }
          : i
      )
    );
    setIsWizardOpen(false);
    showNotice(`Bulk replenishment PO executed: ${lowItems.length} materials restocked to optimal levels.`);
  };

  const columns: Column<InventoryItem>[] = [
    {
      header: "SKU / Item Name",
      accessor: (row) => (
        <div>
          <p className="font-semibold text-slate-100">{row.name}</p>
          <span className="font-mono text-cyan-400 text-[10px]">{row.sku}</span>
        </div>
      ),
      sortableKey: "name",
    },
    {
      header: "Category",
      accessor: (row) => <span className="text-slate-300">{row.category}</span>,
      sortableKey: "category",
    },
    {
      header: "Stock Level",
      accessor: (row) => (
        <div className="w-36">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="font-bold text-slate-100">{(row.quantity ?? 0).toLocaleString()}</span>
            <span className="text-slate-500">Min: {(row.minThreshold ?? 0).toLocaleString()}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full ${
                row.quantity < row.minThreshold
                  ? "bg-rose-500"
                  : row.quantity < row.minThreshold * 1.5
                  ? "bg-amber-400"
                  : "bg-cyan-400"
              }`}
              style={{ width: `${Math.min(100, (row.quantity / row.maxCapacity) * 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: "Unit Cost",
      accessor: (row) => <span className="font-mono text-slate-200">${row.unitCost}</span>,
      sortableKey: "unitCost",
    },
    {
      header: "Warehouse Location",
      accessor: (row) => <span className="text-slate-300 text-[11px]">{row.location}</span>,
      sortableKey: "location",
    },
    {
      header: "Supplier & Lead Time",
      accessor: (row) => (
        <div>
          <p className="text-slate-300">{row.supplier}</p>
          <span className="text-[10px] text-slate-500">{row.leadTimeDays} Days Lead Time</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge
          variant={
            row.status === "Optimal"
              ? "success"
              : row.status === "Low Stock"
              ? "warning"
              : "danger"
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Action",
      accessor: (row) => (
        <Button
          variant={row.status !== "Optimal" ? "cyan" : "outline"}
          size="sm"
          onClick={() => handleReorder(row)}
        >
          <ShoppingCart className="w-3 h-3 mr-1 inline" /> Reorder
        </Button>
      ),
    },
  ];

  const lowStockCount = inventory.filter((i) => i.quantity < i.minThreshold).length;

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {notice && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            Smart Inventory & Supply Chain Intelligence
          </h1>
          <p className="text-xs text-slate-400">
            Raw material stock levels, automated safety reorder thresholds, and supplier lead times
          </p>
        </div>
        <Button
          variant="cyan"
          size="sm"
          icon={<ShoppingCart className="w-3.5 h-3.5" />}
          onClick={() => setIsWizardOpen(true)}
        >
          Bulk Reorder Wizard
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Valuation" value={`$${(inventory.reduce((s, i) => s + i.quantity * i.unitCost, 0) / 1e6).toFixed(2)}M`} trend={+2.1} icon={<DollarSign className="w-5 h-5" />} statusColor="emerald" />
        <StatCard title="Low Stock Alerts" value={`${lowStockCount} Items`} subtitle="Requires immediate reorder" icon={<AlertTriangle className="w-5 h-5" />} statusColor="rose" />
        <StatCard title="Active Supplier POs" value="14 Shipments" subtitle="Avg lead time: 4.8d" icon={<Truck className="w-5 h-5" />} statusColor="cyan" />
        <StatCard title="Warehouse Utilization" value="78.4%" subtitle="Bay A-D active" icon={<Package className="w-5 h-5" />} statusColor="blue" />
      </div>

      {/* Stock Data Table */}
      <DataTable
        title="Plant Inventory Roster"
        data={inventory}
        columns={columns}
        searchPlaceholder="Search materials, SKUs, suppliers, or locations..."
        searchKey={(row) => `${row.name} ${row.sku} ${row.category} ${row.supplier}`}
      />

      {/* Bulk Reorder Wizard Modal */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        title="Automated Supply Chain Reorder Wizard"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsWizardOpen(false)}>
              Cancel
            </Button>
            <Button variant="cyan" size="sm" onClick={handleBulkReorderAll}>
              Execute Emergency PO Batch
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-300">
            The AI Supply Chain optimizer identified <strong>{lowStockCount}</strong> raw material(s) below nominal buffer threshold:
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {inventory.filter((i) => i.quantity < i.minThreshold).map((item) => (
              <div key={item.sku} className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{item.sku} • {item.supplier}</p>
                </div>
                <div className="text-right">
                  <span className="text-rose-400 font-bold">{item.quantity} / {item.minThreshold} min</span>
                  <p className="text-[10px] text-cyan-400">+{(item.minThreshold * 2).toLocaleString()} PO units</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 text-[11px]">
            ⚡ Supplier EDI connections verified. Auto-routing via Toray & NSK express dispatch channels.
          </div>
        </div>
      </Modal>
    </div>
  );
}
