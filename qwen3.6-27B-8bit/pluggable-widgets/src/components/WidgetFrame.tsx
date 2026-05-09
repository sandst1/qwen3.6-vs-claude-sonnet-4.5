import type { WidgetInstance } from "../lib";
import { getWidgetType } from "../lib";

interface WidgetFrameProps {
  instance: WidgetInstance;
  onRemove: (uid: string) => void;
  onMoveUp: (uid: string) => void;
  onMoveDown: (uid: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

export function WidgetFrame({
  instance,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: WidgetFrameProps) {
  const widgetType = getWidgetType(instance.typeId);

  if (!widgetType) {
    return (
      <div className="widget widget--missing" style={{ gridColumn: `span ${12}` }}>
        <div className="widget-header">
          <span className="widget-title">Unknown widget</span>
        </div>
        <div className="widget-body">
          <span className="loading">Widget type "{instance.typeId}" not found.</span>
        </div>
      </div>
    );
  }

  const WidgetComponent = widgetType.component;

  return (
    <div
      className="widget widget--frame"
      style={{ gridColumn: `span ${widgetType.gridColumnSpan}` }}
    >
      <div className="widget-header">
        <span className="widget-title">{widgetType.title}</span>
        {widgetType.subtitle && <span className="widget-subtitle">{widgetType.subtitle}</span>}
        <div className="widget-controls">
          <button
            className="widget-btn widget-btn--move"
            title="Move up"
            disabled={isFirst}
            onClick={() => onMoveUp(instance.uid)}
            aria-label="Move widget up"
          >
            ▲
          </button>
          <button
            className="widget-btn widget-btn--move"
            title="Move down"
            disabled={isLast}
            onClick={() => onMoveDown(instance.uid)}
            aria-label="Move widget down"
          >
            ▼
          </button>
          <button
            className="widget-btn widget-btn--remove"
            title="Remove widget"
            onClick={() => onRemove(instance.uid)}
            aria-label="Remove widget"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="widget-body">
        <WidgetComponent />
      </div>
    </div>
  );
}
