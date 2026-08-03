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

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const AuthService = {
  async getCurrentUser(): Promise<User> {
    await delay();
    return MOCK_USER;
  },
  async login(email: string): Promise<{ token: string; user: User }> {
    await delay(500);
    return { token: "mock_jwt_token_9921", user: { ...MOCK_USER, email } };
  },
  async logout(): Promise<void> {
    await delay();
  },
};

export const ProductionService = {
  async getMachines(): Promise<Machine[]> {
    await delay();
    return MOCK_MACHINES;
  },
  async getProductionOrders(): Promise<ProductionOrder[]> {
    await delay();
    return MOCK_PRODUCTION_ORDERS;
  },
  async getDowntimeEvents(): Promise<DowntimeEvent[]> {
    await delay();
    return MOCK_DOWNTIME_EVENTS;
  },
};

export const MaintenanceService = {
  async getMachineHealthList(): Promise<Machine[]> {
    await delay();
    return MOCK_MACHINES;
  },
  async getRecommendations(): Promise<AIRecommendation[]> {
    await delay();
    return MOCK_RECOMMENDATIONS;
  },
  async scheduleWorkOrder(machineId: string, description: string): Promise<boolean> {
    await delay(400);
    return true;
  },
};

export const QualityService = {
  async getDefects(): Promise<DefectLog[]> {
    await delay();
    return MOCK_DEFECTS;
  },
  async getYieldStats(): Promise<{ passYield: number; scrapRate: number; totalInspected: number }> {
    await delay();
    return { passYield: 98.4, scrapRate: 1.6, totalInspected: 45200 };
  },
};

export const InventoryService = {
  async getStock(): Promise<InventoryItem[]> {
    await delay();
    return MOCK_INVENTORY;
  },
  async reorderItem(sku: string, quantity: number): Promise<boolean> {
    await delay(400);
    return true;
  },
};

export const CopilotService = {
  async getConversationHistory(): Promise<CopilotMessage[]> {
    await delay();
    return MOCK_COPILOT_CONVERSATION;
  },
  async queryCopilot(question: string): Promise<CopilotMessage> {
    await delay(800);
    return {
      id: `msg_${Date.now()}`,
      sender: "assistant",
      content: `### AI Intelligence Response:\nAnalyzing production query: "${question}"...\n\n- **Analysis**: Cross-referencing telemetry with historical failure models.\n- **Status**: Machine operating within normal standard distribution variance.\n- **Actionable Insight**: Maintain current throughput targets while monitoring bearing thermal readings.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      evidence: {
        confidence: 0.94,
        sources: ["LangGraph Agent Engine v2", "Historical Production DB"],
        metrics: [{ label: "Confidence", value: "94%" }],
      },
    };
  },
};

export const ReportService = {
  async getReports(): Promise<SystemReport[]> {
    await delay();
    return MOCK_REPORTS;
  },
  async generateReport(type: string): Promise<SystemReport> {
    await delay(1000);
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
    await delay();
    return MOCK_KNOWLEDGE_DOCS;
  },
};

export const SettingsService = {
  async getFactories(): Promise<Factory[]> {
    await delay();
    return MOCK_FACTORIES;
  },
};
