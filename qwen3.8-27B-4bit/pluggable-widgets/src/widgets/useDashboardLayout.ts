import { useCallback, useEffect, useState } from "react";
import { defaultLayout, getWidget } from "./registry";
import type { WidgetPlacement } from "./types";

const STORAGE_KEY = "dashboard-layout";

function loadLayout(): WidgetPlacement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLayout();
    const parsed: WidgetPlacement[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultLayout();
    const valid = parsed.filter((p) => getWidget(p.widgetId) && p.span >= 1 && p.span <= 12);
    return valid.length > 0 ? valid : defaultLayout();
  } catch {
    return defaultLayout();
  }
}

function saveLayout(layout: WidgetPlacement[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // storage unavailable
  }
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<WidgetPlacement[]>(loadLayout);

  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  const addWidget = useCallback((widgetId: string) => {
    const def = getWidget(widgetId);
    if (!def) return;
    setLayout((prev) => {
      if (prev.some((p) => p.widgetId === widgetId)) return prev;
      return [...prev, { widgetId, span: def.defaultSpan }];
    });
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setLayout((prev) => prev.filter((p) => p.widgetId !== widgetId));
  }, []);

  const moveWidget = useCallback((fromIndex: number, toIndex: number) => {
    setLayout((prev) => {
      if (fromIndex === toIndex) return prev;
      if (fromIndex < 0 || fromIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      const clamped = Math.max(0, Math.min(toIndex, next.length));
      next.splice(clamped, 0, item);
      return next;
    });
  }, []);

  const setSpan = useCallback((widgetId: string, span: number) => {
    setLayout((prev) =>
      prev.map((p) =>
        p.widgetId === widgetId ? { ...p, span: Math.max(1, Math.min(12, span)) } : p,
      ),
    );
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(defaultLayout());
  }, []);

  return { layout, addWidget, removeWidget, moveWidget, setSpan, resetLayout };
}
