import { useState } from "react";
import { useDashboardLayout } from "./widgets";
import { DashboardGrid } from "./components/DashboardGrid";
import { CustomizePanel } from "./components/CustomizePanel";

import "./widgets";

export function App() {
  const { layout, addWidget, removeWidget, moveWidget, resetLayout } = useDashboardLayout();
  const [showCustomize, setShowCustomize] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <div className="app-header-actions">
          <span className="meta">env: production</span>
          <button
            className="customize-toggle"
            onClick={() => setShowCustomize(true)}
          >
            Customize
          </button>
        </div>
      </header>

      <DashboardGrid layout={layout} />

      {showCustomize && (
        <CustomizePanel
          layout={layout}
          onAdd={addWidget}
          onRemove={removeWidget}
          onMove={moveWidget}
          onReset={resetLayout}
          onClose={() => setShowCustomize(false)}
        />
      )}
    </div>
  );
}
