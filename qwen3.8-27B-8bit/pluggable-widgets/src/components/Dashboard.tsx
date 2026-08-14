import { useState, type DragEvent } from "react";
import { WIDGETS, WIDGET_BY_ID, type WidgetId } from "../widgets/registry";
import { useLayout } from "../widgets/useLayout";
import { WidgetShell } from "./WidgetShell";

export function Dashboard() {
  const { layout, addWidget, removeWidget, moveWidget, resetLayout } = useLayout();
  const [draggingId, setDraggingId] = useState<WidgetId | null>(null);
  const [dragOverId, setDragOverId] = useState<WidgetId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const available = WIDGETS.filter((w) => !layout.includes(w.id));

  function handleDrop(targetId: WidgetId) {
    if (draggingId == null || draggingId === targetId) return;
    moveWidget(draggingId, layout.indexOf(targetId));
    setDraggingId(null);
    setDragOverId(null);
  }

  function handleDragOver(e: DragEvent, targetId: WidgetId) {
    e.preventDefault();
    if (draggingId != null && draggingId !== targetId) setDragOverId(targetId);
  }

  return (
    <div className="dashboard">
      <div className="dashboard-toolbar">
        <div className="add-widget">
          <button
            className="btn btn--primary"
            onClick={() => setMenuOpen((o) => !o)}
            disabled={available.length === 0}
          >
            + Add widget
          </button>
          {menuOpen && (
            <div className="add-widget-menu" onMouseLeave={() => setMenuOpen(false)}>
              {available.map((w) => (
                <button
                  key={w.id}
                  className="add-widget-item"
                  onClick={() => {
                    addWidget(w.id);
                    setMenuOpen(false);
                  }}
                >
                  {w.title}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="btn" onClick={resetLayout}>
          Reset layout
        </button>
      </div>

      <div className="dashboard-grid">
        {layout.length === 0 && (
          <div className="dashboard-empty">
            No widgets. Use “+ Add widget” to add some.
          </div>
        )}
        {layout.map((id) => {
          const def = WIDGET_BY_ID[id];
          if (!def) return null;
          return (
            <WidgetShell
              key={id}
              definition={def}
              isDragging={draggingId === id}
              isDragOver={dragOverId === id}
              onRemove={() => removeWidget(id)}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", id);
                setDraggingId(id);
              }}
              onDragOver={(e) => handleDragOver(e, id)}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(id);
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverId(null);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
