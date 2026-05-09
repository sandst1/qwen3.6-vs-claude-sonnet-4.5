import type { ReactNode } from "react";
import { registry } from "../plugins/registry";
import { useWidgetData } from "../plugins/useWidgetData";

/**
 * Shared widget wrapper providing consistent header + body layout,
 * loading state, and grid sizing. Individual widgets only render body content.
 */
export function WidgetShell({
  wrapperClass,
  gridColumnSpan,
  title,
  subtitle,
  loading,
  children,
}: {
  wrapperClass: string;
  gridColumnSpan: number;
  title: string;
  subtitle: string;
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`widget ${wrapperClass}`}
      style={{ gridColumn: `span ${gridColumnSpan}` }}
    >
      <div className="widget-header">
        <span className="widget-title">{title}</span>
        <span className="widget-subtitle">{subtitle}</span>
      </div>
      <div className="widget-body">
        {loading ? <span className="loading">Loading…</span> : children}
      </div>
    </div>
  );
}

/**
 * Renders a widget instance by looking up its descriptor from the registry,
 * fetching data via the shared hook, and composing with WidgetShell.
 */
export function WidgetRenderer({ typeId }: { typeId: string }) {
  const descriptor = registry.get(typeId);

  if (!descriptor) {
    return (
      <div className="widget" style={{ gridColumn: "span 3" }}>
        <div className="widget-header">
          <span className="widget-title" style={{ color: "var(--bad)" }}>
            Unknown Widget
          </span>
        </div>
        <div className="widget-body">
          <span className="loading">No descriptor found for "{typeId}"</span>
        </div>
      </div>
    );
  }

  const data = useWidgetData(descriptor.fetchData, descriptor.refreshIntervalMs);
  const loading = data === null;

  return (
    <WidgetShell
      wrapperClass={descriptor.wrapperClass}
      gridColumnSpan={descriptor.gridColumnSpan}
      title={descriptor.title}
      subtitle={descriptor.subtitle}
      loading={loading}
    >
      {data !== null && <descriptor.Component data={data} />}
    </WidgetShell>
  );
}
