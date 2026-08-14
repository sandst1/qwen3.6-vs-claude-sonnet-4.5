import { useCallback, useEffect, useState } from "react";
import { allWidgets, getWidget } from "./registry";

/** One placed widget on the dashboard. */
export interface WidgetInstance {
  /** Unique per placement (a widget type can in principle be placed twice). */
  key: string;
  /** References the widget type id in the registry. */
  widgetId: string;
}

const STORAGE_KEY = "ops-dashboard.layout.v1";

function makeKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `w-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Default layout: every registered widget, in registration order. */
function defaultLayout(): WidgetInstance[] {
  return allWidgets().map((w) => ({ key: makeKey(), widgetId: w.id }));
}

function loadLayout(): WidgetInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLayout();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultLayout();
    const valid = parsed.filter(
      (i): i is WidgetInstance =>
        !!i &&
        typeof (i as WidgetInstance).key === "string" &&
        typeof (i as WidgetInstance).widgetId === "string" &&
        getWidget((i as WidgetInstance).widgetId) != null
    );
    // De-duplicate by key, keep first occurrence.
    const seen = new Set<string>();
    return valid.filter((i) => (seen.has(i.key) ? false : (seen.add(i.key), true)));
  } catch {
    return defaultLayout();
  }
}

/**
 * Dashboard layout state: which widgets are shown and in what order.
 * Persisted to localStorage so user customizations survive reloads.
 */
export function useLayout() {
  const [instances, setInstances] = useState<WidgetInstance[]>(loadLayout);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
    } catch {
      // Storage full/unavailable — layout still works for the session.
    }
  }, [instances]);

  const add = useCallback((widgetId: string) => {
    setInstances((prev) =>
      prev.some((i) => i.widgetId === widgetId)
        ? prev
        : [...prev, { key: makeKey(), widgetId }]
    );
  }, []);

  const remove = useCallback((key: string) => {
    setInstances((prev) => prev.filter((i) => i.key !== key));
  }, []);

  /** Move `fromKey` so it sits just before `toKey`. Returns prev if no change. */
  const moveBefore = useCallback((fromKey: string, toKey: string) => {
    setInstances((prev) => {
      const fromIdx = prev.findIndex((i) => i.key === fromKey);
      const toIdx = prev.findIndex((i) => i.key === toKey);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const insertIdx = fromIdx < toIdx ? toIdx - 1 : toIdx;
      if (insertIdx === fromIdx) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(insertIdx, 0, moved);
      return next;
    });
  }, []);

  const reset = useCallback(() => setInstances(defaultLayout()), []);

  return { instances, add, remove, moveBefore, reset };
}
