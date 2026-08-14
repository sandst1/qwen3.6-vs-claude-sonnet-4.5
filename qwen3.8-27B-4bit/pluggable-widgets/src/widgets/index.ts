import { createWidget } from "./registry";
import { StatsWidget } from "../components/widgets/StatsWidget";
import { LatencyWidget } from "../components/widgets/LatencyWidget";
import { ErrorsWidget } from "../components/widgets/ErrorsWidget";
import { ActivityWidget } from "../components/widgets/ActivityWidget";
import { ServicesWidget } from "../components/widgets/ServicesWidget";

createWidget("stats", "Summary", StatsWidget, 3, "Key metrics at a glance");
createWidget("latency", "Request latency", LatencyWidget, 6, "p95 / p99 latency trends");
createWidget("errors", "Errors", ErrorsWidget, 3, "Error counts by time window");
createWidget("activity", "Recent activity", ActivityWidget, 7, "Deployment and ops events");
createWidget("services", "Services", ServicesWidget, 5, "Service health and uptime");

export { getWidget, getAllWidgets, defaultLayout, registerWidget, createWidget } from "./registry";
export { useDashboardLayout } from "./useDashboardLayout";
export type { WidgetDef, WidgetPlacement } from "./types";
