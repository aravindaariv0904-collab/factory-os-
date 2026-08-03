import React from "react";
import { Card } from "@/components/ui/Card";
import { cn, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number; // percentage change
  trendLabel?: string;
  icon?: React.ReactNode;
  statusColor?: "emerald" | "amber" | "rose" | "cyan" | "blue";
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  unit,
  trend,
  trendLabel = "vs last shift",
  icon,
  statusColor = "cyan",
  subtitle,
}: StatCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <Card className="flex flex-col justify-between overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold text-slate-100 tracking-tight">{value}</span>
            {unit && <span className="text-sm font-semibold text-slate-400">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div
            className={cn(
              "p-2.5 rounded-lg border border-slate-800 bg-slate-900/80 shrink-0",
              statusColor === "cyan" && "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
              statusColor === "emerald" && "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
              statusColor === "amber" && "text-amber-400 border-amber-500/20 bg-amber-500/10",
              statusColor === "rose" && "text-rose-400 border-rose-500/20 bg-rose-500/10",
              statusColor === "blue" && "text-blue-400 border-blue-500/20 bg-blue-500/10"
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
        {trend !== undefined ? (
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center font-medium px-1.5 py-0.5 rounded text-[11px]",
                isPositive && "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
                isNegative && "text-rose-400 bg-rose-500/10 border border-rose-500/20",
                !isPositive && !isNegative && "text-slate-400 bg-slate-800"
              )}
            >
              {isPositive && <TrendingUp className="w-3 h-3 mr-1 inline" />}
              {isNegative && <TrendingDown className="w-3 h-3 mr-1 inline" />}
              {!isPositive && !isNegative && <Minus className="w-3 h-3 mr-1 inline" />}
              {formatPercent(trend)}
            </span>
            <span className="text-slate-400 text-[11px]">{trendLabel}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px]">{subtitle || "Real-time telemetry"}</span>
        )}
      </div>
    </Card>
  );
}
