import { useEffect, useState } from "react";
import { widgetRegistry } from "../components/widgets/registry";

export type LayoutItem = {
  instanceId: string;
  widgetId: string;
  width: number;
};

const STORAGE_KEY = "ops-dashboard-layout";

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export function useLayout() {
  const [items, setItems] = useState<LayoutItem[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    // default layout
    return [
      { instanceId: generateId(), widgetId: "stats", width: 3 },
      { instanceId: generateId(), widgetId: "latency", width: 6 },
      { instanceId: generateId(), widgetId: "errors", width: 3 },
      { instanceId: generateId(), widgetId: "activity", width: 7 },
      { instanceId: generateId(), widgetId: "services", width: 5 },
    ];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addWidget = (widgetId: string) => {
    const meta = widgetRegistry.get(widgetId);
    if (!meta) return;
    setItems((prev) => [
      ...prev,
      { instanceId: generateId(), widgetId, width: meta.defaultWidth },
    ]);
  };

  const removeWidget = (instanceId: string) => {
    setItems((prev) => prev.filter((i) => i.instanceId !== instanceId));
  };

  const moveWidget = (fromIndex: number, toIndex: number) => {
    setItems((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return arr;
    });
  };

  const updateWidth = (instanceId: string, width: number) => {
    setItems((prev) =>
      prev.map((i) => (i.instanceId === instanceId ? { ...i, width } : i))
    );
  };

  const resetLayout = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return { items, addWidget, removeWidget, moveWidget, updateWidth, resetLayout };
}
