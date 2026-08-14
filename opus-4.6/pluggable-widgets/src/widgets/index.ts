/**
 * Widget registrations.
 *
 * To add a new widget:
 *   1. Create a component in src/components/widgets/
 *   2. Call registerWidget() here with type, label, colSpan, and component.
 *   3. (Optional) Add the type to DEFAULT_LAYOUT in registry.ts if it should
 *      appear by default for new users.
 *
 * That's it — the dashboard picks it up automatically.
 */

import { registerWidget } from "./registry";

import { StatsWidget } from "../components/widgets/StatsWidget";
import { LatencyWidget } from "../components/widgets/LatencyWidget";
import { ErrorsWidget } from "../components/widgets/ErrorsWidget";
import { ActivityWidget } from "../components/widgets/ActivityWidget";
import { ServicesWidget } from "../components/widgets/ServicesWidget";

registerWidget({
  type: "stats",
  label: "Summary Stats",
  colSpan: 3,
  component: StatsWidget,
});

registerWidget({
  type: "latency",
  label: "Request Latency",
  colSpan: 6,
  component: LatencyWidget,
});

registerWidget({
  type: "errors",
  label: "Errors",
  colSpan: 3,
  component: ErrorsWidget,
});

registerWidget({
  type: "activity",
  label: "Recent Activity",
  colSpan: 7,
  component: ActivityWidget,
});

registerWidget({
  type: "services",
  label: "Services",
  colSpan: 5,
  component: ServicesWidget,
});
