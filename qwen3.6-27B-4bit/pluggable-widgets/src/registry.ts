import { type ReactNode } from "react";

/**
 * Contract for a pluggable dashboard widget.
 *
 * To add a new widget:
 *   1. Define your data type
 *   2. Write a fetch function
 *   3. Write a presentational component that receives `data` as a prop
 *   4. Call registerWidget() — typically at module scope so it runs on import
 *
 * The framework handles: fetching, polling, loading states, layout shell,
 * visibility, and ordering. Your component only renders given data.
 */
export interface WidgetDescriptor<T = unknown> {
  /** Unique identifier, used as the key in registry and config */
  id: string;

  /** Display title shown in widget header */
  title: string;

  /** Optional subtitle shown in widget header. Can be static or computed from data. */
  subtitle?: string | ((data: T | null) => string);

  /** Grid column span (1–12). Default layout fits 12 columns. */
  size: number;

  /** Polling interval in milliseconds */
  interval: number;

  /** Async function that fetches fresh data */
  fetch: () => Promise<T>;

  /** Presentational component. Receives current data (null while loading). */
  component: (data: T | null) => ReactNode;
}

const registry = new Map<string, WidgetDescriptor<unknown>>();

/**
 * Register a widget with the dashboard. Call once per widget type,
 * typically at module scope. The framework uses this to discover available
 * widgets and render them according to user config.
 */
export function registerWidget<T>(desc: WidgetDescriptor<T>): void {
  if (registry.has(desc.id)) {
    console.warn(`Widget "${desc.id}" is already registered, skipping.`);
    return;
  }
  registry.set(desc.id, desc as WidgetDescriptor<unknown>);
}

/** Return all registered widgets in registration order. */
export function getRegisteredWidgets(): readonly WidgetDescriptor<unknown>[] {
  return Array.from(registry.values());
}

/** Look up a single widget by id. */
export function getWidget(id: string): WidgetDescriptor<unknown> | undefined {
  return registry.get(id);
}
