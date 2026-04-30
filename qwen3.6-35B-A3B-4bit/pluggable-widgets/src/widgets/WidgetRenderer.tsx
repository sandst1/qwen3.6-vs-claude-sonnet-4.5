import { WidgetRegistry } from "./types";

export function WidgetRenderer({ registry, widgetKey }: { registry: WidgetRegistry; widgetKey: string }) {
  const def = registry.get(widgetKey);
  if (def == null) return null;

  const Comp = def.component;
  return <Comp />;
}
