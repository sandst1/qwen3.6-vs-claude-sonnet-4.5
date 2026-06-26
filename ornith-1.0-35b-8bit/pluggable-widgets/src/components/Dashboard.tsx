import { useMemo, useState } from "react";
import { getWidgetDef } from "./widgets/registry";
import { useDashboardLayout } from "./useDashboardLayout";
import { WidgetPalette } from "./WidgetPalette";

export interface DashboardLayoutActions {
  addWidget: (id: string) => void;
  removeWidget: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  resetLayout: () => void;
}

function toDashboardActions(layout: ReturnType<typeof useDashboardLayout>): DashboardLayoutActions {
  return {
    addWidget: layout.addWidget,
    removeWidget: layout.removeWidget,
    resetLayout: layout.resetLayout,
    moveUp: (id: string) => {
      const idx = layout.ids.indexOf(id);
      if (idx > 0) layout.moveWidget(idx, idx - 1);
    },
    moveDown: (id: string) => {
      const idx = layout.ids.indexOf(id);
      if (idx >= 0 && idx < layout.ids.length - 1) layout.moveWidget(idx, idx + 1);
    },
  };
}

export function Dashboard() {
  const layout = useDashboardLayout();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const actions = useMemo(() => toDashboardActions(layout), [layout]);

  const widgets = useMemo(
    () =>
      layout.ids
        .map((id) => getWidgetDef(id))
        .filter((w): w is NonNullable<typeof w> => w != null),
    [layout.ids],
  );

  return (
    <div className="dashboard">
      <div className="dashboard-toolbar">
        <button className="palette-toggle" onClick={() => setPaletteOpen(!paletteOpen)}>
          Configure widgets
        </button>
      </div>

      <div className="dashboard-grid">
        {widgets.map((w) => {
          const WidgetCtor = w.component;
          return (
            <div
              key={w.id}
              className="widget-slot"
              style={{ gridColumn: `span ${w.width}` }}
            >
              <WidgetCtor />
            </div>
          );
        })}
      </div>

      <WidgetPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        activeIds={layout.ids}
        actions={actions}
      />
    </div>
  );
}
