import type { WidgetType } from "./widget-types";

const registry = new Map<string, WidgetType>();

/**
 * Register a widget type. Call once per widget (typically at module scope).
 * Throws if the id is already taken.
 */
export function registerWidget(widget: WidgetType): void {
  if (registry.has(widget.id)) {
    throw new Error(`Widget "${widget.id}" is already registered`);
  }
  registry.set(widget.id, widget);
}

/** Get a widget type by id, or undefined if not registered */
export function getWidgetType(id: string): WidgetType | undefined {
  return registry.get(id);
}

/** Get all registered widget types */
export function getAllWidgetTypes(): WidgetType[] {
  return Array.from(registry.values());
}
