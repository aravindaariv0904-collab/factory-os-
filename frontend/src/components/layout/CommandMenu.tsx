"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import {
  Search,
  LayoutDashboard,
  Cpu,
  Wrench,
  ShieldCheck,
  Package,
  BarChart3,
  Bot,
  FileText,
  Upload,
  BookOpen,
  Settings,
  AlertTriangle,
  Zap,
} from "lucide-react";

export function CommandMenu() {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const router = Router();
  const [query, setQuery] = useState("");

  const navigation = [
    { label: "Overview Dashboard", path: "/overview", icon: LayoutDashboard },
    { label: "AI Decision Copilot", path: "/copilot", icon: Bot },
    { label: "Production & Telemetry", path: "/production", icon: Cpu },
    { label: "Predictive Maintenance", path: "/maintenance", icon: Wrench },
    { label: "Quality Control & Yield", path: "/quality", icon: ShieldCheck },
    { label: "Inventory & Supply Chain", path: "/inventory", icon: Package },
    { label: "Analytics Workspace", path: "/analytics", icon: BarChart3 },
    { label: "AI Recommendations", path: "/recommendations", icon: Zap },
    { label: "Incident & Alarms", path: "/alerts", icon: AlertTriangle },
    { label: "Automated Reports", path: "/reports", icon: FileText },
    { label: "Data Ingestion & Hub", path: "/upload", icon: Upload },
    { label: "Knowledge Base SOPs", path: "/knowledge-base", icon: BookOpen },
    { label: "Enterprise Settings", path: "/settings", icon: Settings },
  ];

  function Router() {
    return useRouter();
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filtered = navigation.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-cyan-950/50 overflow-hidden">
        <div className="flex items-center px-4 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search page (e.g., Copilot, Maintenance, CNC Mill)..."
            className="w-full py-4 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          <p className="px-3 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Quick Navigation
          </p>
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left group"
                >
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>{item.label}</span>
                </button>
              );
            })
          ) : (
            <p className="p-4 text-center text-sm text-slate-500">No matching commands found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
