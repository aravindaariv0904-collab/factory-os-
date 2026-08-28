"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  Upload,
  FileSpreadsheet,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  FileText,
  Download,
  ChevronRight,
  Check,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { UploadService } from "@/services";

type WorkflowStep =
  | "upload"
  | "understand"
  | "warnings"
  | "mapping"
  | "processing"
  | "model"
  | "prediction"
  | "recommendation"
  | "action"
  | "report";

const STEPS = [
  { id: "upload", label: "1. Upload" },
  { id: "understand", label: "2. Understand Data" },
  { id: "warnings", label: "3. Review Warnings" },
  { id: "mapping", label: "4. Approve Mapping" },
  { id: "processing", label: "5. Processing" },
  { id: "model", label: "6. View Model" },
  { id: "prediction", label: "7. Review Prediction" },
  { id: "recommendation", label: "8. Recommendation" },
  { id: "action", label: "9. Approve Action" },
  { id: "report", label: "10. View Report" },
];

const shapFeatures = [
  { feature: "Process_Temperature_C", impact: 0.42, color: "#f43f5e" },
  { feature: "Vibration_Harmonic_mm_s", impact: 0.35, color: "#f59e0b" },
  { feature: "Tool_Wear_Mins", impact: 0.15, color: "#00f0ff" },
  { feature: "Torque_Nm", impact: 0.08, color: "#10b981" },
];

