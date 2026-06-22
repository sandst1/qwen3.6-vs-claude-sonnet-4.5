import { useState } from "react";
import { DashboardProvider, useDashboard } from "./DashboardContext";
import { WidgetFrame } from "./components/WidgetFrame";
import "./widgets";

function DashboardInner() {
  const { activeWidgets, addWidget, availableWidgets } = useDashboard();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="meta">env: production</span>
          <div style={{ position: "relative" }}>
            <button
              className="add-btn"
              onClick={() => setPickerOpen((p) => !p)}
              disabled={availableWidgets.length === 0}
            >
              + Add Widget
            </button>
            {pickerOpen && (
              <div className="widget-picker">
                {availableWidgets.map((def) => (
                  <button
                    key={def.id}
                    className="picker-item"
                    onClick={() => {
                      addWidget(def.id);
                      setPickerOpen(false);
                    }}
                  >
                    {def.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </span>
      </header>

      <div className="dashboard-grid">
        {activeWidgets.map((def, i) => {
          const Cmp = def.component;
          return (
            <div
              key={def.id}
              className="widget-wrapper"
              style={{ gridColumn: `span ${def.defaultCols}` }}
            >
              <WidgetFrame
                index={i}
                total={activeWidgets.length}
                title={def.title}
                subtitle={def.subtitle}
              >
                <Cmp />
              </WidgetFrame>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function App() {
  return (
    <DashboardProvider>
      <DashboardInner />
    </DashboardProvider>
  );
}
