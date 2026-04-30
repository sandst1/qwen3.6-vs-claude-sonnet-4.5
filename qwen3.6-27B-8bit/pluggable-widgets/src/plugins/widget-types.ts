import { type ComponentType } from "react";

/** Configuration describing a widget type that can be registered in the dashboard. */
export interface WidgetDescriptor<TData = unknown> {
  /** Unique identifier for this widget type. */
  id: string;

  /** Display title shown in the widget header. */
  title: string;

  /** Subtitle shown in the widget header. */
  subtitle: string;

  /** Number of grid columns (out of 12) this widget spans. */
  gridColumnSpan: number;

  /** CSS class name for the widget wrapper (e.g., "widget--stats"). */
  wrapperClass: string;

  /** React component that renders the widget body content. */
  Component: ComponentType<{ data: TData }>;

  /** Async function that fetches the widget's data. */
  fetchData: () => Promise<TData>;

  /** Polling interval in milliseconds. */
  refreshIntervalMs: number;
}

/** A widget instance placed on the dashboard — ties a type to user定制的 layout state. */
export interface WidgetInstance {
  /** Unique instance ID (can have multiple of the same type). */
  instanceId: string;

  /** The descriptor ID this instance renders. */
  typeId: string;
}
