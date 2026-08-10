import { widgetRegistry } from "./registry";
import { StatsWidget } from "./StatsWidget";
import { LatencyWidget } from "./LatencyWidget";
import { ErrorsWidget } from "./ErrorsWidget";
import { ActivityWidget } from "./ActivityWidget";
import { ServicesWidget } from "./ServicesWidget";
import { UptimeWidget } from "./UptimeWidget";

widgetRegistry.register({
  id: "stats",
  title: "Summary",
  defaultWidth: 3,
  component: StatsWidget,
});

widgetRegistry.register({
  id: "latency",
  title: "Request latency",
  defaultWidth: 6,
  component: LatencyWidget,
});

widgetRegistry.register({
  id: "errors",
  title: "Errors",
  defaultWidth: 3,
  component: ErrorsWidget,
});

widgetRegistry.register({
  id: "activity",
  title: "Recent activity",
  defaultWidth: 7,
  component: ActivityWidget,
});

widgetRegistry.register({
  id: "services",
  title: "Services",
  defaultWidth: 5,
  component: ServicesWidget,
});

widgetRegistry.register({
  id: "uptime",
  title: "Uptime",
  defaultWidth: 3,
  component: UptimeWidget,
});

export { widgetRegistry };
