import { registry } from "./registry";
import stats from "./core/stats";
import latency from "./core/latency";
import errors from "./core/errors";
import activity from "./core/activity";
import services from "./core/services";

/**
 * Single place where widget types are registered. To add a new widget:
 *   1. create `src/plugins/core/<name>.tsx` exporting a `WidgetPlugin`
 *   2. import it here and add it to this array
 * Nothing else in the app needs to change.
 */
const coreWidgets = [stats, latency, errors, activity, services];

for (const widget of coreWidgets) {
  registry.register(widget);
}

export { registry };
