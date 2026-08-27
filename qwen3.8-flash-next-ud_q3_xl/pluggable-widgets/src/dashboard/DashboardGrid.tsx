import { useRef } from "react";
import { registry } from "../plugins";
import type { useDashboardLayout } from "./useDashboardLayout";
import { WidgetFrame } from "./WidgetFrame";

export interface DashboardGridProps {
  layout: ReturnType<typeof useDashboardLayout>;
  customizing: boolean;
  onOpenCatalog: () => void;
}

/**
 * Renders the user's layout: one frame per instance, in order. Unknown types
 * are skipped (they're filtered at load time, but layouts can change while
 * the app runs if a plugin unregisters).
 */
export function DashboardGrid({ layout, customizing, onOpenCatalog }: DashboardGridProps) {
  const dragFrom = useRef<number | null>(null);

  const visible = layout.widgets
    .map((instance, index) => ({ instance, index, plugin: registry.get(instance.type) }))
    .filter((v): v is typeof v & { plugin: NonNullable<typeof v.plugin> } => v.plugin != null);

  if (visible.length === 0) {
    return (
      <div className="dashboard-grid">
        <div className="empty-dashboard">
          <p>No widgets on this dashboard.</p>
          <button type="button" className="btn btn-primary" onClick={onOpenCatalog}>
            Add a widget
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {visible.map(({ instance, index, plugin }) => (
        <WidgetFrame
          key={instance.id}
          instance={instance}
          plugin={plugin}
          index={index}
          lastIndex={layout.widgets.length - 1}
          customizing={customizing}
          onRemove={layout.remove}
          onMove={layout.move}
          onResize={layout.resize}
          onDragStart={(from) => {
            dragFrom.current = from;
          }}
          onDragEnter={(to) => {
            if (dragFrom.current != null && dragFrom.current !== to) {
              layout.move(dragFrom.current, to);
              dragFrom.current = to;
            }
          }}
          onDragEnd={() => {
            dragFrom.current = null;
          }}
        />
      ))}
    </div>
  );
}
