import { useState } from "react";
import { useDashboardConfig } from "./hooks/useDashboardConfig";
import { widgetRegistry } from "./widgetRegistry";
import { WidgetWrapper } from "./components/WidgetWrapper";
import { CustomizePanel } from "./components/CustomizePanel";

export function App() {
  const {
    widgets,
    isLoading,
    addWidget,
    removeWidget,
    reorderWidgets,
    resetToDefault,
  } = useDashboardConfig();

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [draggedInstanceId, setDraggedInstanceId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, instanceId: string) => {
    setDraggedInstanceId(instanceId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetInstanceId: string) => {
    e.preventDefault();
    if (!draggedInstanceId || draggedInstanceId === targetInstanceId) {
      return;
    }

    const draggedIndex = widgets.findIndex((w) => w.instanceId === draggedInstanceId);
    const targetIndex = widgets.findIndex((w) => w.instanceId === targetInstanceId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);

    reorderWidgets(newWidgets);
    setDraggedInstanceId(null);
  };

  const activeWidgetIds = new Set(widgets.map((w) => w.widgetId));

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <span className="meta">env: production</span>
        <div className="header-actions">
          <button
            className={`customize-toggle ${isCustomizing ? "active" : ""}`}
            onClick={() => setIsCustomizing(!isCustomizing)}
          >
            {isCustomizing ? "Done" : "Customize"}
          </button>
          {isCustomizing && (
            <button
              className="add-widget-btn-header"
              onClick={() => setShowCustomizePanel(true)}
            >
              + Add Widget
            </button>
          )}
        </div>
      </header>

      <div className={`dashboard-grid ${isCustomizing ? "customizing-mode" : ""}`}>
        {widgets.map((instance) => {
          const definition = widgetRegistry[instance.widgetId];
          if (!definition) {
            console.warn(`Widget ${instance.widgetId} not found in registry`);
            return null;
          }

          const span = instance.span ?? definition.defaultSpan;

          return (
            <WidgetWrapper
              key={instance.instanceId}
              instanceId={instance.instanceId}
              component={definition.component}
              span={span}
              onRemove={removeWidget}
              isCustomizing={isCustomizing}
              isDraggable={true}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          );
        })}
      </div>

      {showCustomizePanel && (
        <CustomizePanel
          activeWidgetIds={activeWidgetIds}
          onAddWidget={(widgetId) => {
            addWidget(widgetId);
            setShowCustomizePanel(false);
          }}
          onReset={() => {
            resetToDefault();
            setShowCustomizePanel(false);
          }}
          onClose={() => setShowCustomizePanel(false)}
        />
      )}
    </div>
  );
}
