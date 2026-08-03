import { create } from "zustand";
import { Factory, User, CriticalAlert } from "@/types";
import { MOCK_FACTORIES, MOCK_USER, MOCK_ALERTS } from "@/mock";

interface AppState {
  // Theme & Layout
  theme: "dark" | "light";
  toggleTheme: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Command Palette & Modals
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;

  // Active User & Factory Selection
  currentUser: User;
  activeFactory: Factory;
  factories: Factory[];
  setActiveFactory: (factoryId: string) => void;

  // Alerts & Notifications
  alerts: CriticalAlert[];
  markAlertAsRead: (alertId: string) => void;

  // Pinned Pages
  pinnedPages: string[];
  togglePinnedPage: (path: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: "dark",
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

  isSidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

  isNotificationsOpen: false,
  setNotificationsOpen: (open) => set({ isNotificationsOpen: open }),

  currentUser: MOCK_USER,
  activeFactory: MOCK_FACTORIES[0],
  factories: MOCK_FACTORIES,
  setActiveFactory: (factoryId) =>
    set((state) => {
      const found = state.factories.find((f) => f.id === factoryId);
      return found ? { activeFactory: found } : {};
    }),

  alerts: MOCK_ALERTS,
  markAlertAsRead: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, isRead: true } : a
      ),
    })),

  pinnedPages: ["/overview", "/copilot", "/production", "/maintenance"],
  togglePinnedPage: (path) =>
    set((state) => {
      const exists = state.pinnedPages.includes(path);
      return {
        pinnedPages: exists
          ? state.pinnedPages.filter((p) => p !== path)
          : [...state.pinnedPages, path],
      };
    }),
}));
