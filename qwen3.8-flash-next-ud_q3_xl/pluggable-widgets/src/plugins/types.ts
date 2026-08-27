import type { ComponentType } from "react";

/** Total columns of the dashboard grid. */
export const GRID_COLUMNS = 12;

/** Spans a widget may be resized to unless the plugin narrows the list. */
export const DEFAULT_SPANS = [3, 4, 5, 6, 7, 8, 9, 12];

export interface WidgetProps {
  /**
   * Stable id of this layout instance. Two instances of the same widget
   * type get different ids — use it as a key for per-instance state or config.
   */
  instanceId: string;
  /** Current grid span (1..GRID_COLUMNS). Useful for responsive internals. */
  span: number;
}

export interface WidgetPlugin {
  /**
   * Unique, stable, namespaced type id (e.g. "core.latency").
   * Persisted in user layouts — never rename or reuse an existing id.
   */
  id: string;
  /** Card title shown in the frame header. */
  title: string;
  /** Small text next to the title. */
  subtitle?: string;
  /** Shown in the "Add widget" catalog. */
  description: string;
  /** Grid span used when the widget is first added. */
  defaultSpan: number;
  /** Spans the user may pick; defaults to DEFAULT_SPANS. */
  allowedSpans?: number[];
  /** The widget body. The shell renders the card chrome around it. */
  component: ComponentType<WidgetProps>;
}

export function allowedSpans(plugin: WidgetPlugin): number[] {
  const spans = plugin.allowedSpans ?? DEFAULT_SPANS;
  return spans.includes(plugin.defaultSpan) ? spans : [plugin.defaultSpan, ...spans];
}
