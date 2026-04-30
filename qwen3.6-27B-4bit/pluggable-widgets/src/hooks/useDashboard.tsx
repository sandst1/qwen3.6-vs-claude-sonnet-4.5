import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { getRegisteredWidgets } from "../registry";

const STORAGE_KEY = "dashboard-config";

export interface DashboardConfig {
  /** Ordered list of widget IDs to display */
  order: string[];
}

interface DashboardContextValue extends DashboardConfig {
  /** Toggle a widget's visibility */
  toggleWidget: (id: string) => void;
  /** Move a widget from one position to another */
  moveWidget: (fromIndex: number, toIndex: number) => void;
  /** Reset to default layout (all registered widgets) */
  reset: () => void;
  /** Whether a widget is currently visible */
  isVisible: (id: string) => boolean;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

function loadConfig(): DashboardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardConfig;
      // Validate: only keep IDs that are actually registered
      const registeredIds = new Set(getRegisteredWidgets().map((w) => w.id));
      const order = parsed.order.filter((id) => registeredIds.has(id));
      if (order.length > 0) return { order };
    }
  } catch {
    // corrupt storage, fall through to defaults
  }
  // Default: all registered widgets in registration order
  return { order: getRegisteredWidgets().map((w) => w.id) };
}

function saveConfig(config: DashboardConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // storage full or unavailable, silently ignore
  }
}

export function DashboardProvider({ children }: { children: ReactNode }): ReactNode {
  const [config, setConfig] = useState<DashboardConfig>(loadConfig);

  // Re-sync on mount in case registry changed (e.g. new widgets registered)
  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  const toggleWidget = useCallback((id: string) => {
    setConfig((prev) => {
      const exists = prev.order.includes(id);
      const next: DashboardConfig = {
        order: exists ? prev.order.filter((x) => x !== id) : [...prev.order, id],
      };
      saveConfig(next);
      return next;
    });
  }, []);

  const moveWidget = useCallback((fromIndex: number, toIndex: number) => {
    setConfig((prev) => {
      if (fromIndex === toIndex) return prev;
      const next = [...prev.order];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      const cfg: DashboardConfig = { order: next };
      saveConfig(cfg);
      return cfg;
    });
  }, []);

  const reset = useCallback(() => {
    const next: DashboardConfig = { order: getRegisteredWidgets().map((w) => w.id) };
    saveConfig(next);
    setConfig(next);
  }, []);

  const isVisible = useCallback((id: string) => config.order.includes(id), [config.order]);

  return (
    <DashboardContext.Provider value={{ ...config, toggleWidget, moveWidget, reset, isVisible }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
