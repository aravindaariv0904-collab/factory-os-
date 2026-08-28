"use client";

import React from "react";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import {
  MOCK_MACHINES,
  MOCK_RECOMMENDATIONS,
} from "@/mock";
import { ProductionService, MaintenanceService, AnalyticsService } from "@/services";
import { useApiData } from "@/hooks/useApiData";
import {
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Radio,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

const oeeTrendData = [
  { time: "06:00", oee: 84.2, availability: 91.0, performance: 92.5 },
  { time: "08:00", oee: 86.5, availability: 92.4, performance: 94.0 },
  { time: "10:00", oee: 88.9, availability: 95.0, performance: 95.2 },
  { time: "12:00", oee: 82.1, availability: 89.2, performance: 91.0 },
  { time: "14:00", oee: 87.4, availability: 94.5, performance: 96.1 },
  { time: "16:00", oee: 89.8, availability: 96.0, performance: 97.0 },
];

const downtimePareto = [
  { category: "Unplanned Mechanical", minutes: 145, cost: 18500 },
  { category: "Tooling Change", minutes: 42, cost: 4200 },
  { category: "Material Shortage", minutes: 28, cost: 2900 },
  { category: "Operator Delay", minutes: 18, cost: 1400 },
];

export default function OverviewPage() {
  const { activeFactory } = useAppStore();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const { data: machines, refetch: refetchMachines } = useApiData(ProductionService.getMachines, MOCK_MACHINES);
  const { data: recommendations, refetch: refetchRecs } = useApiData(MaintenanceService.getRecommendations, MOCK_RECOMMENDATIONS);
  const { data: oee, refetch: refetchOee } = useApiData(AnalyticsService.getOEE, {
    overall_oee: 87.4,
    availability: 94.5,
    performance: 96.1,
    quality: 98.4,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchMachines?.(), refetchRecs?.(), refetchOee?.()]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="space-y-6">
      {/* Executive Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-blue-950/40 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Executive Manufacturing Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-300">
            Real-time decision intelligence telemetry for{" "}
            <span className="font-semibold text-cyan-300">{activeFactory.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            onClick={handleRefresh}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Telemetry"}
          </Button>
          <a href="/copilot">
            <Button variant="cyan" size="sm" icon={<Zap className="w-3.5 h-3.5" />}>
              Ask AI Copilot
            </Button>
          </a>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall OEE"
          value={`${oee?.overall_oee?.toFixed(1) ?? "87.4"}%`}
          trend={+3.2}
          icon={<Activity className="w-5 h-5" />}
          statusColor="cyan"
        />
        <StatCard
          title="Line Availability"
          value={`${oee?.availability?.toFixed(1) ?? "94.5"}%`}
          trend={+1.8}
          icon={<CheckCircle2 className="w-5 h-5" />}
          statusColor="emerald"
        />
        <StatCard
          title="Performance Efficiency"
          value={`${oee?.performance?.toFixed(1) ?? "96.1"}%`}
          trend={-0.4}
          icon={<Cpu className="w-5 h-5" />}
          statusColor="amber"
        />
        <StatCard
          title="First Pass Yield"
          value={`${oee?.quality?.toFixed(1) ?? "98.4"}%`}
          trend={+0.9}
          icon={<Sparkles className="w-5 h-5" />}
          statusColor="blue"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OEE Time-series Trend */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle>
              <Activity className="w-4 h-4 text-cyan-400" />
              OEE & Telemetry 24-Hour Trend
            </CardTitle>
            <Badge variant="cyan">Live 100 Hz</Badge>
          </CardHeader>
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={oeeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="oeeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[70, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="oee"
                  stroke="#00f0ff"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#oeeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Downtime Pareto Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Unplanned Downtime Pareto
            </CardTitle>
            <span className="text-[10px] text-slate-400">Total: 233 mins</span>
          </CardHeader>
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={downtimePareto} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={9} width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="minutes" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Machine Telemetry Grid & AI Prescriptive Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Machines IoT Grid */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <Cpu className="w-4 h-4 text-cyan-400" />
              Key Production Asset Status
            </CardTitle>
            <a href="/production" className="text-xs text-cyan-400 hover:underline">
              View All 42 Assets
            </a>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {machines.slice(0, 4).map((machine) => (
              <div
                key={machine.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase">{machine.code}</span>
                    <h4 className="text-xs font-semibold text-slate-100 truncate">{machine.name}</h4>
                    <p className="text-[10px] text-slate-400">{machine.line}</p>
                  </div>
                  <Badge
                    variant={
                      machine.status === "Running"
                        ? "success"
                        : machine.status === "Down"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {machine.status}
                  </Badge>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500">OEE Score</span>
                    <p className="font-bold text-slate-200">{machine.oee}%</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">RUL</span>
                    <p className="font-bold text-amber-400">{machine.rulHours}h</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Vibration</span>
                    <p className="font-bold text-slate-200">{machine.vibration} mm/s</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top AI Prescriptive Action Widget */}
        <Card className="border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900/60">
          <CardHeader>
            <CardTitle>
              <Zap className="w-4 h-4 text-cyan-400" />
              AI Prescriptive Actions
            </CardTitle>
            <Badge variant="cyan">96% Conf.</Badge>
          </CardHeader>

          <div className="space-y-3 mt-2">
            {recommendations.slice(0, 2).map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-lg border border-slate-800 bg-slate-950/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 line-clamp-1">{rec.title}</span>
                  <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                    +${(rec.estimatedSavings ?? 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{rec.description}</p>
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="text-slate-500">{rec.createdAt}</span>
                  <a href="/recommendations" className="text-cyan-400 hover:underline flex items-center gap-1 font-medium">
                    Apply Action <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
