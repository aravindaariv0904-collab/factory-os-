"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MOCK_MACHINES } from "@/mock";
import { ProductionService, MaintenanceService } from "@/services";
import { useApiData } from "@/hooks/useApiData";
import { Machine } from "@/types";
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Activity,
  Plus,
  BarChart2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const rulDegradationCurve = [
  { day: "Day 1", health: 98 },
  { day: "Day 5", health: 94 },
  { day: "Day 10", health: 88 },
  { day: "Day 15", health: 76 },
  { day: "Day 20", health: 58 },
  { day: "Day 25", health: 32 }, // Degradation zone
];

export default function MaintenancePage() {
  const { data: machines } = useApiData(ProductionService.getMachines, MOCK_MACHINES);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [priority, setPriority] = useState("High Priority (Expedited Repair)");
  const [description, setDescription] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);

  const handleDispatch = async () => {
    if (!selectedMachine) return;
    setIsDispatching(true);
    try {
      await MaintenanceService.scheduleWorkOrder(
        selectedMachine.id,
        priority,
        description || `Preventative maintenance for ${selectedMachine.code}`
      );
      alert(`Work order dispatched for ${selectedMachine.name} to Maintenance Crew #2!`);
    } finally {
      setIsDispatching(false);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            Predictive Asset Health & Maintenance
          </h1>
          <p className="text-xs text-slate-400">
            AI failure mode prediction, Remaining Useful Life (RUL) modeling, and work order dispatch
          </p>
        </div>
        <Button
          variant="cyan"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Work Order
        </Button>
      </div>

      {/* Health Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Overall Fleet Health" value={`${Math.round(machines.reduce((s, m) => s + m.healthScore, 0) / Math.max(1, machines.length))} / 100`} trend={+1.4} icon={<Activity className="w-5 h-5" />} statusColor="emerald" />
        <StatCard title="Critical RUL Warnings" value={`${machines.filter((m) => m.rulHours < 48).length} Machines`} subtitle="&lt; 48h useful life" icon={<AlertTriangle className="w-5 h-5" />} statusColor="rose" />
        <StatCard title="Mean Time Between Failures" value="482 hrs" trend={+5.2} icon={<Clock className="w-5 h-5" />} statusColor="cyan" />
        <StatCard title="Scheduled Work Orders" value="6 Active" subtitle="3 maintenance crews" icon={<Wrench className="w-5 h-5" />} statusColor="blue" />
      </div>

      {/* Machine Fleet Grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Asset Reliability & RUL Prognostics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map((machine) => (
            <Card key={machine.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase">{machine.code}</span>
                    <h3 className="text-sm font-semibold text-slate-100">{machine.name}</h3>
                    <p className="text-xs text-slate-400">{machine.line}</p>
                  </div>
                  <Badge
                    variant={
                      machine.healthScore > 80
                        ? "success"
                        : machine.healthScore > 50
                        ? "warning"
                        : "danger"
                    }
                  >
                    Health: {machine.healthScore}/100
                  </Badge>
                </div>

                {/* RUL Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Remaining Useful Life (RUL)</span>
                    <span
                      className={`font-bold ${
                        machine.rulHours < 100 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {machine.rulHours} Hours
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${
                        machine.rulHours < 100
                          ? "bg-rose-500"
                          : machine.rulHours < 500
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                      style={{ width: `${Math.min(100, (machine.rulHours / 1000) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500">Bearing Temp</span>
                    <p className="font-semibold text-slate-200">{machine.temperature} °C</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Vibration Level</span>
                    <p className="font-semibold text-slate-200">{machine.vibration} mm/s</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Last Maint: {machine.lastMaintenance}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedMachine(machine);
                    setIsModalOpen(true);
                  }}
                >
                  Schedule Work Order
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Predictive SHAP Degradation Curve Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>AI Prognostics: RUL Degradation Curve (CNC Mill X5)</CardTitle>
            <Badge variant="danger">High Failure Probability</Badge>
          </CardHeader>
          <div className="h-60 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rulDegradationCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="health" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* SHAP Feature Importance Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              SHAP Feature Importance
            </CardTitle>
            <span className="text-[10px] text-slate-400">Failure Risk Drivers</span>
          </CardHeader>

          <div className="space-y-3 mt-2 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Spindle Harmonic Vibration</span>
                <span className="font-bold text-rose-400">42%</span>
              </div>
              <div className="w-full h-1.5 rounded bg-slate-800 overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: "42%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Drive Motor Temperature</span>
                <span className="font-bold text-amber-400">31%</span>
              </div>
              <div className="w-full h-1.5 rounded bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-400" style={{ width: "31%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Fluid Hydraulic Pressure Variance</span>
                <span className="font-bold text-cyan-400">27%</span>
              </div>
              <div className="w-full h-1.5 rounded bg-slate-800 overflow-hidden">
                <div className="h-full bg-cyan-400" style={{ width: "27%" }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal Dialog for Work Order Generation */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedMachine ? `Dispatch Work Order: ${selectedMachine.name}` : "Schedule Maintenance Work Order"}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="cyan"
              size="sm"
              disabled={isDispatching}
              onClick={handleDispatch}
            >
              {isDispatching ? "Dispatching..." : "Confirm Dispatch"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Priority Level</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
            >
              <option>High Priority (Expedited Repair)</option>
              <option>Medium Priority (Scheduled Shift Maintenance)</option>
              <option>Routine Inspection</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Work Order Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                selectedMachine
                  ? `Perform preventative replacement of ceramic bearings on ${selectedMachine.code}. Check hydraulic fluid pressure lines.`
                  : "Routine overhaul and calibration."
              }
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
