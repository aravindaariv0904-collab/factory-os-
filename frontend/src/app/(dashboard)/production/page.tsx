"use client";

import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
  const { data: orders } = useApiData(ProductionService.getProductionOrders, MOCK_PRODUCTION_ORDERS);
  const { data: downtimes } = useApiData(ProductionService.getDowntimeEvents, MOCK_DOWNTIME_EVENTS);

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
            <span className="font-bold text-slate-200">{row.producedQuantity.toLocaleString()}</span>
            <span className="text-slate-500">/ {row.targetQuantity.toLocaleString()}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-cyan-400"
              style={{ width: `${Math.min(100, (row.producedQuantity / row.targetQuantity) * 100)}%` }}
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
          <Button variant="outline" size="sm" icon={<Filter className="w-3.5 h-3.5" />}>
            Shift Filters
          </Button>
          <Button variant="cyan" size="sm" icon={<Play className="w-3.5 h-3.5" />}>
            New Work Order
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Work Orders" value={String(activeWorkOrders)} subtitle={`${downtimes.length} recorded incidents`} icon={<Clock className="w-5 h-5" />} statusColor="cyan" />
        <StatCard title="Shift Produced Units" value={totalProduced.toLocaleString()} trend={+4.5} icon={<CheckCircle2 className="w-5 h-5" />} statusColor="emerald" />
        <StatCard title="Machine Utilization" value={`${avgUtilization}%`} trend={-1.2} icon={<Cpu className="w-5 h-5" />} statusColor="amber" />
        <StatCard title="Line Downtime Cost" value={`$${downtimeCost.toLocaleString()}`} subtitle={`${downtimes.filter((d) => d.status !== "Resolved").length} active incidents`} icon={<AlertTriangle className="w-5 h-5" />} statusColor="rose" />
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
                  <span className="text-rose-400 font-bold">Cost: ${dt.impactCost.toLocaleString()}</span>
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
    </div>
  );
}
