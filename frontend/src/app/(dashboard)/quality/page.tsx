"use client";

import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { MOCK_DEFECTS } from "@/mock";
import { QualityService } from "@/services";
import { useApiData } from "@/hooks/useApiData";
import { DefectLog } from "@/types";
import { ShieldCheck, AlertTriangle, Sparkles, CheckCircle2, Scan } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const defectCategoryData = [
  { name: "Weld Faults", value: 38, color: "#ef4444" },
  { name: "Dimensional Deviation", value: 27, color: "#f59e0b" },
  { name: "Surface Scratches", value: 20, color: "#3b82f6" },
  { name: "Material Porosity", value: 15, color: "#00f0ff" },
];

export default function QualityPage() {
  const { data: defects } = useApiData(QualityService.getDefects, MOCK_DEFECTS);
  const { data: yieldStats } = useApiData(QualityService.getYieldStats, {
    passYield: 98.4,
    scrapRate: 1.6,
    totalInspected: 45200,
  });

  const columns: Column<DefectLog>[] = [
    {
      header: "Log ID / Batch",
      accessor: (row) => (
        <div>
          <span className="font-mono text-cyan-400 font-semibold">{row.id}</span>
          <p className="text-[10px] text-slate-400 font-mono">{row.batchId}</p>
        </div>
      ),
      sortableKey: "id",
    },
    {
      header: "Inspection System",
      accessor: (row) => (
        <div className="flex items-center gap-1.5 text-slate-200">
          <Scan className="w-3.5 h-3.5 text-cyan-400" />
          <span>{row.inspectionType}</span>
        </div>
      ),
      sortableKey: "inspectionType",
    },
    {
      header: "Asset",
      accessor: (row) => <span className="text-slate-300">{row.machineName}</span>,
      sortableKey: "machineName",
    },
    {
      header: "Defect Type",
      accessor: (row) => <span className="font-semibold text-slate-100">{row.defectType}</span>,
      sortableKey: "defectType",
    },
    {
      header: "Severity",
      accessor: (row) => (
        <Badge variant={row.severity === "Critical" ? "danger" : row.severity === "Major" ? "warning" : "info"}>
          {row.severity}
        </Badge>
      ),
    },
    {
      header: "Action Disposition",
      accessor: (row) => (
        <Badge
          variant={
            row.status === "Approved"
              ? "success"
              : row.status === "Quarantined"
              ? "warning"
              : "danger"
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
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          Quality Control & Yield Intelligence
        </h1>
        <p className="text-xs text-slate-400">
          AI computer vision inspection logs, scrap reduction analytics, and defect root-cause analysis
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="First Pass Yield (FPY)" value={`${yieldStats.passYield}%`} trend={+0.8} icon={<CheckCircle2 className="w-5 h-5" />} statusColor="emerald" />
        <StatCard title="Scrap Rate" value={`${yieldStats.scrapRate}%`} trend={-0.3} icon={<AlertTriangle className="w-5 h-5" />} statusColor="rose" />
        <StatCard title="Total Units Inspected" value={(yieldStats.totalInspected ?? 0).toLocaleString()} subtitle="Shift 1 & 2" icon={<Scan className="w-5 h-5" />} statusColor="cyan" />
        <StatCard title="AI Vision Precision" value="99.8%" subtitle="Sub-millimeter camera" icon={<Sparkles className="w-5 h-5" />} statusColor="blue" />
      </div>

      {/* Charts & AI Root Cause */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Defect Type Pareto Distribution</CardTitle>
            <Badge variant="cyan">AI Vision Analytics</Badge>
          </CardHeader>
          <div className="h-64 w-full mt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={defectCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {defectCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend formatter={(val) => <span className="text-xs text-slate-300">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Root Cause Hint Widget */}
        <Card className="border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900/60">
          <CardHeader>
            <CardTitle>
              <Sparkles className="w-4 h-4 text-cyan-400" />
              AI Quality Root Cause Hint
            </CardTitle>
          </CardHeader>
          <div className="space-y-3 mt-2 text-xs">
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/80">
              <span className="font-bold text-rose-400">Weld Fault Cluster Detected</span>
              <p className="text-[11px] text-slate-400 mt-1">
                74% of weld seam defects originated from Laser Cell 03 when assist-gas pressure dropped below 4.0 Bar.
              </p>
              <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-cyan-300 font-semibold">
                <span>Suggested Action: Calibrate Gas Regulator</span>
                <span>94% Conf.</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Inspection Log Table */}
      <DataTable
        title="Inspection Log History"
        data={defects}
        columns={columns}
        searchPlaceholder="Filter defects by batch, inspection system, or machine..."
        searchKey={(row) => `${row.id} ${row.batchId} ${row.defectType} ${row.machineName}`}
      />
    </div>
  );
}
