import { type WidgetDescriptor } from "../registry";
import { useWidgetData } from "../hooks/useWidgetData";

/**
 * Shared wrapper that handles data fetching, polling, loading/error states,
 * and the common widget shell. Widget authors only write the content component.
 *
 * Used internally by the dashboard — widget authors don't import this directly.
 */
export function WidgetShell({ descriptor }: { descriptor: WidgetDescriptor<unknown> }) {
  const { data, loading, error } = useWidgetData(descriptor.fetch, descriptor.interval);

  const subtitle =
    typeof descriptor.subtitle === "function"
      ? descriptor.subtitle(data)
      : descriptor.subtitle;

  return (
    <div className="widget" style={{ gridColumn: `span ${descriptor.size}` }}>
      <div className="widget-header">
        <span className="widget-title">{descriptor.title}</span>
        {subtitle && <span className="widget-subtitle">{subtitle}</span>}
      </div>
      <div className="widget-body">
        {loading && !data ? (
          <span className="loading">Loading…</span>
        ) : error ? (
          <span className="error">Failed to load</span>
        ) : (
          descriptor.component(data)
        )}
      </div>
    </div>
  );
}
