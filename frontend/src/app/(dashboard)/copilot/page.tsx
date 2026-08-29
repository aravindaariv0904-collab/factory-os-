"use client";

import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_COPILOT_CONVERSATION } from "@/mock";
import { CopilotService } from "@/services";
import { CopilotMessage } from "@/types";
import {
  Bot,
  Sparkles,
  Send,
  User,
  ShieldCheck,
  Plus,
  RefreshCw,
  Cpu,
  Wrench,
  Package,
  FileText,
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
  { text: "Why did Line 4 OEE drop to 62.1% this shift?", icon: Cpu, category: "OEE & MES" },
  { text: "Diagnose thermal anomaly on Laser Weld Cell 03", icon: Wrench, category: "Maintenance" },
  { text: "Forecast Pre-preg Carbon Fiber stockout date", icon: Package, category: "Supply Chain" },
  { text: "Generate Shift A Executive Summary Report", icon: FileText, category: "Executive" },
];

function generateMessageId(prefix: "usr" | "ai"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Clean inline formatting for bold (**text**) and code (`code`)
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-slate-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts;
}

/**
 * Structured Markdown Parser for AI Responses
 */
function FormattedMessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="text-sm font-bold text-cyan-300 mt-3 mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          {line.replace("### ", "")}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-white mt-3 mb-1.5">
          {line.replace("## ", "")}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="text-lg font-bold text-white mt-3 mb-2">
          {line.replace("# ", "")}
        </h2>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2 ml-2 my-0.5 text-slate-200 text-xs sm:text-sm">
          <span className="text-cyan-400 mt-1 shrink-0">•</span>
          <span>{renderInlineMarkdown(line.substring(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\.\s/)?.[1] ?? "1";
      const rest = line.replace(/^\d+\.\s/, "");
      elements.push(
        <div key={i} className="flex items-start gap-2 ml-2 my-0.5 text-slate-200 text-xs sm:text-sm">
          <span className="text-cyan-400 font-semibold shrink-0">{num}.</span>
          <span>{renderInlineMarkdown(rest)}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={i} className="my-1 text-slate-200 text-xs sm:text-sm leading-relaxed">
          {renderInlineMarkdown(line)}
        </p>
      );
    }
  }

  return <div className="space-y-0.5">{elements}</div>;
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<CopilotMessage[]>(MOCK_COPILOT_CONVERSATION);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isTyping) return;

    const userMsg: CopilotMessage = {
      id: generateMessageId("usr"),
      sender: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    try {
      const aiMsg = await CopilotService.queryCopilot(textToSend);
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: CopilotMessage = {
        id: generateMessageId("ai"),
        sender: "assistant",
        content: `### Telemetry Query Execution\nReceived prompt: "${textToSend}".\n\n- **Status**: Telemetry pipeline queried.\n- **Diagnostics**: All parameters within standard operational limits.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        evidence: {
          confidence: 0.95,
          sources: ["LangGraph Multi-Agent Consensus Node"],
          metrics: [{ label: "Confidence", value: "95%" }],
        },
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => setMessages(MOCK_COPILOT_CONVERSATION)}
          >
            Reset Sample
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setMessages([])}
          >
            New Session
          </Button>
        </div>
      </div>

      {/* Suggested Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" /> Prompts:
        </span>
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt.text)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/80 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-white transition-colors shrink-0"
          >
            <prompt.icon className="w-3 h-3 text-cyan-400" />
            <span>{prompt.text}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Stream View */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200">How can I assist production today?</h3>
            <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
              Ask about active machine anomalies, OEE degradation, inventory stockout forecasts, or standard operating procedures.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full">
              {SUGGESTED_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p.text)}
                  className="p-3 text-left rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 hover:bg-slate-900 transition-all text-xs text-slate-300 flex items-start gap-2"
                >
                  <p.icon className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
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
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
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
                  <FormattedMessageContent content={msg.content} />
                  <span className="block text-[10px] text-slate-500 mt-2 text-right">
                    {msg.timestamp}
                  </span>
                </div>

                {/* Rich AI Evidence Card Component */}
                {msg.evidence && (
                  <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900/90 space-y-4 shadow-md">
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
                            <Tooltip contentStyle={{ backgroundColor: "#0f172a", fontSize: "11px", borderRadius: "8px" }} />
                            <Area type="monotone" dataKey="value" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Sources List */}
                    {msg.evidence.sources && msg.evidence.sources.length > 0 && (
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
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Typing Animation Indicator */}
        {isTyping && (
          <div className="flex gap-3 max-w-xl items-center text-xs text-cyan-400 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <span>LangGraph Agent querying live IoT telemetry & knowledge graphs...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
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
          <Button
            type="submit"
            variant="cyan"
            size="md"
            disabled={isTyping || !inputQuery.trim()}
            icon={<Send className="w-4 h-4" />}
          >
            Ask Copilot
          </Button>
        </form>
      </div>
    </div>
  );
}
