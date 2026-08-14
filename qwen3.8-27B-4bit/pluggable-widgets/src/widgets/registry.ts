import type { ComponentType } from "react";
import type { WidgetDef } from "./types";

const registry = new Map<string, WidgetDef>();

export function registerWidget(def: WidgetDef): void {
  if (registry.has(def.id)) {
    throw new Error(`Widget "${def.id}" is already registered`);
  }
  registry.set(def.id, def);
}

export function getWidget(id: string): WidgetDef | undefined {
  return registry.get(id);
}

export function getAllWidgets(): WidgetDef[] {
  return [...registry.values()];
}

export function defaultLayout(): { widgetId: string; span: number }[] {
  return getAllWidgets().map((w) => ({ widgetId: w.id, span: w.defaultSpan }));
}

export function createWidget(
  id: string,
  name: string,
  component: ComponentType,
  defaultSpan: number,
  description?: string,
): void {
  registerWidget({ id, name, component, defaultSpan, description });
}
