import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { CommandMenu } from "@/components/layout/CommandMenu";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main App Container */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Top Header Navigation */}
        <TopNav />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandMenu />
    </div>
  );
}
