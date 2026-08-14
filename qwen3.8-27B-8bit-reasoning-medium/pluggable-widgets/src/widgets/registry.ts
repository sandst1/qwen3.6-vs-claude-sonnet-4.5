import type { WidgetDef } from "./types";
import { statsWidget } from "../components/widgets/StatsWidget";
import { latencyWidget } from "../components/widgets/LatencyWidget";
import { errorsWidget } from "../components/widgets/ErrorsWidget";
import { activityWidget } from "../components/widgets/ActivityWidget";
import { servicesWidget } from "../components/widgets/ServicesWidget";

const definitions: WidgetDef[] = [
  statsWidget,
  latencyWidget,
  errorsWidget,
  activityWidget,
  servicesWidget,
];

/** All known widget types, keyed by id. */
export const WIDGET_TYPES: Record<string, WidgetDef> = Object.fromEntries(
  definitions.map((d) => [d.id, d]),
);

/** Default layout for first-time users (order = the original dashboard). */
export const DEFAULT_LAYOUT: string[] = definitions.map((d) => d.id);
