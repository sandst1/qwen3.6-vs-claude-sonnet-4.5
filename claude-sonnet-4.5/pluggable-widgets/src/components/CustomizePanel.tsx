import { useState } from "react";
import { widgetRegistry, getWidgetsByCategory } from "../widgetRegistry";

interface CustomizePanelProps {
  activeWidgetIds: Set<string>;
  onAddWidget: (widgetId: string) => void;
  onReset: () => void;
  onClose: () => void;
}

export function CustomizePanel({
  activeWidgetIds,
  onAddWidget,
  onReset,
  onClose,
}: CustomizePanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const widgetsByCategory = getWidgetsByCategory();
  const categories = Object.keys(widgetsByCategory).sort();

  return (
    <div className="customize-overlay" onClick={onClose}>
      <div className="customize-panel" onClick={(e) => e.stopPropagation()}>
        <div className="customize-header">
          <h2>Customize Dashboard</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="customize-body">
          <div className="customize-section">
            <h3>Add Widgets</h3>
            <div className="category-tabs">
              <button
                className={selectedCategory === null ? "active" : ""}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={selectedCategory === cat ? "active" : ""}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="widget-list">
              {Object.values(widgetRegistry)
                .filter(
                  (widget) =>
                    selectedCategory === null ||
                    widget.category === selectedCategory
                )
                .map((widget) => {
                  const canAdd = !activeWidgetIds.has(widget.id) || true; // Allow multiple instances
                  return (
                    <div key={widget.id} className="widget-option">
                      <div className="widget-info">
                        <strong>{widget.name}</strong>
                        <p>{widget.description}</p>
                        <span className="widget-meta">
                          Span: {widget.defaultSpan} cols • {widget.category}
                        </span>
                      </div>
                      <button
                        className="add-widget-btn"
                        onClick={() => onAddWidget(widget.id)}
                        disabled={!canAdd && false} // Always enabled for multiple instances
                      >
                        + Add
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="customize-actions">
            <button className="reset-btn" onClick={onReset}>
              Reset to Default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
