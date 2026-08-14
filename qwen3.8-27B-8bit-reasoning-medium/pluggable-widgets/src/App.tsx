import { useState, type DragEvent } from "react";
import { WIDGET_TYPES } from "./widgets/registry";
import { useDashboardLayout } from "./hooks/useDashboardLayout";
import { WidgetCard } from "./components/WidgetCard";
import { AddWidgetTile } from "./components/AddWidgetTile";

export function App() {
  const { layout, addWidget, removeWidget, moveWidget, resetLayout } = useDashboardLayout();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const available = Object.keys(WIDGET_TYPES).filter((id) => !layout.includes(id));

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <span className="meta">
          <span>env: production</span>
          <button className="reset-layout" onClick={resetLayout} title="Restore default widgets and order">
            Reset layout
          </button>
        </span>
      </header>

      <div className="dashboard-grid">
        {layout.map((id) => {
          const def = WIDGET_TYPES[id];
          return (
            <WidgetCard
              key={id}
              def={def}
              isDragging={draggingId === id}
              onRemove={() => removeWidget(id)}
              onDragStart={(e: DragEvent<HTMLDivElement>) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", id);
                setDraggingId(id);
              }}
              onDragEnter={() => {
                if (draggingId && draggingId !== id) moveWidget(draggingId, id);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={() => setDraggingId(null)}
            />
          );
        })}
        {available.length > 0 && <AddWidgetTile available={available} onAdd={addWidget} />}
      </div>
    </div>
  );
}
