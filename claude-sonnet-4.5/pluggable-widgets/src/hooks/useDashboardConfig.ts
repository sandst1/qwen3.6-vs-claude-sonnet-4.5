import { useState, useEffect } from "react";
import { WidgetInstance, defaultWidgetLayout } from "../widgetRegistry";

const STORAGE_KEY = "dashboard-config";

/**
 * Hook for managing dashboard customization
 * Handles loading/saving widget configuration to localStorage
 */
export function useDashboardConfig() {
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load configuration from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as WidgetInstance[];
        setWidgets(parsed);
      } else {
        setWidgets(defaultWidgetLayout);
      }
    } catch (error) {
      console.error("Failed to load dashboard config:", error);
      setWidgets(defaultWidgetLayout);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save configuration to localStorage whenever it changes
  const saveConfig = (newWidgets: WidgetInstance[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
      setWidgets(newWidgets);
    } catch (error) {
      console.error("Failed to save dashboard config:", error);
    }
  };

  /**
   * Add a new widget instance to the dashboard
   */
  const addWidget = (widgetId: string) => {
    const instanceId = `${widgetId}-${Date.now()}`;
    const newWidget: WidgetInstance = {
      instanceId,
      widgetId,
    };
    saveConfig([...widgets, newWidget]);
  };

  /**
   * Remove a widget instance from the dashboard
   */
  const removeWidget = (instanceId: string) => {
    saveConfig(widgets.filter((w) => w.instanceId !== instanceId));
  };

  /**
   * Reorder widgets in the dashboard
   */
  const reorderWidgets = (newOrder: WidgetInstance[]) => {
    saveConfig(newOrder);
  };

  /**
   * Update a widget's span
   */
  const updateWidgetSpan = (instanceId: string, span: number) => {
    saveConfig(
      widgets.map((w) =>
        w.instanceId === instanceId ? { ...w, span } : w
      )
    );
  };

  /**
   * Reset dashboard to default layout
   */
  const resetToDefault = () => {
    saveConfig(defaultWidgetLayout);
  };

  return {
    widgets,
    isLoading,
    addWidget,
    removeWidget,
    reorderWidgets,
    updateWidgetSpan,
    resetToDefault,
  };
}
