import { useState } from "react";
import "./components/widgets";
import { widgetRegistry } from "./components/widgets/registry";
import { useLayout } from "./hooks/useLayout";
import { WidgetWrapper } from "./components/WidgetWrapper";
import { WidgetPicker } from "./components/WidgetPicker";

export function App() {
  const [editMode, setEditMode] = useState(false);
  const { items, addWidget, removeWidget, moveWidget } = useLayout();

  const availableWidgets = widgetRegistry.getAll();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <div className="header-actions">
          <span className="meta">env: production</span>
          <button
            className="btn"
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? "Done" : "Edit"}
          </button>
        </div>
      </header>

      {editMode && (
        <div className="edit-bar">
          <WidgetPicker available={availableWidgets} onAdd={addWidget} />
          <button className="btn secondary" onClick={() => setEditMode(false)}>
            Close picker
          </button>
        </div>
      )}

      <div className="dashboard-grid">
        {items.map((item, index) => {
          const meta = widgetRegistry.get(item.widgetId);
          if (!meta) return null;
          const Component = meta.component;
          return (
            <WidgetWrapper
              key={item.instanceId}
              instanceId={item.instanceId}
              meta={meta}
              width={item.width}
              editMode={editMode}
              onRemove={() => removeWidget(item.instanceId)}
              onMove={(toIndex) => moveWidget(index, toIndex)}
              index={index}
              total={items.length}
            >
              <Component />
            </WidgetWrapper>
          );
        })}
      </div>
    </div>
  );
}
