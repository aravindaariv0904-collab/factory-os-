"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_COPILOT_CONVERSATION } from "@/mock";
import { CopilotMessage } from "@/types";
import {
  Bot,
  Sparkles,
  Send,
  User,
  ShieldCheck,
  TrendingUp,
  FileText,
  Clock,
  Plus,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const SUGGESTED_PROMPTS = [
  "Why did Line 4 OEE drop to 62.1% this shift?",
  "Diagnose thermal anomaly on Laser Weld Cell 03",
  "Forecast Pre-preg Carbon Fiber stockout date",
  "Generate Shift A Executive Summary Report",
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<CopilotMessage[]>(MOCK_COPILOT_CONVERSATION);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg: CopilotMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    // Simulate AI response with evidence card
    setTimeout(() => {
      const aiMsg: CopilotMessage = {
        id: `ai_${Date.now()}`,
        sender: "assistant",
        content: `### LangGraph Decision Engine Analysis\nIn response to your query regarding **"${textToSend}"**:\n\n1. **Diagnostic Findings**: Real-time multi-variate telemetry correlation confirms a **96.4% statistical confidence** match with historical bearing wear patterns.\n2. **Financial Quantification**: Proactive intervention will prevent an estimated **$34,500** in scrap and unplanned line stoppage.\n3. **Recommended Prescriptive Protocol**: Execute Work Order #WO-9012 within the next 4 hours.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        evidence: {
          confidence: 0.96,
          sources: [
            "LangGraph Agent Node v2.4",
            "IoT High-Frequency Vibration Telemetry",
            "SAP Enterprise Maintenance History",
          ],
          metrics: [
            { label: "Confidence", value: "96.4%", trend: "High" },
            { label: "Est. Savings", value: "$34,500", trend: "Saved" },
            { label: "Risk Mitigation", value: "Optimal", trend: "Passed" },
          ],
          chartData: [
            { name: "08:00", value: 94 },
            { name: "10:00", value: 92 },
            { name: "12:00", value: 85 },
            { name: "14:00", value: 72 },
            { name: "16:00", value: 96 },
          ],
          recommendations: [
            "Dispatch Maintenance Crew #1 to inspect spindle housing",
            "Verify lubrication pressure on Hydraulic Cylinder B",
          ],
        },
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      {/* Copilot Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
            <Bot className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Factory OS Decision Intelligence Copilot
              <Badge variant="cyan">LangGraph Agentic Engine</Badge>
            </h1>
            <p className="text-xs text-slate-400">
              Natural language conversational assistant backed by real-time telemetry & enterprise KB
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setMessages([])}
        >
          New Session
        </Button>
      </div>

      {/* Suggested Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" /> Prompts:
        </span>
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/80 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-white transition-colors shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Stream View */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-4xl ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20"
              }`}
            >
              {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Message Bubble */}
            <div className="space-y-3 flex-1">
              <div
                className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-blue-600/20 border-blue-500/40 text-slate-100 rounded-tr-none"
                    : "bg-slate-900/90 border-slate-800 text-slate-200 rounded-tl-none shadow-lg shadow-black/40"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <span className="block text-[10px] text-slate-500 mt-2 text-right">
                  {msg.timestamp}
                </span>
              </div>

              {/* Rich AI Evidence Card Component */}
              {msg.evidence && (
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900/90 space-y-4">
                  {/* Confidence Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" /> Grounded Evidence Analysis
                    </span>
                    <Badge variant="cyan">{Math.round(msg.evidence.confidence * 100)}% Confidence Score</Badge>
                  </div>

                  {/* Evidence Metrics */}
                  {msg.evidence.metrics && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {msg.evidence.metrics.map((m, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                          <span className="text-[10px] text-slate-500">{m.label}</span>
                          <p className="font-bold text-slate-200">{m.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Data Chart Preview */}
                  {msg.evidence.chartData && (
                    <div className="h-36 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={msg.evidence.chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", fontSize: "11px" }} />
                          <Area type="monotone" dataKey="value" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Sources List */}
                  <div className="pt-2 border-t border-slate-800 text-xs">
                    <span className="text-[10px] font-semibold uppercase text-slate-500">Cited Data Sources:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {msg.evidence.sources.map((src, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Animation Simulator */}
        {isTyping && (
          <div className="flex gap-3 max-w-xl items-center text-xs text-cyan-400 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <span>LangGraph Agent querying live IoT telemetry & knowledge graphs...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="pt-2 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 p-2 rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask AI Copilot about OEE, maintenance predictions, quality defects, or inventory..."
            className="flex-1 px-3 py-2 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <Button type="submit" variant="cyan" size="md" icon={<Send className="w-4 h-4" />}>
            Ask Copilot
          </Button>
        </form>
      </div>
    </div>
  );
}
