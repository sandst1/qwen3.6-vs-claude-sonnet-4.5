import { registry } from "./registry";
import { widgetDefinition as statsDef } from "../components/widgets/StatsWidget";
import { widgetDefinition as latencyDef } from "../components/widgets/LatencyWidget";
import { widgetDefinition as errorsDef } from "../components/widgets/ErrorsWidget";
import { widgetDefinition as activityDef } from "../components/widgets/ActivityWidget";
import { widgetDefinition as servicesDef } from "../components/widgets/ServicesWidget";
import { widgetDefinition as throughputDef } from "../components/widgets/ThroughputWidget";

registry.register(statsDef);
registry.register(latencyDef);
registry.register(errorsDef);
registry.register(activityDef);
registry.register(servicesDef);
registry.register(throughputDef);

export { registry };
