import { ComponentType } from "react";
import { StatsWidget } from "./components/widgets/StatsWidget";
import { LatencyWidget } from "./components/widgets/LatencyWidget";
import { ErrorsWidget } from "./components/widgets/ErrorsWidget";
import { ActivityWidget } from "./components/widgets/ActivityWidget";
import { ServicesWidget } from "./components/widgets/ServicesWidget";

/**
 * Configuration for a widget type
 */
export interface WidgetDefinition {
  /** Unique identifier for this widget type */
  id: string;
  /** Display name for the widget */
  name: string;
  /** Brief description of what this widget does */
  description: string;
  /** The React component to render */
  component: ComponentType;
  /** Default grid column span (1-12) */
  defaultSpan: number;
  /** Category for organizing widgets */
  category: string;
}

/**
 * Instance of a widget in the dashboard
 */
export interface WidgetInstance {
  /** Unique instance ID */
  instanceId: string;
  /** Reference to the widget type */
  widgetId: string;
  /** Custom span override (optional) */
  span?: number;
}

/**
 * Registry of all available widget types
 * 
 * To add a new widget type, simply add it to this registry:
 * 1. Import the widget component
 * 2. Add a new entry to the registry object
 */
export const widgetRegistry: Record<string, WidgetDefinition> = {
  stats: {
    id: "stats",
    name: "Summary Stats",
    description: "Key metrics at a glance: requests, latency, users, errors",
    component: StatsWidget,
    defaultSpan: 3,
    category: "metrics",
  },
  latency: {
    id: "latency",
    name: "Latency Chart",
    description: "Request latency over time (p95 and p99 percentiles)",
    component: LatencyWidget,
    defaultSpan: 6,
    category: "metrics",
  },
  errors: {
    id: "errors",
    name: "Error Count",
    description: "Recent error count with alerts",
    component: ErrorsWidget,
    defaultSpan: 3,
    category: "alerts",
  },
  activity: {
    id: "activity",
    name: "Activity Feed",
    description: "Recent deployment and operational activities",
    component: ActivityWidget,
    defaultSpan: 7,
    category: "events",
  },
  services: {
    id: "services",
    name: "Service Status",
    description: "Health and uptime of all services",
    component: ServicesWidget,
    defaultSpan: 5,
    category: "status",
  },
};

/**
 * Get all widget definitions grouped by category
 */
export function getWidgetsByCategory(): Record<string, WidgetDefinition[]> {
  const result: Record<string, WidgetDefinition[]> = {};
  
  Object.values(widgetRegistry).forEach((widget) => {
    if (!result[widget.category]) {
      result[widget.category] = [];
    }
    result[widget.category].push(widget);
  });
  
  return result;
}

/**
 * Default dashboard layout
 */
export const defaultWidgetLayout: WidgetInstance[] = [
  { instanceId: "stats-1", widgetId: "stats" },
  { instanceId: "latency-1", widgetId: "latency" },
  { instanceId: "errors-1", widgetId: "errors" },
  { instanceId: "activity-1", widgetId: "activity" },
  { instanceId: "services-1", widgetId: "services" },
];
