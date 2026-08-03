"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { Settings, Building2, Users, Bell, Key, Sparkles, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { currentUser, factories } = useAppStore();
  const [activeTab, setActiveTab] = useState("organization");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Enterprise Settings & Configuration
        </h1>
        <p className="text-xs text-slate-400">
          Organization topology, factory sites, user RBAC permissions, and API integrations
        </p>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: "organization", label: "Organization Profile", icon: Building2 },
          { id: "factories", label: "Manufacturing Sites", icon: Building2 },
          { id: "users", label: "Users & RBAC Roles", icon: Users },
          { id: "notifications", label: "Notifications", icon: Bell },
          { id: "api", label: "API Keys & Integrations", icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                activeTab === tab.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "organization" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Enterprise Organization Settings</CardTitle>
          </CardHeader>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Organization Name</label>
              <input
                type="text"
                defaultValue="Apex Global Manufacturing Inc."
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Primary Industry Vertical</label>
              <input
                type="text"
                defaultValue="Automotive EV & Aerospace Components"
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>
            <Button variant="cyan" size="sm">
              Save Organization Settings
            </Button>
          </div>
        </Card>
      )}

      {activeTab === "factories" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {factories.map((f) => (
            <Card key={f.id}>
              <div className="flex justify-between items-start mb-2">
                <Badge variant="cyan">{f.type}</Badge>
                <Badge variant={f.status === "Operational" ? "success" : "warning"}>{f.status}</Badge>
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">{f.name}</h3>
              <p className="text-xs text-slate-400">{f.location}</p>
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs flex justify-between">
                <span>{f.linesCount} Production Lines</span>
                <span className="font-bold text-cyan-400">{f.overallOEE}% OEE</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "users" && (
        <Card>
          <CardHeader>
            <CardTitle>User Roster & Access Rights</CardTitle>
          </CardHeader>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-200">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400">{currentUser.email}</p>
              </div>
              <Badge variant="cyan">{currentUser.role}</Badge>
            </div>
          </div>
        </Card>
      )}

      {activeTab === "api" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>API Keys & LangGraph Endpoints</CardTitle>
          </CardHeader>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Factory OS Live Production API Key</label>
              <input
                type="text"
                readOnly
                defaultValue="fos_live_key_992014810941829048120"
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-400 font-mono text-[11px]"
              />
            </div>
            <Button variant="outline" size="sm">
              Generate New Production Key
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
