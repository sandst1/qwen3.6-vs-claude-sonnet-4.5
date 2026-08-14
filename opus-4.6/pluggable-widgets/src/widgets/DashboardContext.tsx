import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_LAYOUT } from "./registry";

const STORAGE_KEY = "dashboard-layout";

function loadLayout(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((s) => typeof s === "string")) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LAYOUT;
}

function saveLayout(layout: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

interface DashboardContextValue {
  layout: string[];
  addWidget: (type: string) => void;
  removeWidget: (index: number) => void;
  moveWidget: (from: number, to: number) => void;
  resetLayout: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState(loadLayout);

  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  const addWidget = useCallback((type: string) => {
    setLayout((prev) => [...prev, type]);
  }, []);

  const removeWidget = useCallback((index: number) => {
    setLayout((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveWidget = useCallback((from: number, to: number) => {
    setLayout((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
  }, []);

  return (
    <DashboardContext.Provider
      value={{ layout, addWidget, removeWidget, moveWidget, resetLayout }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}
