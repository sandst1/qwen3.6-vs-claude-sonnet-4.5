import { useState } from "react";
import { getWidget, allWidgets } from "./registry";
import { useDashboard } from "./DashboardContext";

export function Dashboard() {
  const { layout, addWidget, removeWidget, moveWidget, resetLayout } =
    useDashboard();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <div className="dashboard-toolbar">
        <button className="toolbar-btn" onClick={() => setShowAdd((v) => !v)}>
          + Add widget
        </button>
        <button className="toolbar-btn" onClick={resetLayout}>
          Reset layout
        </button>
      </div>

      {showAdd && (
        <div className="add-widget-panel">
          {allWidgets().map((def) => (
            <button
              key={def.type}
              className="add-widget-option"
              onClick={() => {
                addWidget(def.type);
                setShowAdd(false);
              }}
            >
              {def.label}
            </button>
          ))}
        </div>
      )}

      <div className="dashboard-grid">
        {layout.map((type, idx) => {
          const def = getWidget(type);
          if (!def) {
            return (
              <div key={idx} className="widget" style={{ gridColumn: "span 3" }}>
                <div className="widget-header">
                  <span className="widget-title">Unknown: {type}</span>
                  <button
                    className="widget-remove"
                    onClick={() => removeWidget(idx)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          }
          const Comp = def.component;
          return (
            <div
              key={`${type}-${idx}`}
              className="widget-slot"
              style={{ gridColumn: `span ${def.colSpan}` }}
            >
              <div className="widget-controls">
                <button
                  className="widget-move"
                  disabled={idx === 0}
                  onClick={() => moveWidget(idx, idx - 1)}
                  title="Move left"
                >
                  ←
                </button>
                <button
                  className="widget-move"
                  disabled={idx === layout.length - 1}
                  onClick={() => moveWidget(idx, idx + 1)}
                  title="Move right"
                >
                  →
                </button>
                <button
                  className="widget-remove"
                  onClick={() => removeWidget(idx)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
              <Comp />
            </div>
          );
        })}
      </div>
    </>
  );
}
