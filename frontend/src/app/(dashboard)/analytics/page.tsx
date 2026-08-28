"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BarChart3, Download, Calendar, Filter, Layers } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const shiftAnalytics = [
  { shift: "Shift A (Morning)", oee: 89.4, yield: 98.8, downtime: 18 },
  { shift: "Shift B (Evening)", oee: 86.2, yield: 97.9, downtime: 42 },
  { shift: "Shift C (Night)", oee: 82.0, yield: 96.5, downtime: 65 },
];

const correlationData = [
  { temp: 45, vibration: 1.2, health: 98 },
  { temp: 52, vibration: 1.8, health: 95 },
  { temp: 64, vibration: 2.5, health: 89 },
  { temp: 78, vibration: 5.4, health: 68 },
  { temp: 85, vibration: 8.9, health: 32 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("Last 7 Days");
  const [notice, setNotice] = useState<string | null>(null);

  const handleExport = () => {
    const csvContent = "Shift,OEE_Score,Pass_Yield,Unplanned_Downtime_Mins\nShift A (Morning),89.4,98.8,18\nShift B (Evening),86.2,97.9,42\nShift C (Night),82.0,96.5,65";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `factory_os_analytics_${dateRange.toLowerCase().replace(/[^a-z0-9]/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotice(`Exported analytics dataset for ${dateRange} (CSV)`);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <span>✓ {notice}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Enterprise Manufacturing Analytics Workspace
          </h1>
          <p className="text-xs text-slate-400">
            Multi-dimensional OEE correlation, thermal telemetry dynamics, and shift performance audits
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent focus:outline-none text-xs text-slate-200"
            >
              <option className="bg-slate-900">Today (Real-time)</option>
              <option className="bg-slate-900">Last 7 Days</option>
              <option className="bg-slate-900">Last 30 Days</option>
              <option className="bg-slate-900">Quarter to Date</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExport}
          >
            Export Dataset
          </Button>
        </div>
      </div>

      {/* Analytics Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shift OEE & Yield Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Shift Performance & Yield Comparison</CardTitle>
            <Badge variant="cyan">{dateRange}</Badge>
          </CardHeader>
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftAnalytics} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="shift" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[70, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="oee" fill="#00f0ff" name="OEE Score (%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="yield" fill="#3b82f6" name="Pass Yield (%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Temperature vs Vibration Correlation Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Thermal-Vibration Degradation Correlation</CardTitle>
            <Badge variant="warning">Anomalies Detected</Badge>
          </CardHeader>
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={correlationData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="temp" stroke="#64748b" fontSize={11} unit="°C" />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="vibration" stroke="#ef4444" strokeWidth={2.5} name="Vibration (mm/s)" />
                <Line type="monotone" dataKey="health" stroke="#00f0ff" strokeWidth={2.5} name="Asset Health Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
