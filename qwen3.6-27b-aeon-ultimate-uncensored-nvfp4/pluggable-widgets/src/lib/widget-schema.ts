import type { ComponentType } from "react";

export type WidgetSize = "small" | "medium" | "large";

export interface WidgetMetadata {
  id: string;
  title: string;
  subtitle: string;
  size: WidgetSize;
}

export interface WidgetType extends WidgetMetadata {
  Component: ComponentType;
}

export interface LayoutEntry {
  id: string;
  size?: WidgetSize;
  collapsed?: boolean;
}

export interface DashboardLayout {
  entries: LayoutEntry[];
}

const DEFAULT_LAYOUT: DashboardLayout = {
  entries: [
    { id: "stats", size: "medium" },
    { id: "latency", size: "large" },
    { id: "errors", size: "small" },
    { id: "activity", size: "medium" },
    { id: "services", size: "small" },
  ],
};

const STORAGE_KEY = "dashboard-layout";

export function loadLayout(): DashboardLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.entries)) return parsed;
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_LAYOUT;
}

export function saveLayout(layout: DashboardLayout): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}
