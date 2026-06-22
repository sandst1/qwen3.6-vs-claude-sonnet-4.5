import { useState, useEffect } from "react";
import { type WidgetDefinition } from "../types/widget";
import { widgetsRegistry, getDefaultWidgets } from "../config/widgetsRegistry";

const STORAGE_KEY = "dashboard_widgets";

function loadWidgetOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultWidgets();
  } catch {
    return getDefaultWidgets();
  }
}

function saveWidgetOrder(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useWidgetManager() {
  const [activeIds, setActiveIds] = useState<string[]>(loadWidgetOrder);

  useEffect(() => {
    saveWidgetOrder(activeIds);
  }, [activeIds]);

  const addWidget = (id: string) => {
    setActiveIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  const removeWidget = (id: string) => {
    setActiveIds(prev => prev.filter(wId => wId !== id));
  };

  const reorderWidgets = (fromIndex: number, toIndex: number) => {
    setActiveIds(prev => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
  });
  };

  return { activeIds, add: addWidget, remove: removeWidget, reorder: reorderWidgets };
}

export function getWidgetDefinition(id: string): WidgetDefinition | undefined {
  return widgetsRegistry.find(w => w.id === id);
}
