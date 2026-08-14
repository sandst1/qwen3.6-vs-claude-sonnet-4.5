import { getAllWidgets, getWidget } from "../widgets";
import type { WidgetPlacement } from "../widgets";

interface Props {
  layout: WidgetPlacement[];
  onAdd: (widgetId: string) => void;
  onRemove: (widgetId: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onReset: () => void;
  onClose: () => void;
}

export function CustomizePanel({ layout, onAdd, onRemove, onMove, onReset, onClose }: Props) {
  const allWidgets = getAllWidgets();
  const placedIds = new Set(layout.map((p) => p.widgetId));
  const available = allWidgets.filter((w) => !placedIds.has(w.id));

  return (
    <div className="customize-overlay" onClick={onClose}>
      <div className="customize-panel" onClick={(e) => e.stopPropagation()}>
        <div className="customize-header">
          <h2>Customize dashboard</h2>
          <button className="customize-close" onClick={onClose}>
            ×
          </button>
        </div>

        <section className="customize-section">
          <h3>Widgets on dashboard</h3>
          <ul className="customize-list">
            {layout.map((placement, index) => {
              const def = getWidget(placement.widgetId);
              if (!def) return null;
              return (
                <li key={placement.widgetId} className="customize-item">
                  <span className="customize-item-name">{def.name}</span>
                  <div className="customize-item-actions">
                    <button
                      className="customize-btn"
                      onClick={() => onMove(index, index - 1)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className="customize-btn"
                      onClick={() => onMove(index, index + 1)}
                      disabled={index === layout.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      className="customize-btn customize-btn--danger"
                      onClick={() => onRemove(placement.widgetId)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
            {layout.length === 0 && (
              <li className="customize-empty">No widgets on dashboard</li>
            )}
          </ul>
        </section>

        {available.length > 0 && (
          <section className="customize-section">
            <h3>Add a widget</h3>
            <ul className="customize-list">
              {available.map((w) => (
                <li key={w.id} className="customize-item">
                  <span className="customize-item-name">
                    {w.name}
                    {w.description && (
                      <span className="customize-item-desc"> — {w.description}</span>
                    )}
                  </span>
                  <div className="customize-item-actions">
                    <button
                      className="customize-btn customize-btn--add"
                      onClick={() => onAdd(w.id)}
                      title="Add"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="customize-footer">
          <button className="customize-reset" onClick={onReset}>
            Reset to default
          </button>
        </div>
      </div>
    </div>
  );
}
