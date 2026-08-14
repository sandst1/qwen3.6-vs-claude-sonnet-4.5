import { useCallback, useEffect, useState } from "react";
import { DEFAULT_LAYOUT, WIDGETS, type WidgetId } from "./registry";

const STORAGE_KEY = "ops-dashboard.layout.v1";

function loadLayout(): WidgetId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return DEFAULT_LAYOUT;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_LAYOUT;
    // Keep only ids that are still registered; drop duplicates, keep first occurrence.
    const seen = new Set<string>();
    const layout = parsed.filter((id): id is WidgetId => {
      if (typeof id !== "string" || !WIDGETS.some((w) => w.id === id) || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
    return layout;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function useLayout() {
  const [layout, setLayout] = useState<WidgetId[]>(loadLayout);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // storage unavailable (private mode etc.) — layout just won't persist
    }
  }, [layout]);

  const addWidget = useCallback((id: WidgetId) => {
    setLayout((l) => (l.includes(id) ? l : [...l, id]));
  }, []);

  const removeWidget = useCallback((id: WidgetId) => {
    setLayout((l) => l.filter((w) => w !== id));
  }, []);

  const moveWidget = useCallback((id: WidgetId, toIndex: number) => {
    setLayout((l) => {
      const from = l.indexOf(id);
      if (from === -1) return l;
      const next = [...l];
      next.splice(from, 1);
      next.splice(toIndex, 0, id);
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => setLayout(DEFAULT_LAYOUT), []);

  return { layout, addWidget, removeWidget, moveWidget, resetLayout };
}
