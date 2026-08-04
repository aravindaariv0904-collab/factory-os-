/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  MOCK_MACHINES,
  MOCK_PRODUCTION_ORDERS,
  MOCK_DOWNTIME_EVENTS,
  MOCK_INVENTORY,
  MOCK_DEFECTS,
  MOCK_RECOMMENDATIONS,
  MOCK_COPILOT_CONVERSATION,
  MOCK_KNOWLEDGE_DOCS,
  MOCK_REPORTS,
  MOCK_USER,
  MOCK_FACTORIES,
  MOCK_ALERTS,
} from "@/mock";
import {
  Machine,
  ProductionOrder,
  DowntimeEvent,
  InventoryItem,
  DefectLog,
  AIRecommendation,
  CopilotMessage,
  KnowledgeDocument,
  SystemReport,
  User,
  Factory,
  CriticalAlert,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const TOKEN_KEY = "factoryos_access_token";
const REFRESH_KEY = "factoryos_refresh_token";

/* ---------------------------------- Token helpers ---------------------------------- */

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) window.localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

/* ---------------------------------- HTTP client ---------------------------------- */

async function request<T>(url: string, options?: RequestInit, fallback?: T): Promise<T | undefined> {
  const token = getAccessToken();
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    if (res.ok) {
      return (await res.json()) as T;
    }
    if (res.status === 401 && url.includes("/auth/")) {
      // Auth failures fall through to mock so the demo stays navigable.
    } else {
      console.warn(`[Factory OS API] ${res.status} for ${url}`);
    }
  } catch (err) {
    console.warn(`[Factory OS API] Backend fallback engaged for ${url}:`, err);
  }
  return fallback;
}

function backendUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

/* ---------------------------------- Mappers (snake_case -> camelCase) ---------------------------------- */

function mapFactory(f: any): Factory {
  return {
    id: f.id,
    name: f.name,
    location: f.location ?? "",
    type: f.type ?? "Manufacturing",
    linesCount: f.metadata_json?.lines ?? 0,
    activeMachines: f.metadata_json?.active_machines ?? 0,
    overallOEE: f.oee_target ? parseFloat(f.oee_target) : 0,
    status: "Operational",
  };
}

function mapMachine(m: any): Machine {
  return {
    id: m.id,
    name: m.name,
    code: m.code ?? m.id,
    plantId: m.plant_id ?? m.factory_id,
    line: m.line ?? "Unassigned",
    type: m.type ?? "Machine",
    status: m.status ?? "Running",
    oee: m.oee ?? 0,
    availability: m.availability ?? 0,
    performance: m.performance ?? 0,
    quality: m.quality ?? 0,
    temperature: m.temperature ?? 0,
    vibration: m.vibration ?? 0,
    rulHours: m.rul_hours ?? 0,
    healthScore: m.health_score ?? 0,
    lastMaintenance: m.last_maintenance ? String(m.last_maintenance).slice(0, 10) : "—",
    nextScheduledMaintenance: "—",
  };
}

function mapProductionOrder(o: any): ProductionOrder {
  return {
    id: o.id,
    orderNumber: o.order_number,
    productName: o.product_name,
    sku: o.sku,
    targetQuantity: o.target_quantity,
    producedQuantity: o.produced_quantity,
    defectiveQuantity: o.defective_quantity,
    line: o.line,
    status: o.status,
    startDate: o.created_at ? String(o.created_at).slice(0, 10) : "—",
    endDate: "—",
    oee: o.oee,
  };
}

function mapDowntimeEvent(d: any): DowntimeEvent {
  return {
    id: d.id,
    machineId: d.machine_id,
    machineName: d.machine_name ?? "Machine",
    reason: d.reason,
    category: d.category,
    startTime: d.created_at ? String(d.created_at).slice(0, 10) : "—",
    durationMinutes: d.duration_minutes,
    impactCost: d.impact_cost,
    status: d.status,
  };
}

function mapInventoryItem(i: any): InventoryItem {
  return {
    id: i.id,
    sku: i.sku,
    name: i.item_name,
    category: i.category,
    quantity: i.quantity,
    minThreshold: i.min_threshold,
    maxCapacity: i.max_capacity,
    unitCost: i.unit_cost,
    location: i.location ?? "—",
    supplier: i.supplier ?? "—",
    status: i.status,
    leadTimeDays: i.lead_time_days,
  };
}

function mapDefectLog(q: any): DefectLog {
  return {
    id: q.id,
    batchId: q.batch_id ?? "—",
    machineId: q.machine_id,
    machineName: q.machine_name ?? "Machine",
    defectType: q.defect_type ?? "Unknown",
    severity: q.severity,
    timestamp: q.created_at ? String(q.created_at).slice(0, 10) : "—",
    inspectionType: q.inspection_type ?? "Manual Audit",
    status: q.status,
  };
}

