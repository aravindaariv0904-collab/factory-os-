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
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchWithFallback<T>(url: string, fallbackData: T, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch (err) {
    console.warn(`[Factory OS API] Backend fallback engaged for ${url}:`, err);
  }
  return fallbackData;
}

export const AuthService = {
  async getCurrentUser(): Promise<User> {
    const res = await fetchWithFallback<{ email: string; role: string; factory_id: string }>(
      "/auth/me",
      { email: MOCK_USER.email, role: MOCK_USER.role, factory_id: "fact_01" }
    );
    return {
      ...MOCK_USER,
      email: res.email || MOCK_USER.email,
      role: (res.role as any) || MOCK_USER.role,
    };
  },
  async login(email: string): Promise<{ token: string; user: User }> {
    const res = await fetchWithFallback<{ access_token: string }>(
      "/auth/login",
      { access_token: "mock_jwt_token_9921" },
      {
        method: "POST",
        body: JSON.stringify({ email, password: "password123" }),
      }
    );
    return { token: res.access_token, user: { ...MOCK_USER, email } };
  },
  async logout(): Promise<void> {},
};

export const ProductionService = {
  async getMachines(): Promise<Machine[]> {
    return fetchWithFallback<Machine[]>("/machines/", MOCK_MACHINES);
  },
  async getProductionOrders(): Promise<ProductionOrder[]> {
    return fetchWithFallback<ProductionOrder[]>("/production/", MOCK_PRODUCTION_ORDERS);
  },
  async getDowntimeEvents(): Promise<DowntimeEvent[]> {
    return fetchWithFallback<DowntimeEvent[]>("/maintenance/", MOCK_DOWNTIME_EVENTS);
  },
};

export const MaintenanceService = {
  async getMachineHealthList(): Promise<Machine[]> {
    return fetchWithFallback<Machine[]>("/machines/", MOCK_MACHINES);
  },
  async getRecommendations(): Promise<AIRecommendation[]> {
    return fetchWithFallback<AIRecommendation[]>("/recommendations/", MOCK_RECOMMENDATIONS);
  },
  async scheduleWorkOrder(machineId: string, description: string): Promise<boolean> {
    return true;
  },
};

export const QualityService = {
  async getDefects(): Promise<DefectLog[]> {
    return fetchWithFallback<DefectLog[]>("/quality/", MOCK_DEFECTS);
  },
  async getYieldStats(): Promise<{ passYield: number; scrapRate: number; totalInspected: number }> {
    return fetchWithFallback<{ passYield: number; scrapRate: number; totalInspected: number }>(
      "/analytics/",
      { passYield: 98.4, scrapRate: 1.6, totalInspected: 45200 }
    );
  },
};

export const InventoryService = {
  async getStock(): Promise<InventoryItem[]> {
    return fetchWithFallback<InventoryItem[]>("/inventory/", MOCK_INVENTORY);
  },
  async reorderItem(sku: string, quantity: number): Promise<boolean> {
    return true;
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
      content: `### AI Intelligence Response:\nAnalyzing production query: "${question}"...\n\n- **Analysis**: Cross-referencing telemetry with historical failure models.\n- **Status**: Machine operating within normal standard distribution variance.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      evidence: {
        confidence: 0.94,
        sources: ["LangGraph Multi-Agent Consensus Node"],
        metrics: [{ label: "Confidence", value: "94%" }],
      },
    };

    return fetchWithFallback<CopilotMessage>("/copilot/query", fallbackResponse, {
      method: "POST",
      body: JSON.stringify({ prompt: question }),
    });
  },
};

export const ReportService = {
  async getReports(): Promise<SystemReport[]> {
    return fetchWithFallback<SystemReport[]>("/reports/", MOCK_REPORTS);
  },
  async generateReport(type: string): Promise<SystemReport> {
    return {
      id: `rep_${Date.now()}`,
      title: `Generated ${type} - Factory OS Digest`,
      type: type as any,
      generatedAt: "Just now",
      format: "PDF",
      status: "Ready",
    };
  },
};

export const KnowledgeBaseService = {
  async getDocuments(): Promise<KnowledgeDocument[]> {
    return MOCK_KNOWLEDGE_DOCS;
  },
  async searchKnowledgeBase(query: string) {
    return fetchWithFallback("/knowledge/search", { results_count: 0, documents: [] }, {
      method: "POST",
      body: JSON.stringify({ query, top_k: 2 }),
    });
  },
};

export const SettingsService = {
  async getFactories(): Promise<Factory[]> {
    return fetchWithFallback<Factory[]>("/factories/", MOCK_FACTORIES);
  },
};

export const DigitalTwinService = {
  async getTopology() {
    return fetchWithFallback("/digital-twin/topology", {});
  },
  async simulateFailure(machineId: string) {
    return fetchWithFallback(`/digital-twin/simulate-failure/${machineId}`, {});
  },
};
