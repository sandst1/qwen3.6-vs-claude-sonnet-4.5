import { useState, useCallback } from "react";
import { registry } from "./widget-registry";
import type { LayoutEntry } from "./widget-schema";

export function useDashboardStore() {
  const [layout, setLayout] = useState<LayoutEntry[]>(() => {
    return registry.getAll().map((w) => ({ id: w.id, size: w.size, collapsed: false }));
  });

  const addWidget = useCallback((id: string) => {
    setLayout((prev) => {
      if (prev.find((e) => e.id === id)) return prev;
      const widget = registry.get(id);
      if (!widget) return prev;
      return [...prev, { id, size: widget.size, collapsed: false }];
    });
  }, []);

  const removeWidget = useCallback((id: string) => {
    setLayout((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const reorderWidget = useCallback((fromIndex: number, toIndex: number) => {
    setLayout((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  const toggleCollapsed = useCallback((id: string) => {
    setLayout((prev) =>
      prev.map((e) => (e.id === id ? { ...e, collapsed: !e.collapsed } : e))
    );
  }, []);

  const getAllAvailable = useCallback(() => registry.getAll(), []);
  const hasWidget = useCallback((id: string) => layout.some((e) => e.id === id), [layout]);

  return {
    layout,
    setLayout,
    addWidget,
    removeWidget,
    reorderWidget,
    toggleCollapsed,
    getAllAvailable,
    hasWidget,
  };
}
