import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "cyan";
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = "neutral", className, dot = true }: BadgeProps) {
  const styles = {
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    neutral: "bg-slate-800 text-slate-300 border-slate-700",
  };

  const dotColors = {
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
    info: "bg-blue-400",
    cyan: "bg-cyan-400",
    neutral: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm tracking-wide",
        styles[variant],
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 animate-pulse", dotColors[variant])} />}
      {children}
    </span>
  );
}
