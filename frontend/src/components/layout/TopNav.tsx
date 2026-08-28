"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Bell,
  Search,
  Moon,
  Sun,
  Factory as FactoryIcon,
  ChevronDown,
  Plus,
  Radio,
  User,
  LogOut,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function TopNav() {
  const {
    activeFactory,
    factories,
    setActiveFactory,
    theme,
    toggleTheme,
    setCommandPaletteOpen,
    alerts,
    currentUser,
    init,
  } = useAppStore();

  useEffect(() => {
    init();
  }, [init]);

  const [isFactoryMenuOpen, setIsFactoryMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const unreadAlerts = alerts.filter((a) => !a.isRead);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
      {/* Left: Factory Selector & Status */}
      <div className="flex items-center gap-4">
        {/* Factory Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsFactoryMenuOpen(!isFactoryMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <FactoryIcon className="w-4 h-4 text-cyan-400" />
            <span className="max-w-[180px] sm:max-w-[240px] truncate">{activeFactory.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isFactoryMenuOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-50">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase text-slate-500">
                Switch Manufacturing Site
              </p>
              {factories.map((factory) => (
                <button
                  key={factory.id}
                  onClick={() => {
                    setActiveFactory(factory.id);
                    setIsFactoryMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                >
                  <div>
                    <p className="font-semibold text-slate-200">{factory.name}</p>
                    <p className="text-[10px] text-slate-400">{factory.location}</p>
                  </div>
                  {factory.id === activeFactory.id && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Telemetry Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-400">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>IoT Telemetry: Live (100 Hz)</span>
        </div>
      </div>

      {/* Right: Quick Actions, Search, Notifications, Theme & Profile */}
      <div className="flex items-center gap-3">
        {/* Command Search Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-slate-700 text-xs text-slate-400 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search command...</span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Quick Action Button */}
        <Button
          variant="cyan"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setCommandPaletteOpen(true)}
        >
          Quick Action
        </Button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200">Alerts & Notifications</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                  {unreadAlerts.length} Unread
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-2 rounded-lg border border-slate-800 bg-slate-950/60 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{alert.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{alert.message}</p>
                    <p className="text-[9px] text-slate-500 mt-1.5">{alert.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors"
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center font-bold text-[10px] text-cyan-300">
              AV
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-200">
              {currentUser.name}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="font-semibold text-slate-200">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400">{currentUser.email}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-bold">
                  {currentUser.role}
                </span>
              </div>
              <a href="/settings" className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Profile Settings
              </a>
              <a href="/login" className="flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg">
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                Sign Out
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
