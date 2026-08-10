import { useEffect, useState } from "react";
import { WIDGETS } from "./widgets/registry";
import {
  loadConfig,
  saveConfig,
  addWidget,
  removeWidget,
  moveWidget,
  resetConfig,
  type DashboardConfig,
} from "./dashboard/config";

export function App() {
  const [config, setConfig] = useState<DashboardConfig>(() => loadConfig());
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const handleAdd = (typeId: string) => {
    setConfig((c) => addWidget(c, typeId));
  };

  const handleRemove = (instanceId: string) => {
    setConfig((c) => removeWidget(c, instanceId));
  };

  const handleMove = (instanceId: string, dir: "up" | "down") => {
    setConfig((c) => moveWidget(c, instanceId, dir));
  };

  const handleReset = () => {
    setConfig(resetConfig());
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <div className="header-actions">
          <span className="meta">env: production</span>
          {editMode ? (
            <>
              <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
              <button className="btn btn-primary" onClick={() => setEditMode(false)}>Done</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setEditMode(true)}>Customize</button>
          )}
        </div>
      </header>

      {editMode && (
        <div className="toolbar">
          <span>Add widget:</span>
          <div className="add-widgets">
            {Object.values(WIDGETS).map((def) => {
              const used = config.widgets.some((w) => w.typeId === def.id);
              return (
                <button
                  key={def.id}
                  className="btn btn-secondary"
                  disabled={used}
                  onClick={() => handleAdd(def.id)}
                >
                  {def.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {config.widgets.map((inst) => {
          const def = WIDGETS[inst.typeId];
          if (!def) return null;
          const Component = def.component;
          return (
            <div
              key={inst.instanceId}
              className="widget-wrapper"
              style={{ gridColumn: `span ${def.defaultCols}` }}
            >
              {editMode && (
                <div className="widget-controls">
                  <button className="btn-icon" title="Move up" onClick={() => handleMove(inst.instanceId, "up")}>↑</button>
                  <button className="btn-icon" title="Move down" onClick={() => handleMove(inst.instanceId, "down")}>↓</button>
                  <button className="btn-icon danger" title="Remove" onClick={() => handleRemove(inst.instanceId)}>✕</button>
                </div>
              )}
              <Component />
            </div>
          );
        })}
      </div>
    </div>
  );
}
