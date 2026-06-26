import { StatsWidget } from "./StatsWidget";
import { LatencyWidget } from "./LatencyWidget";
import { ErrorsWidget } from "./ErrorsWidget";
import { ActivityWidget } from "./ActivityWidget";
import { ServicesWidget } from "./ServicesWidget";
import type { WidgetDef } from "./types";

export const widgetRegistry: WidgetDef[] = [
  {
    id: "stats",
    label: "Summary",
    subtitle: "last 5 min",
    width: 3,
    component: StatsWidget,
  },
  {
    id: "latency",
    label: "Request latency",
    subtitle: "last 2h, ms",
    width: 6,
    component: LatencyWidget,
  },
  {
    id: "errors",
    label: "Errors",
    subtitle: "last 5 min",
    width: 3,
    component: ErrorsWidget,
  },
  {
    id: "activity",
    label: "Recent activity",
    subtitle: "all environments",
    width: 7,
    component: ActivityWidget,
  },
  {
    id: "services",
    label: "Services",
    subtitle: "tracked services",
    width: 5,
    component: ServicesWidget,
  },
];

export function getWidgetDef(id: string): WidgetDef | undefined {
  return widgetRegistry.find((w) => w.id === id);
}
