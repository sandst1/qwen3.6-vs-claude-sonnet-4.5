import { type WidgetDef, WidgetRegistry } from "./types";
import { StatsWidget } from "../components/widgets/StatsWidget";
import { LatencyWidget } from "../components/widgets/LatencyWidget";
import { ErrorsWidget } from "../components/widgets/ErrorsWidget";
import { ActivityWidget } from "../components/widgets/ActivityWidget";
import { ServicesWidget } from "../components/widgets/ServicesWidget";

export const BUILTIN_WIDGETS: WidgetDef[] = [
  { key: "stats", title: "Summary", subtitle: "last 5 min", span: 3, component: StatsWidget },
  { key: "latency", title: "Request latency", subtitle: "last 2h, ms", span: 6, component: LatencyWidget },
  { key: "errors", title: "Errors", subtitle: "last 5 min", span: 3, component: ErrorsWidget },
  { key: "activity", title: "Recent activity", subtitle: "all environments", span: 7, component: ActivityWidget },
  { key: "services", title: "Services", subtitle: "", span: 5, component: ServicesWidget },
];

export function registerAll(registry: WidgetRegistry): void {
  for (const def of BUILTIN_WIDGETS) {
    registry.register(def);
  }
}
