"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MOCK_REPORTS } from "@/mock";
import { ReportService } from "@/services";
import { useApiData } from "@/hooks/useApiData";
import { FileText, Download, Plus, Clock, CheckCircle2 } from "lucide-react";

export default function ReportsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: reports, setData: setReports } = useApiData(ReportService.getReports, MOCK_REPORTS);
  const [category, setCategory] = useState("Shift Daily Operations Digest");
  const [format, setFormat] = useState("PDF");

  const handleGenerate = async () => {
    const newReport = await ReportService.generateReport(category, format);
    setReports([newReport, ...reports]);
    setIsModalOpen(false);
  };

  const handleDownload = (rep: { title: string; format: string; type: string }) => {
    const content = `FACTORY OS ENTERPRISE INTELLIGENCE REPORT\n=========================================\nTitle: ${rep.title}\nCategory: ${rep.type}\nGenerated: ${new Date().toISOString()}\nFormat: ${rep.format}\nStatus: Certified\n\nExecutive Metrics Summary:\n- Overall Plant OEE: 87.4%\n- First Pass Yield: 98.4%\n- Machine Availability: 94.5%\n- Active Incident Count: 1 (Investigating)\n\nCertified by Factory OS AI Decision Engine.`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${rep.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.${rep.format.toLowerCase() === "pdf" ? "txt" : rep.format.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        {reports.map((rep) => (
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
                onClick={() => handleDownload(rep)}
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
              onClick={handleGenerate}
            >
              Start Report Compilation
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Report Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
            >
              <option>Shift Daily Operations Digest</option>
              <option>Weekly OEE & Asset Reliability Brief</option>
              <option>Unplanned Downtime Pareto Audit</option>
              <option>Quality Control & Defect Analysis</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Output Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
            >
              <option>PDF</option>
              <option>XLSX</option>
              <option>JSON</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
