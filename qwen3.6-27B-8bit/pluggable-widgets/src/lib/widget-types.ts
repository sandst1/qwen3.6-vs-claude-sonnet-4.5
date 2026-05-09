import type { ComponentType } from "react";

/**
 * Describes a widget type that can be placed on the dashboard.
 *
 * To add a new widget:
 *  1. Create the component (e.g. MyWidget.tsx)
 *  2. Call registerWidget({ id, title, component, gridColumnSpan })
 */
export interface WidgetType {
  /** Unique identifier (e.g. "stats", "latency") */
  id: string;
  /** Display name shown in the picker and widget header */
  title: string;
  /** Optional subtitle shown next to the title (e.g. "last 5 min") */
  subtitle?: string;
  /** The React component to render (body content only — no outer shell) */
  component: ComponentType;
  /** How many of the 12 grid columns this widget spans (1–12) */
  gridColumnSpan: number;
}

/**
 * A single widget instance placed on the dashboard.
 * The `uid` is a runtime-generated unique ID so the same widget type
 * can appear multiple times if needed.
 */
export interface WidgetInstance {
  uid: string;
  typeId: string;
}

/** Full dashboard layout saved to / loaded from localStorage */
export interface DashboardLayout {
  widgets: WidgetInstance[];
}
