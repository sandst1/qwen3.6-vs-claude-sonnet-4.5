import { useState, type DragEvent } from "react";
import { useWidgetManager, getWidgetDefinition } from "../hooks/useWidgetManager";
import { widgetsRegistry } from "../config/widgetsRegistry";

export function Dashboard() {
  const { activeIds, add, remove, reorder } = useWidgetManager();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handleDragOver = (e: DragEvent<HTMLElement>, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetId(id);
  };

  const handleDrop = (targetId: string) => {
    if (draggingId && draggingId !== targetId) {
      const fromIdx = activeIds.indexOf(draggingId);
      const toIdx = activeIds.indexOf(targetId);
      reorder(fromIdx, toIdx);
  }
  setDropTargetId(null);
  setDraggingId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTargetId(null);
  };

  const unavailable = widgetsRegistry.filter(
    w => !activeIds.includes(w.id)
  );

  return (
    <div className="dashboard">
      <div className="dashboard-controls">
        <button
          className="add-widget-btn"
          onClick={() => setShowAddMenu(v => !v)}
        >
          {showAddMenu ? "Hide" : "+ Widget"}
        </button>
        {showAddMenu && (
          <div className="add-widget-menu">
            <h4>Add a widget</h4>
            {unavailable.length === 0 ? (
              <p className="all-added">All widgets added</p>
            ) : (
              <ul>
                {unavailable.map(w => (
                  <li key={w.id}>
                    <button onClick={() => { add(w.id); setShowAddMenu(false); }}>
                      {w.label}
                    </button>
                    <span className="hint">{w.gridColumn}-col</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        {activeIds.map((id) => {
          const def = getWidgetDefinition(id);
          if (!def) return null;
          const { component: Component } = def;
          const isDragging = draggingId === id;
          const isDropTarget = dropTargetId === id;

          return (
            <div
              key={id}
              className={`widget-container ${isDragging ? 'widget-dragging' : ''} ${isDropTarget ? 'widget-drop-target' : ''}`}
              style={{ gridColumn: `span ${def.gridColumn}` }}
              draggable
              onDragStart={() => handleDragStart(id)}
              onDragOver={(e) => handleDragOver(e, id)}
              onDrop={() => handleDrop(id)}
              onDragEnd={handleDragEnd}
            >
              <Component />
              <div className="widget-controls">
                <button onClick={() => remove(id)}>×</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
