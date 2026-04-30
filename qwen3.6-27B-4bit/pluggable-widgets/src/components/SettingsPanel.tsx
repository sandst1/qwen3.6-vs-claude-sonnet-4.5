import { useState, useRef, useCallback } from "react";
import { getRegisteredWidgets, type WidgetDescriptor } from "../registry";
import { useDashboard } from "../hooks/useDashboard";

/**
 * Sidebar panel for customizing the dashboard:
 * - Toggle widget visibility
 * - Drag to reorder
 * - Reset to defaults
 */
export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { order, toggleWidget, moveWidget, reset, isVisible } = useDashboard();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragItem = useRef<string | null>(null);

  const allWidgets = getRegisteredWidgets();

  const handleDragStart = (id: string, index: number) => {
    dragItem.current = id;
    setDragIndex(index);
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setDropIndex(index);
    },
    [],
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
        moveWidget(dragIndex, dropIndex);
      }
      setDragIndex(null);
      setDropIndex(null);
      dragItem.current = null;
    },
    [dragIndex, dropIndex, moveWidget],
  );

  if (!open) return null;

  // Build list: visible widgets in order, then hidden widgets
  const visibleWidgets = order
    .map((id) => allWidgets.find((w) => w.id === id))
    .filter((w): w is WidgetDescriptor => !!w);
  const hiddenWidgets = allWidgets.filter((w) => !isVisible(w.id));

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Dashboard Settings</h2>
          <button className="settings-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="settings-body">
          <p className="settings-hint">
            Toggle widgets on/off. Drag visible widgets to reorder.
          </p>

          {visibleWidgets.length > 0 && (
            <div className="settings-section">
              <h3>Visible</h3>
              <ul className="settings-list">
                {visibleWidgets.map((widget, i) => (
                  <li
                    key={widget.id}
                    className={`settings-item ${dragIndex === i ? "dragging" : ""} ${
                      dropIndex === i ? "drop-target" : ""
                    }`}
                    draggable
                    onDragStart={() => handleDragStart(widget.id, i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={() => setDropIndex(null)}
                  >
                    <span className="settings-drag-handle" title="Drag to reorder">
                      &#9776;
                    </span>
                    <label className="settings-checkbox">
                      <input
                        type="checkbox"
                        checked
                        onChange={() => toggleWidget(widget.id)}
                      />
                      <span>{widget.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hiddenWidgets.length > 0 && (
            <div className="settings-section">
              <h3>Hidden</h3>
              <ul className="settings-list">
                {hiddenWidgets.map((widget) => (
                  <li key={widget.id} className="settings-item settings-item--hidden">
                    <label className="settings-checkbox">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggleWidget(widget.id)}
                      />
                      <span>{widget.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button className="settings-reset" onClick={reset}>
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
}
