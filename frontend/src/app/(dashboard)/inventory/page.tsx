"use client";

import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, Column } from "@/components/ui/DataTable";
import { MOCK_INVENTORY } from "@/mock";
import { InventoryItem } from "@/types";
import { Package, AlertTriangle, Truck, DollarSign, ShoppingCart } from "lucide-react";

export default function InventoryPage() {
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
            <span className="font-bold text-slate-100">{row.quantity.toLocaleString()}</span>
            <span className="text-slate-500">Min: {row.minThreshold.toLocaleString()}</span>
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
          onClick={() => alert(`Purchase Order initiated for ${row.sku} (${row.supplier})`)}
        >
          <ShoppingCart className="w-3 h-3 mr-1 inline" /> Reorder
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
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
        <Button variant="cyan" size="sm" icon={<ShoppingCart className="w-3.5 h-3.5" />}>
          Bulk Reorder Wizard
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Valuation" value="$4.82M" trend={+2.1} icon={<DollarSign className="w-5 h-5" />} statusColor="emerald" />
        <StatCard title="Low Stock Alerts" value="2 Items" subtitle="Requires immediate reorder" icon={<AlertTriangle className="w-5 h-5" />} statusColor="rose" />
        <StatCard title="Active Supplier POs" value="14 Shipments" subtitle="Avg lead time: 4.8d" icon={<Truck className="w-5 h-5" />} statusColor="cyan" />
        <StatCard title="Warehouse Utilization" value="78.4%" subtitle="Bay A-D active" icon={<Package className="w-5 h-5" />} statusColor="blue" />
      </div>

      {/* Stock Data Table */}
      <DataTable
        title="Plant Inventory Roster"
        data={MOCK_INVENTORY}
        columns={columns}
        searchPlaceholder="Search materials, SKUs, suppliers, or locations..."
        searchKey={(row) => `${row.name} ${row.sku} ${row.category} ${row.supplier}`}
      />
    </div>
  );
}
