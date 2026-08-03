"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MOCK_REPORTS } from "@/mock";
import { FileText, Download, Plus, Clock, CheckCircle2 } from "lucide-react";

export default function ReportsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Automated Executive & Shift Reports
          </h1>
          <p className="text-xs text-slate-400">
            Generate scheduled daily shift digests, weekly OEE briefs, and downtime audit reports
          </p>
        </div>
        <Button variant="cyan" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsModalOpen(true)}>
          Generate Custom Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MOCK_REPORTS.map((rep) => (
          <Card key={rep.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="cyan">{rep.type}</Badge>
                <span className="text-[10px] font-mono text-slate-400">{rep.format}</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{rep.title}</h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> {rep.generatedAt}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <Badge variant="success">{rep.status}</Badge>
              <Button
                variant="outline"
                size="sm"
                icon={<Download className="w-3 h-3" />}
                onClick={() => alert(`Downloading ${rep.title}`)}
              >
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Executive Report"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="cyan"
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                alert("Report compilation queued!");
              }}
            >
              Start Report Compilation
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Report Category</label>
            <select className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200">
              <option>Shift Daily Operations Digest</option>
              <option>Weekly OEE & Asset Reliability Brief</option>
              <option>Unplanned Downtime Pareto Audit</option>
              <option>Quality Control & Defect Analysis</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Output Format</label>
            <select className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200">
              <option>PDF (Executive Presentation)</option>
              <option>XLSX (Raw Telemetry Spreadsheet)</option>
              <option>JSON (API Export)</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
