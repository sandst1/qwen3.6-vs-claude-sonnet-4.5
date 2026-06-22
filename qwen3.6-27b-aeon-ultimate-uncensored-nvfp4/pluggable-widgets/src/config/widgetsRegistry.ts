import { type WidgetDefinition } from "../types/widget";
import { StatsWidget } from "../components/widgets/StatsWidget";
import { LatencyWidget } from "../components/widgets/LatencyWidget";
import { ErrorsWidget } from "../components/widgets/ErrorsWidget";
import { ActivityWidget } from "../components/widgets/ActivityWidget";
import { ServicesWidget } from "../components/widgets/ServicesWidget";

/**
 * Add new widget types here. Each entry is a "plug" — a simple object describing
 * the widget, what it looks like, and which React component renders it.
 *
 * To add a new widget:
 * 1. Create the component in `components/widgets/`
 * 2. Add an entry below
 * 3. The dashboard will automatically make it available
 */
export const widgetsRegistry: WidgetDefinition[] = [
  { id: "stats", label: "Summary", gridColumn: 3, component: StatsWidget },
  { id: "latency", label: "Request Latency", gridColumn: 6, component: LatencyWidget },
  { id: "errors", label: "Errors", gridColumn: 3, component: ErrorsWidget },
  { id: "activity", label: "Recent Activity", gridColumn: 7, component: ActivityWidget },
  { id: "services", label: "Services", gridColumn: 5, component: ServicesWidget },
];

/**
 * The default widget configuration when localStorage is empty (first visit).
 */
export function getDefaultWidgets(): string[] {
  return [
    "stats", "latency", "errors", "activity", "services"
  ];
}
