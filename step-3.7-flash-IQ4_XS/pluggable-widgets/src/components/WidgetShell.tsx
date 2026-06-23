import { registry } from "../widgets/registry";

interface WidgetShellProps {
  widgetId: string;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  showControls: boolean;
}

export function WidgetShell({
  widgetId,
  onRemove,
  onMoveUp,
  onMoveDown,
  showControls,
}: WidgetShellProps) {
  const definition = registry.get(widgetId);
  if (!definition) return null;

  const { component: WidgetComponent } = definition;

  return (
    <div className="widget-shell" style={{ gridColumn: `span ${definition.gridSpan}` }}>
      {showControls && (
        <div className="widget-controls">
          <button
            className="widget-control-btn"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            title="Move up"
          >
            ↑
          </button>
          <button
            className="widget-control-btn"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            title="Move down"
          >
            ↓
          </button>
          <button
            className="widget-control-btn widget-control-btn--remove"
            onClick={onRemove}
            title="Remove widget"
          >
            ×
          </button>
        </div>
      )}
      <WidgetComponent />
    </div>
  );
}
