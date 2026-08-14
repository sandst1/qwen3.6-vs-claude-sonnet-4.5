import type { WidgetDefinition } from "./types";
import { StatsWidget } from "../components/widgets/StatsWidget";
import { LatencyWidget } from "../components/widgets/LatencyWidget";
import { ErrorsWidget } from "../components/widgets/ErrorsWidget";
import { ActivityWidget } from "../components/widgets/ActivityWidget";
import { ServicesWidget } from "../components/widgets/ServicesWidget";

const registry = new Map<string, WidgetDefinition>();

export function registerWidget(def: WidgetDefinition): void {
  if (registry.has(def.id)) {
    throw new Error(`Widget id already registered: ${def.id}`);
  }
  registry.set(def.id, def);
}

export function getWidget(id: string): WidgetDefinition | undefined {
  return registry.get(id);
}

export function allWidgets(): WidgetDefinition[] {
  return [...registry.values()];
}

// --- Built-in widgets -------------------------------------------------------
// To add a new widget: create a component in src/components/widgets/ and
// register it here. It then appears in the dashboard's add-widget palette.

registerWidget({ id: "stats", title: "Summary", span: 3, component: StatsWidget });
registerWidget({ id: "latency", title: "Request latency", span: 6, component: LatencyWidget });
registerWidget({ id: "errors", title: "Errors", span: 3, component: ErrorsWidget });
registerWidget({ id: "activity", title: "Recent activity", span: 7, component: ActivityWidget });
registerWidget({ id: "services", title: "Services", span: 5, component: ServicesWidget });