function mapRecommendation(r: any): AIRecommendation {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    targetEntity: r.target_entity ?? "Plant",
    category: r.category,
    impactScore: r.impact_score ?? "Medium",
    estimatedSavings: r.estimated_savings ?? 0,
    confidenceScore: r.confidence_score ?? 0,
    createdAt: r.created_at ? String(r.created_at).slice(0, 10) : "—",
    status: r.status,
    actions: r.actions ?? [],
  };
}

function mapAlert(a: any): CriticalAlert {
  return {
    id: a.id,
    title: a.title,
    message: a.message,
    severity: a.severity,
    machineId: a.machine_id,
    timestamp: a.created_at ? String(a.created_at).slice(0, 10) : "—",
    isRead: a.is_read,
    isResolved: a.is_resolved,
  };
}

/* ---------------------------------- Services ---------------------------------- */

export const AuthService = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await request<{ access_token: string; refresh_token?: string }>(
      backendUrl("/auth/login"),
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      { access_token: `mock_jwt_${Date.now()}` }
    );
    const token = res?.access_token ?? "";
    setTokens(token, res?.refresh_token);
    return { token, user: { ...MOCK_USER, email } };
  },

  async getCurrentUser(): Promise<User> {
    const res = await request<{ email: string; role: string; factory_id: string; full_name?: string }>(
      backendUrl("/auth/me"),
      undefined,
      { email: MOCK_USER.email, role: MOCK_USER.role, factory_id: "fact_01", full_name: MOCK_USER.name }
    );
    return {
      ...MOCK_USER,
      email: res?.email || MOCK_USER.email,
      role: (res?.role as User["role"]) || MOCK_USER.role,
      factoryId: res?.factory_id || MOCK_USER.factoryId,
      name: res?.full_name || MOCK_USER.name,
    };
  },

  async logout(): Promise<void> {
    clearTokens();
  },
};

export const ProductionService = {
  async getMachines(): Promise<Machine[]> {
    const data = await request<any[]>(backendUrl("/machines/"), undefined, MOCK_MACHINES);
    return (data ?? []).map(mapMachine);
  },
  async getProductionOrders(): Promise<ProductionOrder[]> {
    const data = await request<any[]>(backendUrl("/production/orders"), undefined, MOCK_PRODUCTION_ORDERS);
    return (data ?? []).map(mapProductionOrder);
  },
  async getDowntimeEvents(): Promise<DowntimeEvent[]> {
    const data = await request<any[]>(backendUrl("/production/downtime"), undefined, MOCK_DOWNTIME_EVENTS);
    return (data ?? []).map(mapDowntimeEvent);
  },
};

export const MaintenanceService = {
  async getMachineHealthList(): Promise<Machine[]> {
    return ProductionService.getMachines();
  },
  async getRecommendations(): Promise<AIRecommendation[]> {
    const data = await request<any[]>(backendUrl("/recommendations/"), undefined, MOCK_RECOMMENDATIONS);
    return (data ?? []).map(mapRecommendation);
  },
  async scheduleWorkOrder(machineId: string, priority: string, description: string): Promise<boolean> {
    const res = await request<{ status: string }>(
      backendUrl("/maintenance/work-orders"),
      {
        method: "POST",
        body: JSON.stringify({ machine_id: machineId, priority, description }),
      },
      { status: "success" }
    );
    return res?.status === "success";
  },
};

export const QualityService = {
  async getDefects(): Promise<DefectLog[]> {
    const data = await request<any[]>(backendUrl("/quality/reports"), undefined, MOCK_DEFECTS);
    return (data ?? []).map(mapDefectLog);
  },
  async getYieldStats(): Promise<{ passYield: number; scrapRate: number; totalInspected: number }> {
    const res = await request<any>(backendUrl("/analytics/oee"), undefined, null);
    if (res?.quality != null) {
      return {
        passYield: res.quality,
        scrapRate: Number((100 - res.quality).toFixed(1)),
        totalInspected: 45200,
      };
    }
    return { passYield: 98.4, scrapRate: 1.6, totalInspected: 45200 };
  },
};

export const InventoryService = {
  async getStock(): Promise<InventoryItem[]> {
    const data = await request<any[]>(backendUrl("/inventory/"), undefined, MOCK_INVENTORY);
    return (data ?? []).map(mapInventoryItem);
  },
  async reorderItem(sku: string, quantity: number): Promise<boolean> {
    const res = await request<{ status: string }>(
      backendUrl(`/inventory/${encodeURIComponent(sku)}/reorder?quantity=${quantity}`),
      { method: "POST" },
      { status: "success" }
    );
    return res?.status === "success";
  },
};

