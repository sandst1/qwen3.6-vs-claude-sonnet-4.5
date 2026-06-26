import { useState, useCallback, useEffect } from "react";
import { widgetRegistry } from "./widgets/registry";

const STORAGE_KEY = "ops-dashboard.layout";

function loadLayout(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return widgetRegistry.map((w) => w.id);
}

function saveLayout(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function useDashboardLayout() {
  const [ids, setIds] = useState<string[]>(loadLayout);

  useEffect(() => {
    saveLayout(ids);
  }, [ids]);

  const addWidget = useCallback(
    (widgetId: string) => {
      setIds((prev) => {
        if (prev.includes(widgetId)) return prev;
        return [...prev, widgetId];
      });
    },
    [],
  );

  const removeWidget = useCallback((widgetId: string) => {
    setIds((prev) => prev.filter((id) => id !== widgetId));
  }, []);

  const moveWidget = useCallback(
    (fromIndex: number, toIndex: number) => {
      setIds((prev) => {
        if (fromIndex < 0 || fromIndex >= prev.length) return prev;
        if (toIndex < 0 || toIndex >= prev.length) return prev;
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    [],
  );

  const resetLayout = useCallback(() => {
    setIds(widgetRegistry.map((w) => w.id));
  }, []);

  return {
    ids,
    addWidget,
    removeWidget,
    moveWidget,
    resetLayout,
  };
}