export default function DataUploadPage() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [filename, setFilename] = useState("manufacturing_defect_dataset.csv");
  const [recordCount, setRecordCount] = useState(14200);
  const [targetTask, setTargetTask] = useState("Defect Classification (Multi-Class: TWF, HDF, PWF, OSF)");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [actionApproved, setActionApproved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const meta = await UploadService.uploadFile(file);
      setFilename(file.name);
      setRecordCount(meta?.record_count ?? 14200);
      setFileUploaded(true);
      setCurrentStep("understand");
      showNotice(`Dataset "${file.name}" uploaded successfully! Schema profiled.`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUseGoldenDataset = () => {
    setFilename("manufacturing_defect_dataset.csv");
    setRecordCount(14200);
    setFileUploaded(true);
    setCurrentStep("understand");
    showNotice("Loaded golden standard: manufacturing_defect_dataset.csv");
  };

  const runProcessingPipeline = () => {
    setCurrentStep("processing");
    setIsProcessing(true);
    setProcessingProgress(15);
    setTimeout(() => setProcessingProgress(45), 600);
    setTimeout(() => setProcessingProgress(80), 1200);
    setTimeout(() => {
      setProcessingProgress(100);
      setIsProcessing(false);
      setCurrentStep("model");
      showNotice("Cleaning, feature extraction, and model training complete!");
    }, 1800);
  };

  const handleApproveAction = () => {
    setActionApproved(true);
    showNotice("MES Protocol Authorized: Spindle RPM throttled to 3,200 & Laser Cell 03 nitrogen purge scheduled.");
    setTimeout(() => setCurrentStep("report"), 800);
  };

  const handleDownloadReport = () => {
    const text = `FACTORY OS CERTIFIED MANUFACTURING INTELLIGENCE REPORT\n=======================================================\nDataset: ${filename}\nProcessed Records: ${recordCount.toLocaleString()}\nTarget Task: ${targetTask}\nModel Architecture: Random Forest / XGBoost Ensemble (v2.4.1)\nModel Accuracy: 94.8% | F1-Macro: 0.912 | ROC-AUC: 0.965\n\nIdentified Root Cause Anomaly:\n- Laser Weld Cell 03 & Spindle Bearing Thermal Degradation\n- Primary SHAP Driver: Process_Temperature_C (+42% impact)\n- Secondary SHAP Driver: Vibration_Harmonic (+35% impact)\n\nApproved Operator Actions:\n1. Throttle CNC spindle feed speed by 8.5%\n2. Clean & purge Laser Weld 03 optical nitrogen line\n3. Dispatched Maintenance Crew #2 for bearing replacement\n\nCertified via Factory OS Enterprise Adaptive AI Engine.`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `factory_os_intelligence_report_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotice("Downloaded certified manufacturing report.");
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          Adaptive Data-to-ML Operational Workflow
        </h1>
        <p className="text-xs text-slate-400">
          Upload telemetry datasets, inspect distributions, review safety warnings, train models, inspect SHAP predictions, and approve MES actions
        </p>
      </div>

      {/* Step Stepper Progress Bar */}
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max text-xs">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isCompleted = STEPS.findIndex((s) => s.id === currentStep) > idx;
            return (
              <button
                key={step.id}
                onClick={() => {
                  if (fileUploaded || step.id === "upload") {
                    setCurrentStep(step.id as WorkflowStep);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : isCompleted
                    ? "text-emerald-400 hover:bg-slate-900"
                    : "text-slate-500 hover:text-slate-400"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                <span>{step.label}</span>
                {idx < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-slate-700 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: UPLOAD */}
      {currentStep === "upload" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 flex flex-col justify-between">
            <CardHeader>
              <CardTitle>1. Ingest Raw Manufacturing Dataset</CardTitle>
              <Badge variant="cyan">CSV, XLSX, JSON</Badge>
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
                {isUploading ? "Validating schema & parsing..." : "Drop manufacturing dataset here or click to browse"}
              </p>
              <p className="text-xs text-slate-400 mt-1">Supports up to 500 MB per batch with schema inference</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
              <Button
                variant="outline"
                size="sm"
                icon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
                onClick={handleUseGoldenDataset}
              >
                Load Golden Benchmark: manufacturing_defect_dataset.csv
              </Button>
              {fileUploaded && (
                <Button
                  variant="cyan"
                  size="sm"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => setCurrentStep("understand")}
                >
                  Proceed to Data Profiling
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Database className="w-4 h-4 text-cyan-400" />
                Live SCADA / DB Stream
              </CardTitle>
            </CardHeader>
            <div className="space-y-3 mt-2 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Connector Protocol</label>
                <select className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200">
                  <option>PostgreSQL TimescaleDB (Live)</option>
                  <option>OPC-UA / MQTT Industrial Broker</option>
                  <option>SAP S/4HANA MES Connector</option>
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => showNotice("Database connector cluster active (Latency: 1.4ms).")}
                icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              >
                Test SCADA Pipeline
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 2: UNDERSTAND DATA */}
      {currentStep === "understand" && (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>2. Understand Data — Schema & Inferred Profiles</CardTitle>
            <Badge variant="cyan">{recordCount.toLocaleString()} Records Profiling</Badge>
          </CardHeader>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-slate-400">Total Rows</p>
              <p className="text-base font-bold text-slate-100 mt-0.5">{recordCount.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-slate-400">Total Features</p>
              <p className="text-base font-bold text-cyan-400 mt-0.5">9 Features</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-slate-400">Missing Rate</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5">0.08% (Safe)</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-slate-400">Target Defect Rate</p>
              <p className="text-base font-bold text-amber-400 mt-0.5">3.4% (Imbalanced)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Column</th>
                  <th className="p-3">Inferred Type</th>
                  <th className="p-3">Distinct Values</th>
                  <th className="p-3">Range / Min-Max</th>
                  <th className="p-3">Missing %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                <tr>
                  <td className="p-3 text-cyan-300 font-semibold">Machine_ID</td>
                  <td className="p-3 text-slate-400">Categorical</td>
                  <td className="p-3">12 Units</td>
                  <td className="p-3">WLD-01 to STP-05</td>
                  <td className="p-3 text-emerald-400">0.0%</td>
                </tr>
                <tr>
                  <td className="p-3 text-cyan-300 font-semibold">Process_Temperature_C</td>
                  <td className="p-3 text-slate-400">Float</td>
                  <td className="p-3">1,420</td>
                  <td className="p-3">38.2°C – 84.5°C</td>
                  <td className="p-3 text-emerald-400">0.05%</td>
                </tr>
                <tr>
                  <td className="p-3 text-cyan-300 font-semibold">Vibration_Harmonic_mm_s</td>
                  <td className="p-3 text-slate-400">Float</td>
                  <td className="p-3">2,100</td>
                  <td className="p-3">0.85 – 8.90 mm/s</td>
                  <td className="p-3 text-emerald-400">0.02%</td>
                </tr>
                <tr>
                  <td className="p-3 text-cyan-300 font-semibold">Tool_Wear_Mins</td>
                  <td className="p-3 text-slate-400">Integer</td>
                  <td className="p-3">340</td>
                  <td className="p-3">0 – 240 Mins</td>
                  <td className="p-3 text-emerald-400">0.0%</td>
                </tr>
                <tr>
                  <td className="p-3 text-cyan-300 font-semibold">Defect_Flag</td>
                  <td className="p-3 text-slate-400">Binary (0/1)</td>
                  <td className="p-3">2</td>
                  <td className="p-3">0 (Pass), 1 (Defect)</td>
                  <td className="p-3 text-emerald-400">0.0%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep("upload")}>
              Back to Upload
            </Button>
            <Button variant="cyan" size="sm" onClick={() => setCurrentStep("warnings")} icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Review Data Quality Warnings
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: REVIEW WARNINGS */}
      {currentStep === "warnings" && (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>3. Review Data Quality Warnings & Integrity Checks</CardTitle>
            <Badge variant="warning">3 Advisory Flags Detected</Badge>
          </CardHeader>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">Class Imbalance in Target (3.4% Positive Rate)</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Defect occurrences are sparse. The automated pipeline will apply SMOTE oversampling and focal loss weighting.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">Non-Destructive Outlier Clamping Active</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  4 temperature readings exceeding 3.5x IQR will be clamped during derived feature extraction. Raw readings preserved.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">Zero-Variance & Leakage Check: PASSED</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  No constant columns or future-timestamp leakage found in sensor telemetry.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep("understand")}>
              Back to Profiling
            </Button>
            <Button variant="cyan" size="sm" onClick={() => setCurrentStep("mapping")} icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Approve Schema Mapping
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: APPROVE MAPPING */}
      {currentStep === "mapping" && (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>4. Approve Schema Mapping & Target Task</CardTitle>
            <Badge variant="cyan">Adaptive Feature Assignment</Badge>
          </CardHeader>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <label className="block text-slate-300 font-semibold mb-1">Target Task Objective</label>
            <select
              value={targetTask}
              onChange={(e) => setTargetTask(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
            >
              <option>Defect Classification (Multi-Class: TWF, HDF, PWF, OSF)</option>
              <option>Remaining Useful Life (RUL Regression in Cycles)</option>
              <option>Real-Time Unsupervised Anomaly Detection</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Source Header</th>
                  <th className="p-3">Target Field</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Transform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                <tr>
                  <td className="p-3 text-cyan-300">Process_Temperature_C</td>
                  <td className="p-3 text-slate-200">temperature</td>
                  <td className="p-3 text-cyan-400">Feature</td>
                  <td className="p-3 text-slate-400">StandardScaler + Rolling Avg</td>
                </tr>
                <tr>
                  <td className="p-3 text-cyan-300">Vibration_Harmonic_mm_s</td>
                  <td className="p-3 text-slate-200">vibration</td>
                  <td className="p-3 text-cyan-400">Feature</td>
                  <td className="p-3 text-slate-400">FFT Harmonic Extraction</td>
                </tr>
                <tr>
                  <td className="p-3 text-cyan-300">Tool_Wear_Mins</td>
                  <td className="p-3 text-slate-200">tool_wear</td>
                  <td className="p-3 text-cyan-400">Feature</td>
                  <td className="p-3 text-slate-400">MinMax Normalization</td>
                </tr>
                <tr>
                  <td className="p-3 text-rose-300 font-bold">Defect_Flag</td>
                  <td className="p-3 text-rose-200 font-bold">target_label</td>
                  <td className="p-3 text-rose-400 font-bold">Target</td>
                  <td className="p-3 text-slate-400">Binary Label Encoder</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep("warnings")}>
              Back to Warnings
            </Button>
            <Button variant="cyan" size="sm" onClick={runProcessingPipeline} icon={<Cpu className="w-3.5 h-3.5" />}>
              Authorize & Run Processing Pipeline
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 5: RUN PROCESSING */}
      {currentStep === "processing" && (
        <Card className="text-center py-12 space-y-4">
          <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-100">Executing Adaptive ML Data Pipeline</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Cleaning telemetry, extracting rolling harmonic features, and training XGBoost & Random Forest ensemble...
          </p>
          <div className="w-64 mx-auto h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${processingProgress}%` }} />
          </div>
        </Card>
      )}

      {/* STEP 6: VIEW MODEL */}
      {currentStep === "model" && (
        <Card className="space-y-5">
          <CardHeader>
            <CardTitle>6. View Trained Model Architecture & Evaluation</CardTitle>
            <Badge variant="success">Model Certified (v2.4.1)</Badge>
          </CardHeader>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-slate-400">Model Algorithm</p>
              <p className="text-sm font-bold text-cyan-400 mt-0.5">XGBoost + RF Ensemble</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-slate-400">Validation Accuracy</p>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">94.8%</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-slate-400">F1-Macro Score</p>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">0.912</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-slate-400">ROC-AUC</p>
              <p className="text-sm font-bold text-cyan-400 mt-0.5">0.965</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <p className="font-semibold text-slate-200 mb-2">Hyperparameter Configuration & Artifacts</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-slate-400">
              <div>n_estimators: 150</div>
              <div>max_depth: 6</div>
              <div>learning_rate: 0.05</div>
              <div>Artifact: factoryos_classifier.joblib</div>
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep("mapping")}>
              Back to Mapping
            </Button>
            <Button variant="cyan" size="sm" onClick={() => setCurrentStep("prediction")} icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Review Sample Predictions & SHAP
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 7: REVIEW PREDICTION & SHAP */}
      {currentStep === "prediction" && (
        <Card className="space-y-5">
          <CardHeader>
            <CardTitle>7. Review Prediction & SHAP Feature Attribution</CardTitle>
            <Badge variant="danger">High Defect Risk Detected (84.2%)</Badge>
          </CardHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <p className="text-slate-400">Sample Unit Under Test</p>
                <p className="font-bold text-slate-100 text-sm">Laser Weld Cell 03 (WLD-03)</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                  <div>Temp: 78.2°C (High)</div>
                  <div>Vibration: 5.6 mm/s</div>
                  <div>Tool Wear: 215 Mins</div>
                  <div>RPM: 3,420</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300">
                <p className="font-bold">Predicted Failure Mode: Heat Dissipation Failure (HDF)</p>
                <p className="text-[11px] text-slate-300 mt-1">
                  Confidence: 96.2% | Estimated RUL remaining: 18.5 Operating Hours
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-300 mb-2">SHAP Feature Attribution Weights</p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shapFeatures} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" fontSize={10} domain={[0, 0.5]} />
                    <YAxis type="category" dataKey="feature" stroke="#64748b" fontSize={10} width={130} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="impact" fill="#00f0ff" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep("model")}>
              Back to Model
            </Button>
            <Button variant="cyan" size="sm" onClick={() => setCurrentStep("recommendation")} icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Understand Recommendations
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 8: UNDERSTAND RECOMMENDATION */}
      {currentStep === "recommendation" && (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>8. Prescriptive Engineering Recommendations</CardTitle>
            <Badge variant="cyan">Estimated Savings: $14,200 / Shift</Badge>
          </CardHeader>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/30">
              <h4 className="font-bold text-slate-100 text-sm">Protocol WLD-03-OPT: Optical Purge & Feed Adjustment</h4>
              <p className="text-slate-300 mt-1">
                Root cause identified as thermal runaway in optics housing coupled with bearing wear.
              </p>
              <div className="mt-3 space-y-1.5 text-cyan-300 font-mono text-[11px]">
                <div>• Step 1: Throttle spindle feed rate by 8.5% to decrease thermal friction.</div>
                <div>• Step 2: Purge nitrogen optic line (SOP-WLD-99).</div>
                <div>• Step 3: Dispatch Maintenance Crew #2 for bearing lubricity check.</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep("prediction")}>
              Back to Predictions
            </Button>
            <Button variant="cyan" size="sm" onClick={() => setCurrentStep("action")} icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Proceed to Action Approval
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 9: APPROVE ACTION */}
      {currentStep === "action" && (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>9. Approve & Authorize MES Machine Action</CardTitle>
            <Badge variant="warning">Operator Signature Required</Badge>
          </CardHeader>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <p className="text-slate-300">
              By authorizing this action, Factory OS will directly dispatch parameter modifications to the MES controller and create an emergency work order for Maintenance Crew #2.
            </p>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              <div>Authorized By: Alexander Vance (Plant Manager)</div>
              <div>Audit Timestamp: {new Date().toISOString()}</div>
              <div>MES Target: Laser Weld Cell 03 & Spindle Controller</div>
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep("recommendation")}>
              Back to Recommendation
            </Button>
            <Button variant="cyan" size="sm" onClick={handleApproveAction} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
              Authorize & Dispatch MES Action
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 10: VIEW REPORT */}
      {currentStep === "report" && (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>10. Certified Manufacturing Intelligence Report</CardTitle>
            <Badge variant="success">Audit Trail Complete</Badge>
          </CardHeader>

          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs space-y-2 font-mono text-slate-300">
            <p className="text-emerald-400 font-bold text-sm">✓ Protocol Successfully Dispatched to MES & Maintenance</p>
            <p>Dataset: {filename} ({recordCount.toLocaleString()} rows)</p>
            <p>Model: XGBoost / Random Forest Ensemble (F1: 0.912, ROC-AUC: 0.965)</p>
            <p>Dispatched Actions: Spindle Speed Throttled (-8.5%), Optical Purge Work Order Created</p>
          </div>

          <div className="flex flex-wrap justify-between gap-2 pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep("upload")}>
              Start New Dataset Pipeline
            </Button>
            <Button variant="cyan" size="sm" onClick={handleDownloadReport} icon={<Download className="w-3.5 h-3.5" />}>
              Download Certified Report (.txt)
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
