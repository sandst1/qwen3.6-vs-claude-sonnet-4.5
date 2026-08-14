import { type ComponentType } from "react";

export interface WidgetDefinition {
  /** Unique key, e.g. "stats", "latency". Used in saved layouts. */
  type: string;
  /** Human-readable name shown in the "Add widget" menu. */
  label: string;
  /** CSS grid column span (out of 12). */
  colSpan: number;
  /** The React component to render. Receives no props. */
  component: ComponentType;
}

const registry = new Map<string, WidgetDefinition>();

/** Register a widget type. Call at module scope. */
export function registerWidget(def: WidgetDefinition) {
  if (registry.has(def.type)) {
    console.warn(`Widget type "${def.type}" registered twice — overwriting.`);
  }
  registry.set(def.type, def);
}

/** Get a registered widget by type key. */
export function getWidget(type: string): WidgetDefinition | undefined {
  return registry.get(type);
}

/** All registered widget types. */
export function allWidgets(): WidgetDefinition[] {
  return Array.from(registry.values());
}

/** The default layout — shown when user has no saved customisation. */
export const DEFAULT_LAYOUT: string[] = [
  "stats",
  "latency",
  "errors",
  "activity",
  "services",
];
