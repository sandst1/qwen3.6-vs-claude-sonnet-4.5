import { registry } from "../widgets/registry";
import { WidgetShell } from "./WidgetShell";
import { useDashboardConfig } from "../hooks/useDashboardConfig";

export function Dashboard() {
  const { config, removeWidget, moveWidget, addWidget } = useDashboardConfig();

  const availableWidgets = registry.getAll().filter(
    (w) => !config.widgetIds.includes(w.id)
  );

  return (
    <div className="dashboard-grid">
      {config.widgetIds.map((id, index) => (
        <WidgetShell
          key={id}
          widgetId={id}
          showControls={true}
          onRemove={() => removeWidget(id)}
          onMoveUp={
            index > 0 ? () => moveWidget(index, index - 1) : undefined
          }
          onMoveDown={
            index < config.widgetIds.length - 1
              ? () => moveWidget(index, index + 1)
              : undefined
          }
        />
      ))}

      {availableWidgets.length > 0 && (
        <div className="widget-add-zone">
          <select
            className="widget-add-select"
            onChange={(e) => {
              if (e.target.value) {
                addWidget(e.target.value);
                e.target.value = "";
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>
              + Add widget
            </option>
            {availableWidgets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
