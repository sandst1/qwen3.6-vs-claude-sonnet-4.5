import type { ComponentType } from "react";

export interface WidgetDefinition {
  id: string;
  title: string;
  subtitle?: string;
  defaultCols: number;
  component: ComponentType;
}

const registry = new Map<string, WidgetDefinition>();

export function defineWidget(def: WidgetDefinition): WidgetDefinition {
  if (registry.has(def.id)) {
    throw new Error(`Widget "${def.id}" is already registered`);
  }
  registry.set(def.id, def);
  return def;
}

export function getWidget(id: string): WidgetDefinition | undefined {
  return registry.get(id);
}

export function getAllWidgets(): WidgetDefinition[] {
  return [...registry.values()];
}
