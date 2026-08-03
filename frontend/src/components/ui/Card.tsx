import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className, glow = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-200 hover:border-slate-700/80 shadow-lg shadow-black/40",
        glow && "before:absolute before:-inset-px before:rounded-xl before:bg-gradient-to-r before:from-cyan-500/20 before:to-blue-600/20 before:opacity-50 before:blur-sm hover:before:opacity-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-base font-semibold text-slate-100 tracking-wide flex items-center gap-2", className)}>{children}</h3>;
}
