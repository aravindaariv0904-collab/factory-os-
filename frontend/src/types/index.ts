export type Role = "Admin" | "Plant Manager" | "Maintenance Lead" | "Quality Specialist" | "Operator";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  factoryId: string;
  avatarUrl?: string;
}

export interface Factory {
  id: string;
  name: string;
  location: string;
  type: string; // e.g. Automotive, Electronics, Pharma
  linesCount: number;
  activeMachines: number;
  overallOEE: number;
  status: "Operational" | "Warning" | "Critical";
}

export type MachineStatus = "Running" | "Idle" | "Down" | "Maintenance";

export interface Machine {
  id: string;
  name: string;
  code: string;
  plantId: string;
  line: string;
  type: string;
  status: MachineStatus;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  temperature: number; // °C
  vibration: number; // mm/s
  rulHours: number; // Remaining Useful Life
  healthScore: number; // 0-100
  lastMaintenance: string;
  nextScheduledMaintenance: string;
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  productName: string;
  sku: string;
  targetQuantity: number;
  producedQuantity: number;
  defectiveQuantity: number;
  line: string;
  status: "In Progress" | "Completed" | "Delayed" | "Scheduled";
  startDate: string;
  endDate: string;
  oee: number;
}

export interface DowntimeEvent {
  id: string;
  machineId: string;
  machineName: string;
  reason: string;
  category: "Unplanned Mechanical" | "Tooling Change" | "Operator Delay" | "Material Shortage" | "Quality Hold";
  startTime: string;
  durationMinutes: number;
  impactCost: number;
  status: "Resolved" | "Investigating" | "Pending Action";
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: "Raw Material" | "Components" | "Spare Parts" | "Finished Goods";
  quantity: number;
  minThreshold: number;
  maxCapacity: number;
  unitCost: number;
  location: string;
  supplier: string;
  status: "Optimal" | "Low Stock" | "Critical Reorder" | "Overstocked";
  leadTimeDays: number;
}

export interface DefectLog {
  id: string;
  batchId: string;
  machineId: string;
  machineName: string;
  defectType: "Surface Scratch" | "Dimensional Deviation" | "Weld Fault" | "Component Alignment" | "Material Porosity";
  severity: "Minor" | "Major" | "Critical";
  timestamp: string;
  inspectionType: "AI Vision" | "Manual Audit" | "Laser Scanner";
  status: "Quarantined" | "Reworked" | "Scrapped" | "Approved";
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  targetEntity: string; // Machine, Line, Inventory
  category: "Predictive Maintenance" | "Process Optimization" | "Quality Shield" | "Energy Efficiency";
  impactScore: "High" | "Medium" | "Low";
  estimatedSavings: number; // USD or hrs
  confidenceScore: number; // e.g. 0.94
  createdAt: string;
  status: "New" | "In Review" | "Applied" | "Dismissed";
  actions: string[];
}

export interface CriticalAlert {
  id: string;
  title: string;
  message: string;
  severity: "Critical" | "Warning" | "Info";
  machineId?: string;
  machineName?: string;
  timestamp: string;
  isRead: boolean;
  isResolved: boolean;
}

export interface CopilotMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
  evidence?: {
    confidence: number;
    sources: string[];
    metrics?: { label: string; value: string; trend?: string }[];
    chartData?: { name: string; value: number }[];
    recommendations?: string[];
  };
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: "SOP" | "Manual" | "Maintenance Guide" | "Quality Spec" | "Safety";
  fileType: "PDF" | "DOCX" | "CSV";
  sizeMB: number;
  updatedAt: string;
  author: string;
  tags: string[];
  downloadUrl?: string;
}

export interface SystemReport {
  id: string;
  title: string;
  type: "Shift Digest" | "OEE Weekly Performance" | "Downtime Audit" | "Quality Control" | "Executive Brief";
  generatedAt: string;
  format: "PDF" | "XLSX" | "JSON";
  status: "Ready" | "Processing" | "Failed";
  downloadUrl?: string;
}
