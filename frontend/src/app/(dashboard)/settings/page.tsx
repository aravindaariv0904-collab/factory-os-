"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { Settings, Building2, Users, Bell, Key, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { currentUser, factories } = useAppStore();
  const [activeTab, setActiveTab] = useState("organization");
  const [apiKey, setApiKey] = useState("fos_live_key_992014810941829048120");
  const [notice, setNotice] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("Apex Global Manufacturing Inc.");
  const [industry, setIndustry] = useState("Automotive EV & Aerospace Components");
  const [notifSettings, setNotifSettings] = useState({
    emailAlerts: true,
    smsCritical: true,
    slackWebhook: false,
  });

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    showNotice("Organization profile & telemetry topology updated successfully.");
  };

  const handleGenerateKey = () => {
    const newKey = `fos_live_${Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join("")}`;
    setApiKey(newKey);
    showNotice("New Production API Key provisioned and active.");
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

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
          <form onSubmit={handleSaveOrg} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Primary Industry Vertical</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>
            <Button type="submit" variant="cyan" size="sm">
              Save Organization Settings
            </Button>
          </form>
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

      {activeTab === "notifications" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Automated Incident & Alarm Routing</CardTitle>
          </CardHeader>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950">
              <div>
                <p className="font-semibold text-slate-200">Email Shift Digest & Critical Alerts</p>
                <p className="text-[10px] text-slate-400">Receive morning shift summary and immediate P1 alerts</p>
              </div>
              <input
                type="checkbox"
                checked={notifSettings.emailAlerts}
                onChange={(e) => setNotifSettings({ ...notifSettings, emailAlerts: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950">
              <div>
                <p className="font-semibold text-slate-200">SMS / Emergency Pager Dispatch</p>
                <p className="text-[10px] text-slate-400">Direct SMS to plant emergency response technician for machine vibration &gt; 8 mm/s</p>
              </div>
              <input
                type="checkbox"
                checked={notifSettings.smsCritical}
                onChange={(e) => setNotifSettings({ ...notifSettings, smsCritical: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950">
              <div>
                <p className="font-semibold text-slate-200">Slack / Microsoft Teams Webhook</p>
                <p className="text-[10px] text-slate-400">Stream LangGraph copilot insights to #plant-ops channel</p>
              </div>
              <input
                type="checkbox"
                checked={notifSettings.slackWebhook}
                onChange={(e) => setNotifSettings({ ...notifSettings, slackWebhook: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>
            <Button variant="cyan" size="sm" onClick={() => showNotice("Notification channels updated.")}>
              Save Notification Preferences
            </Button>
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
                value={apiKey}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-400 font-mono text-[11px]"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleGenerateKey}>
              Generate New Production Key
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
