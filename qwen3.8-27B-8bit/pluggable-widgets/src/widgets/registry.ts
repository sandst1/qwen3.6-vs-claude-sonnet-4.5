import type { ComponentType } from "react";
import { StatsWidget } from "../components/widgets/StatsWidget";
import { LatencyWidget } from "../components/widgets/LatencyWidget";
import { ErrorsWidget } from "../components/widgets/ErrorsWidget";
import { ActivityWidget } from "../components/widgets/ActivityWidget";
import { ServicesWidget } from "../components/widgets/ServicesWidget";

export type WidgetId = string;

export interface WidgetDefinition {
  /** Stable unique id, used in persisted layout. */
  id: WidgetId;
  /** Human-readable name, shown in the widget header and the add-widget menu. */
  title: string;
  /** Optional secondary header text. */
  subtitle?: string;
  /** Grid columns the widget spans (grid is 12 columns). */
  span: number;
  /** The content component. Renders only the body — header is provided by the shell. */
  Component: ComponentType;
}

/**
 * All available widget types. To add a new widget:
 *   1. Create a component in src/components/widgets (body only, no header).
 *   2. Add an entry here.
 * That's it — it shows up in the "add widget" menu automatically.
 */
export const WIDGETS: WidgetDefinition[] = [
  {
    id: "stats",
    title: "Summary",
    subtitle: "last 5 min",
    span: 3,
    Component: StatsWidget,
  },
  {
    id: "latency",
    title: "Request latency",
    subtitle: "last 2h, ms",
    span: 6,
    Component: LatencyWidget,
  },
  {
    id: "errors",
    title: "Errors",
    subtitle: "last 5 min",
    span: 3,
    Component: ErrorsWidget,
  },
  {
    id: "activity",
    title: "Recent activity",
    subtitle: "all environments",
    span: 7,
    Component: ActivityWidget,
  },
  {
    id: "services",
    title: "Services",
    span: 5,
    Component: ServicesWidget,
  },
];

export const WIDGET_BY_ID: Record<string, WidgetDefinition> = Object.fromEntries(
  WIDGETS.map((w) => [w.id, w]),
);

/** Default layout for first-time users. */
export const DEFAULT_LAYOUT: WidgetId[] = [
  "stats",
  "latency",
  "errors",
  "activity",
  "services",
];
