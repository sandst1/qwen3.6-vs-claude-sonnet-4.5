import { useState, useEffect, useCallback } from "react";
import type { DashboardConfig } from "../dashboard.config";
import { defaultConfig } from "../dashboard.config";

const STORAGE_KEY = "dashboard-config";

export function useDashboardConfig() {
  const [config, setConfig] = useState<DashboardConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as DashboardConfig;
    } catch {
      // ignore parse errors
    }
    return defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const addWidget = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      widgetIds: [...prev.widgetIds, id],
    }));
  }, []);

  const removeWidget = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      widgetIds: prev.widgetIds.filter((w) => w !== id),
    }));
  }, []);

  const moveWidget = useCallback((from: number, to: number) => {
    setConfig((prev) => {
      const ids = [...prev.widgetIds];
      const [moved] = ids.splice(from, 1);
      ids.splice(to, 0, moved);
      return { ...prev, widgetIds: ids };
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  return {
    config,
    setConfig,
    addWidget,
    removeWidget,
    moveWidget,
    resetConfig,
  };
}
