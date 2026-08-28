"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DataTable, Column } from "@/components/ui/DataTable";
import { MOCK_PRODUCTION_ORDERS, MOCK_DOWNTIME_EVENTS } from "@/mock";
import { ProductionService } from "@/services";
import { useApiData } from "@/hooks/useApiData";
import { ProductionOrder } from "@/types";
import {
  Cpu,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Download,
  Filter,
  Plus,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const utilizationData = [
  { line: "Line 1 Stamping", util: 92.4 },
  { line: "Line 2 Battery", util: 96.8 },
  { line: "Line 3 Paint", util: 84.1 },
  { line: "Line 4 CNC", util: 62.1 },
  { line: "Line 5 Assembly", util: 89.5 },
];

export default function ProductionPage() {
  const { data: orders, setData: setOrders } = useApiData(ProductionService.getProductionOrders, MOCK_PRODUCTION_ORDERS);
  const { data: downtimes } = useApiData(ProductionService.getDowntimeEvents, MOCK_DOWNTIME_EVENTS);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState("All Shifts");
  const [newOrder, setNewOrder] = useState({
    productName: "EV Battery Pack Tray - Subframe B",
    sku: "SKU-EV-BATT-042",
    line: "Line 2 - Battery Assembly",
    targetQuantity: 1200,
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const created: ProductionOrder = {
      id: `ord_${Date.now()}`,
      orderNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      productName: newOrder.productName,
      sku: newOrder.sku,
      line: newOrder.line,
      targetQuantity: Number(newOrder.targetQuantity),
      producedQuantity: 0,
      defectiveQuantity: 0,
      status: "Scheduled",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "—",
      oee: 88.0,
    };
    setOrders([created, ...orders]);
    setIsNewOrderOpen(false);
  };

  const activeWorkOrders = orders.filter((o) => o.status === "In Progress").length;
  const totalProduced = orders.reduce((sum, o) => sum + o.producedQuantity, 0);
  const downtimeCost = downtimes.reduce((sum, d) => sum + d.impactCost, 0);
  const avgUtilization = orders.length
    ? Math.round(orders.reduce((sum, o) => sum + o.oee, 0) / orders.length)
    : 84.9;

  const columns: Column<ProductionOrder>[] = [
    {
      header: "Order #",
      accessor: (row) => <span className="font-mono text-cyan-400 font-semibold">{row.orderNumber}</span>,
      sortableKey: "orderNumber",
    },
    {
      header: "Product / SKU",
      accessor: (row) => (
        <div>
          <p className="font-semibold text-slate-100">{row.productName}</p>
          <p className="text-[10px] text-slate-400 font-mono">{row.sku}</p>
        </div>
      ),
      sortableKey: "productName",
    },
    {
      header: "Production Line",
      accessor: (row) => <span className="text-slate-300">{row.line}</span>,
      sortableKey: "line",
    },
    {
      header: "Units (Produced / Target)",
      accessor: (row) => (
        <div className="w-32">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="font-bold text-slate-200">{(row.producedQuantity ?? 0).toLocaleString()}</span>
            <span className="text-slate-500">/ {(row.targetQuantity ?? 0).toLocaleString()}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-cyan-400"
              style={{ width: `${Math.min(100, ((row.producedQuantity ?? 0) / (row.targetQuantity || 1)) * 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: "Defects",
      accessor: (row) => (
        <span className={row.defectiveQuantity > 20 ? "text-rose-400 font-bold" : "text-slate-400"}>
          {row.defectiveQuantity}
        </span>
      ),
    },
    {
      header: "OEE Score",
      accessor: (row) => (
        <Badge variant={row.oee > 85 ? "success" : row.oee > 70 ? "warning" : "danger"}>
          {row.oee}%
        </Badge>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge
          variant={
            row.status === "Completed"
              ? "success"
              : row.status === "In Progress"
              ? "cyan"
              : row.status === "Delayed"
              ? "danger"
              : "neutral"
          }
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Production Operations & Work Orders
          </h1>
          <p className="text-xs text-slate-400">
            Real-time shift output, line utilization, and production schedule management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Filter className="w-3.5 h-3.5" />}
            onClick={() => setIsFilterOpen(true)}
          >
            {selectedShift}
          </Button>
          <Button
            variant="cyan"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsNewOrderOpen(true)}
          >
            New Work Order
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Work Orders" value={String(activeWorkOrders)} subtitle={`${downtimes.length} recorded incidents`} icon={<Clock className="w-5 h-5" />} statusColor="cyan" />
        <StatCard title="Shift Produced Units" value={(totalProduced ?? 0).toLocaleString()} trend={+4.5} icon={<CheckCircle2 className="w-5 h-5" />} statusColor="emerald" />
        <StatCard title="Machine Utilization" value={`${avgUtilization}%`} trend={-1.2} icon={<Cpu className="w-5 h-5" />} statusColor="amber" />
        <StatCard title="Line Downtime Cost" value={`$${(downtimeCost ?? 0).toLocaleString()}`} subtitle={`${downtimes.filter((d) => d.status !== "Resolved").length} active incidents`} icon={<AlertTriangle className="w-5 h-5" />} statusColor="rose" />
      </div>

      {/* Utilization Chart & Downtime Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Line Utilization Rate (%)</CardTitle>
            <Badge variant="cyan">Target: &gt;85%</Badge>
          </CardHeader>
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="line" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="util" fill="#00f0ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Downtime Event Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Line Downtimes</CardTitle>
            <span className="text-[10px] text-slate-400">Shift 1 Log</span>
          </CardHeader>
          <div className="space-y-3 mt-2">
            {downtimes.map((dt) => (
              <div key={dt.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span className="truncate">{dt.machineName}</span>
                  <Badge variant={dt.status === "Resolved" ? "success" : "danger"}>{dt.status}</Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{dt.reason}</p>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                  <span>Duration: {dt.durationMinutes}m</span>
                  <span className="text-rose-400 font-bold">Cost: ${(dt.impactCost ?? 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Production Order Table */}
      <DataTable
        title="Active Shift Work Orders"
        data={orders}
        columns={columns}
        searchPlaceholder="Filter by order #, product name, or line..."
        searchKey={(row) => `${row.orderNumber} ${row.productName} ${row.line}`}
      />

      {/* New Work Order Modal */}
      <Modal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        title="Create Production Work Order"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsNewOrderOpen(false)}>
              Cancel
            </Button>
            <Button variant="cyan" size="sm" onClick={handleCreateOrder}>
              Dispatch Order to MES
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateOrder} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name</label>
            <input
              type="text"
              required
              value={newOrder.productName}
              onChange={(e) => setNewOrder({ ...newOrder, productName: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">SKU Code</label>
            <input
              type="text"
              required
              value={newOrder.sku}
              onChange={(e) => setNewOrder({ ...newOrder, sku: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Production Line Assignment</label>
            <select
              value={newOrder.line}
              onChange={(e) => setNewOrder({ ...newOrder, line: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
            >
              <option>Line 1 - Stamping & Press</option>
              <option>Line 2 - Battery Assembly</option>
              <option>Line 3 - Paint Shop</option>
              <option>Line 4 - Gearbox Machining</option>
              <option>Line 5 - Final Subframe Assembly</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Quantity (Units)</label>
            <input
              type="number"
              required
              min={10}
              value={newOrder.targetQuantity}
              onChange={(e) => setNewOrder({ ...newOrder, targetQuantity: Number(e.target.value) })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
            />
          </div>
        </form>
      </Modal>

      {/* Shift Filter Modal */}
      <Modal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter by Shift Operations"
        footer={
          <Button variant="cyan" size="sm" onClick={() => setIsFilterOpen(false)}>
            Apply Shift Filter
          </Button>
        }
      >
        <div className="space-y-2">
          {["All Shifts", "Shift A (06:00 - 14:00)", "Shift B (14:00 - 22:00)", "Shift C (22:00 - 06:00)"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSelectedShift(s);
                setIsFilterOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                selectedShift === s
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-semibold"
                  : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900"
              }`}
            >
              <span>{s}</span>
              {selectedShift === s && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
