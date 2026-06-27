export type WidgetRendererFn<TData = unknown> = (
  data: TData,
) => React.ReactNode;

/** @see WidgetPlugin */
export type ErrorRendererFn = (
  error: Error,
) => React.ReactNode;

export interface WidgetPlugin<TData = unknown> {
  /** Unique key, e.g. "stats" */
  key: string;
  /** Shown in the widget title */
  title: string;
  /** Shown in the widget subtitle */
  subtitle: string;
  /** Grid column span (1‑12). Total of all enabled widgets ideally ≈12 */
  columnSpan: number;
  /** Interval in ms between data polls */
  pollIntervalMs: number;
  /** Data fetcher – called once on mount and then on every interval */
  fetchData: () => Promise<TData>;
  /** Renders the data inside <div className="widget-body"> … </div> */
  render: WidgetRendererFn<TData>;
  /** Optional error renderer */
  errorRender?: ErrorRendererFn;
  customClass?: string;
}

/** Mutable store – widgets register themselves via `registerWidget` */
const registry = new Map<string, WidgetPlugin<unknown>>();

export function registerWidget<TData = unknown>(
  plugin: WidgetPlugin<TData>,
): void {
  registry.set(plugin.key, plugin as WidgetPlugin<unknown>);
}

export function getWidget<TData = unknown>(
  key: string,
): WidgetPlugin<TData> | undefined {
  return registry.get(key) as WidgetPlugin<TData> | undefined;
}

export function getAllWidgets(): WidgetPlugin[] {
  return [...registry.values()];
}

