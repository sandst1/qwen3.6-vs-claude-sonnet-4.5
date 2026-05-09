import { useState, useEffect } from "react";

// Import all widget modules so their registerWidget() calls execute.
// Adding a new widget only requires creating the file and importing it here.
import "./components/widgets/StatsWidget";
import "./components/widgets/LatencyWidget";
import "./components/widgets/ErrorsWidget";
import "./components/widgets/ActivityWidget";
import "./components/widgets/ServicesWidget";

import {
  loadLayout,
  saveLayout,
  addWidget,
  removeWidget,
  moveWidget,
  type DashboardLayout,
} from "./lib";
import { WidgetFrame } from "./components/WidgetFrame";
import { WidgetPicker } from "./components/WidgetPicker";

export function App() {
  const [layout, setLayout] = useState<DashboardLayout>(loadLayout);

  // Persist layout to localStorage whenever it changes
  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  const handleAdd = (typeId: string) => {
    setLayout((prev) => addWidget(prev, typeId));
  };

  const handleRemove = (uid: string) => {
    setLayout((prev) => removeWidget(prev, uid));
  };

  const handleMove = (uid: string, direction: "up" | "down") => {
    setLayout((prev) => moveWidget(prev, uid, direction));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <div className="app-header__actions">
          <span className="meta">env: production</span>
          <WidgetPicker currentWidgets={layout.widgets} onAdd={handleAdd} />
        </div>
      </header>

      <div className="dashboard-grid">
        {layout.widgets.map((instance, index) => (
          <WidgetFrame
            key={instance.uid}
            instance={instance}
            onRemove={handleRemove}
            onMoveUp={(uid) => handleMove(uid, "up")}
            onMoveDown={(uid) => handleMove(uid, "down")}
            isFirst={index === 0}
            isLast={index === layout.widgets.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
