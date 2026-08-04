"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_ALERTS } from "@/mock";
import { AlertService } from "@/services";
import { useApiData } from "@/hooks/useApiData";
import { AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function AlertsPage() {
  const { data: alerts, setData: setAlerts } = useApiData(AlertService.getAlerts, MOCK_ALERTS);

  const handleResolve = async (alertId: string) => {
    await AlertService.resolveAlert(alertId);
    setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, isResolved: true, isRead: true } : a)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          Incident & Critical Alarms Center
        </h1>
        <p className="text-xs text-slate-400">
          Real-time machine threshold alarms, safety limit breaches, and automated event log
        </p>
      </div>

      <div className="space-y-3">
        {alerts.map((alertItem) => (
          <Card
            key={alertItem.id}
            className={`border-l-4 ${
              alertItem.severity === "Critical"
                ? "border-l-rose-500 bg-rose-950/10"
                : "border-l-amber-500 bg-amber-950/10"
            } ${alertItem.isResolved ? "opacity-50" : ""}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={alertItem.severity === "Critical" ? "danger" : "warning"}>
                    {alertItem.severity}
                  </Badge>
                  <span className="text-[10px] text-slate-500">{alertItem.timestamp}</span>
                  {alertItem.isResolved && (
                    <Badge variant="success">Resolved</Badge>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-slate-100">{alertItem.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{alertItem.message}</p>
              </div>

              {!alertItem.isResolved && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  onClick={() => handleResolve(alertItem.id)}
                >
                  Acknowledge & Resolve
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
