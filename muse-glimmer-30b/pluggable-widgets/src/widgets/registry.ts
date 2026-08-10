import { StatsWidget } from "../components/widgets/StatsWidget";
import { LatencyWidget } from "../components/widgets/LatencyWidget";
import { ErrorsWidget } from "../components/widgets/ErrorsWidget";
import { ActivityWidget } from "../components/widgets/ActivityWidget";
import { ServicesWidget } from "../components/widgets/ServicesWidget";

export type WidgetDefinition = {
  id: string;
  name: string;
  component: React.ComponentType;
  defaultCols: number;
};

export const WIDGETS: Record<string, WidgetDefinition> = {
  stats: {
    id: "stats",
    name: "Summary",
    component: StatsWidget,
    defaultCols: 3,
  },
  latency: {
    id: "latency",
    name: "Request latency",
    component: LatencyWidget,
    defaultCols: 6,
  },
  errors: {
    id: "errors",
    name: "Errors",
    component: ErrorsWidget,
    defaultCols: 3,
  },
  activity: {
    id: "activity",
    name: "Recent activity",
    component: ActivityWidget,
    defaultCols: 7,
  },
  services: {
    id: "services",
    name: "Services",
    component: ServicesWidget,
    defaultCols: 5,
  },
};

export const WIDGET_IDS = Object.keys(WIDGETS);
