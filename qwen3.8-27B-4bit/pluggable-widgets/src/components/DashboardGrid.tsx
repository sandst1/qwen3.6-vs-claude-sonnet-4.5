import { getWidget } from "../widgets";
import type { WidgetPlacement } from "../widgets";

export function DashboardGrid({
  layout,
}: {
  layout: WidgetPlacement[];
}) {
  return (
    <div className="dashboard-grid">
      {layout.map((placement) => {
        const def = getWidget(placement.widgetId);
        if (!def) return null;
        const WidgetComponent = def.component;
        return (
          <div
            key={placement.widgetId}
            className="widget-cell"
            style={{ gridColumn: `span ${placement.span}` }}
          >
            <WidgetComponent />
          </div>
        );
      })}
    </div>
  );
}
