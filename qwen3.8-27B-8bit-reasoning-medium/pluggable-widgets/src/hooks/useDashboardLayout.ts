import { useCallback, useEffect, useState } from "react";
import { DEFAULT_LAYOUT, WIDGET_TYPES } from "../widgets/registry";

const STORAGE_KEY = "ops-dashboard.layout.v1";

function loadLayout(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return DEFAULT_LAYOUT;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_LAYOUT;
    const seen = new Set<string>();
    return parsed.filter((id): id is string => {
      // Drop unknown ids (widget removed from code) and duplicates.
      if (typeof id !== "string" || !(id in WIDGET_TYPES) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  } catch {
    return DEFAULT_LAYOUT;
  }
}

/**
 * User-customizable dashboard layout: which widgets are shown, in what order.
 * Persisted to localStorage.
 */
export function useDashboardLayout() {
  const [layout, setLayout] = useState<string[]>(loadLayout);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // private mode / quota — customization just won't persist
    }
  }, [layout]);

  const addWidget = useCallback((id: string) => {
    setLayout((l) => (l.includes(id) ? l : [...l, id]));
  }, []);

  const removeWidget = useCallback((id: string) => {
    setLayout((l) => l.filter((w) => w !== id));
  }, []);

  /** Move `id` to the position currently occupied by `targetId`. */
  const moveWidget = useCallback((id: string, targetId: string) => {
    setLayout((l) => {
      const from = l.indexOf(id);
      const to = l.indexOf(targetId);
      if (from === -1 || to === -1 || from === to) return l;
      const next = [...l];
      next.splice(from, 1);
      next.splice(to, 0, id);
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => setLayout(DEFAULT_LAYOUT), []);

  return { layout, addWidget, removeWidget, moveWidget, resetLayout };
}
