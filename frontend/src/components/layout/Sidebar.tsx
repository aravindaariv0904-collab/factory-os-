"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bot,
  Cpu,
  Wrench,
  ShieldCheck,
  Package,
  BarChart3,
  Zap,
  AlertTriangle,
  Upload,
  FileText,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Pin,
  Sparkles,
  Factory as FactoryIcon,
  Search,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar, setCommandPaletteOpen, activeFactory, pinnedPages } =
    useAppStore();

  const groups = [
    {
      title: "Core",
      items: [
        { label: "Overview", path: "/overview", icon: LayoutDashboard },
        { label: "AI Copilot", path: "/copilot", icon: Bot, badge: "AI" },
      ],
    },
    {
      title: "Operations",
      items: [
        { label: "Production", path: "/production", icon: Cpu },
        { label: "Maintenance", path: "/maintenance", icon: Wrench },
        { label: "Quality", path: "/quality", icon: ShieldCheck },
        { label: "Inventory", path: "/inventory", icon: Package },
      ],
    },
    {
      title: "Intelligence",
      items: [
        { label: "Analytics", path: "/analytics", icon: BarChart3 },
        { label: "Recommendations", path: "/recommendations", icon: Zap, badge: "3" },
        { label: "Alerts", path: "/alerts", icon: AlertTriangle, badge: "1 Critical" },
      ],
    },
    {
      title: "Management",
      items: [
        { label: "Data Upload", path: "/upload", icon: Upload },
        { label: "Reports", path: "/reports", icon: FileText },
        { label: "Knowledge Base", path: "/knowledge-base", icon: BookOpen },
        { label: "Settings", path: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen border-r border-slate-800/80 bg-slate-950/90 text-slate-300 transition-all duration-300 z-30 select-none shrink-0",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
        <Link href="/overview" className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 shrink-0">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          {!isSidebarCollapsed && (
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1">
                Factory<span className="text-cyan-400">OS</span>
              </h1>
              <p className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                Decision Intelligence
              </p>
            </div>
          )}
        </Link>

        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Active Factory Banner */}
      {!isSidebarCollapsed && (
        <div className="mx-3 mt-3 p-2.5 rounded-lg border border-cyan-500/20 bg-cyan-950/20 flex items-center gap-2.5">
          <FactoryIcon className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Active Site</p>
            <p className="text-xs font-semibold text-slate-200 truncate">{activeFactory.name}</p>
          </div>
        </div>
      )}

      {/* Quick Search Button */}
      <div className="px-3 mt-3">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-slate-700 text-xs text-slate-400 transition-colors",
            isSidebarCollapsed && "justify-center px-0"
          )}
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            {!isSidebarCollapsed && <span>Search...</span>}
          </div>
          {!isSidebarCollapsed && (
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
              Ctrl+K
            </kbd>
          )}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {groups.map((group) => (
          <div key={group.title}>
            {!isSidebarCollapsed && (
              <p className="px-2 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group",
                        isActive
                          ? "bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-900/30"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
                          )}
                        />
                        {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isSidebarCollapsed && item.badge && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                            item.badge === "AI"
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                              : item.badge.includes("Critical")
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse"
                              : "bg-slate-800 text-slate-300"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer User Avatar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-xs text-cyan-300 shrink-0">
            AV
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">Alexander Vance</p>
              <p className="text-[10px] text-slate-400 truncate">Plant Manager</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