export const CopilotService = {
  async getConversationHistory(): Promise<CopilotMessage[]> {
    return MOCK_COPILOT_CONVERSATION;
  },
  async queryCopilot(question: string): Promise<CopilotMessage> {
    const fallbackResponse: CopilotMessage = {
      id: `msg_${Date.now()}`,
      sender: "assistant",
      content: `### AI Intelligence Response\nAnalyzing production query: "${question}"...\n\n- **Analysis**: Cross-referencing telemetry with historical failure models.\n- **Status**: Machine operating within normal standard distribution variance.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      evidence: {
        confidence: 0.94,
        sources: ["LangGraph Multi-Agent Consensus Node"],
        metrics: [{ label: "Confidence", value: "94%" }],
      },
    };

    const res = await request<any>(backendUrl("/copilot/query"), {
      method: "POST",
      body: JSON.stringify({ prompt: question }),
    }, null);

    if (res?.content) {
      return {
        id: res.id ?? `msg_${Date.now()}`,
        sender: "assistant",
        content: res.content,
        timestamp: res.timestamp ?? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        evidence: res.evidence
          ? {
              confidence: res.evidence.confidence ?? 0.9,
              sources: res.evidence.sources ?? [],
              metrics: res.evidence.metrics,
              recommendations: res.evidence.recommendations,
            }
          : undefined,
      };
    }
    return fallbackResponse;
  },
};

export const ReportService = {
  async getReports(): Promise<SystemReport[]> {
    const data = await request<any[]>(backendUrl("/reports/"), undefined, MOCK_REPORTS);
    return (data ?? []).map((r) => ({
      id: r.id ?? r.report_id,
      title: r.title ?? "Factory OS Report",
      type: (r.category ?? "OEE Weekly Performance") as SystemReport["type"],
      generatedAt: r.created_at ? String(r.created_at).slice(0, 10) : "—",
      format: (r.format ?? "PDF") as SystemReport["format"],
      status: (r.status ?? "Ready") as SystemReport["status"],
      downloadUrl: r.download_url,
    }));
  },
  async generateReport(category: string, format = "PDF"): Promise<SystemReport> {
    const res = await request<any>(
      backendUrl(`/reports/generate?category=${encodeURIComponent(category)}&format=${format}`),
      { method: "POST" },
      null
    );
    return {
      id: res?.report_id ?? `rep_${Date.now()}`,
      title: `Generated ${category} - Factory OS Digest`,
      type: category as SystemReport["type"],
      generatedAt: "Just now",
      format: (res?.format as SystemReport["format"]) ?? "PDF",
      status: "Ready",
    };
  },
};

export interface KnowledgeSearchDocument {
  title?: string;
  filename?: string;
  size?: number;
  updated_at?: string;
  author?: string;
  tags?: string[];
  download_url?: string;
}

export interface KnowledgeSearchResult {
  results_count: number;
  documents: KnowledgeSearchDocument[];
}

export const KnowledgeBaseService = {
  async getDocuments(): Promise<KnowledgeDocument[]> {
    return MOCK_KNOWLEDGE_DOCS;
  },
  async searchKnowledgeBase(query: string): Promise<KnowledgeSearchResult | undefined> {
    return request<KnowledgeSearchResult>(
      backendUrl("/knowledge/search"),
      {
        method: "POST",
        body: JSON.stringify({ query, top_k: 3 }),
      },
      { results_count: 0, documents: [] }
    );
  },
};

export const SettingsService = {
  async getFactories(): Promise<Factory[]> {
    const data = await request<any[]>(backendUrl("/factories/"), undefined, MOCK_FACTORIES);
    return (data ?? []).map(mapFactory);
  },
};

export const AlertService = {
  async getAlerts(): Promise<CriticalAlert[]> {
    const data = await request<any[]>(backendUrl("/alerts/"), undefined, MOCK_ALERTS);
    return (data ?? []).map(mapAlert);
  },
  async resolveAlert(alertId: string): Promise<boolean> {
    const res = await request<{ status: string }>(
      backendUrl(`/alerts/${alertId}/resolve`),
      { method: "POST" },
      { status: "success" }
    );
    return res?.status === "success";
  },
  async markAlertRead(alertId: string): Promise<boolean> {
    const res = await request<{ status: string }>(
      backendUrl(`/alerts/${alertId}/read`),
      { method: "POST" },
      { status: "success" }
    );
    return res?.status === "success";
  },
};

export const UploadService = {
  async uploadFile(file: File): Promise<any> {
    const token = getAccessToken();
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE_URL}/upload/file`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn("[Factory OS API] Upload fallback engaged:", err);
    }
    return {
      status: "Pipeline Ingestion Complete",
      filename: file.name,
      record_count: 0,
      columns: [],
      sample_records: [],
      upload_id: `upload_mock_${Date.now()}`,
    };
  },
};

export const AnalyticsService = {
  async getOEE(): Promise<any> {
    return request(backendUrl("/analytics/oee"), undefined, {
      overall_oee: 87.4,
      availability: 94.5,
      performance: 96.1,
      quality: 98.4,
      shift_breakdown: [],
    });
  },
};

export const DigitalTwinService = {
  async getTopology() {
    return request(backendUrl("/digital-twin/topology"), undefined, {});
  },
  async simulateFailure(machineId: string) {
    return request(backendUrl(`/digital-twin/simulate-failure/${machineId}`), undefined, {});
  },
};
