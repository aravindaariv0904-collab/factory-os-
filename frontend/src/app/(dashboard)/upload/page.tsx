"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Upload, FileSpreadsheet, Database, CheckCircle2, RefreshCw, ArrowRight, ShieldCheck } from "lucide-react";
import { UploadService } from "@/services";

interface UploadMeta {
  filename?: string;
  status?: string;
  record_count?: number;
}

export default function DataUploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [uploadMeta, setUploadMeta] = useState<UploadMeta | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const mockMapping = [
    { sourceColumn: "Machine_ID", mappedField: "machineId", dataType: "String", status: "Valid" },
    { sourceColumn: "Timestamp_UTC", mappedField: "timestamp", dataType: "DateTime", status: "Valid" },
    { sourceColumn: "Vibration_Harmonic_Val", mappedField: "vibration", dataType: "Float", status: "Valid" },
    { sourceColumn: "Thermal_Sensor_DegC", mappedField: "temperature", dataType: "Float", status: "Valid" },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const meta = await UploadService.uploadFile(file);
      setUploadMeta(meta);
      setFileUploaded(true);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <Upload className="w-5 h-5 text-cyan-400" />
          Manufacturing Data Ingestion Hub
        </h1>
        <p className="text-xs text-slate-400">
          Upload telemetry datasets (CSV, XLSX, JSON) or connect PostgreSQL database pipelines
        </p>
      </div>

      {/* Main Drag & Drop / Upload Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle>File Drag & Drop Upload Zone</CardTitle>
            <Badge variant="cyan">Supports CSV, XLSX, JSON</Badge>
          </CardHeader>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            className="hidden"
            onChange={handleFileChange}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="my-4 p-8 border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl bg-slate-950/40 hover:bg-slate-900/60 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-7 h-7 text-cyan-400" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              {isUploading
                ? "Processing and validating schema..."
                : fileUploaded
                ? `${uploadMeta?.filename ?? "telemetry_batch.csv"} Uploaded`
                : "Drop manufacturing CSV/Excel files here or click to browse"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Maximum file size: 500 MB per batch</p>

            {fileUploaded && (
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />{" "}
                {((uploadMeta?.record_count as number | undefined) ?? 14200).toLocaleString()} records parsed via {uploadMeta?.status ?? "pipeline"}
              </span>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="cyan" size="sm" disabled={!fileUploaded} icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Proceed to Schema Ingestion
            </Button>
          </div>
        </Card>

        {/* Database Pipeline Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Database className="w-4 h-4 text-cyan-400" />
              Database Connector
            </CardTitle>
          </CardHeader>
          <div className="space-y-3 mt-2 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Database Type</label>
              <select className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200">
                <option>PostgreSQL Telemetry DB</option>
                <option>TimescaleDB Time-Series</option>
                <option>SAP ERP Connector</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Host / Connection String</label>
              <input
                type="text"
                defaultValue="postgresql://admin:***@db.factoryos.internal:5432/telemetry"
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-[11px]"
              />
            </div>
            <Button variant="outline" size="sm" className="w-full" icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}>
              Test DB Connection
            </Button>
          </div>
        </Card>
      </div>

      {/* Column Mapping Table */}
      {fileUploaded && (
        <Card>
          <CardHeader>
            <CardTitle>Column Mapping & Schema Validator</CardTitle>
            <Badge variant="success">All Columns Matched</Badge>
          </CardHeader>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Source Column Name</th>
                  <th className="p-3">Factory OS Target Property</th>
                  <th className="p-3">Inferred Data Type</th>
                  <th className="p-3">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {mockMapping.map((col, i) => (
                  <tr key={i}>
                    <td className="p-3 font-mono text-cyan-400">{col.sourceColumn}</td>
                    <td className="p-3 font-semibold text-slate-100">{col.mappedField}</td>
                    <td className="p-3 text-slate-400">{col.dataType}</td>
                    <td className="p-3">
                      <Badge variant="success">{col.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
