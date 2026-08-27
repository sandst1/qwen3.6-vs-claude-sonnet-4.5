import { useState } from "react";
import { DashboardGrid } from "./dashboard/DashboardGrid";
import { WidgetCatalog } from "./dashboard/WidgetCatalog";
import { useDashboardLayout } from "./dashboard/useDashboardLayout";

export function App() {
  const layout = useDashboardLayout();
  const [customizing, setCustomizing] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <div className="app-header-right">
          <span className="meta">env: production</span>
          {customizing ? (
            <div className="app-actions">
              <button type="button" className="btn" onClick={() => setCatalogOpen(true)}>
                + Add widget
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  if (window.confirm("Reset the dashboard to the default layout?")) {
                    layout.reset();
                  }
                }}
              >
                Reset layout
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setCustomizing(false)}
              >
                Done
              </button>
            </div>
          ) : (
            <button type="button" className="btn" onClick={() => setCustomizing(true)}>
              Customize
            </button>
          )}
        </div>
      </header>

      <DashboardGrid
        layout={layout}
        customizing={customizing}
        onOpenCatalog={() => setCatalogOpen(true)}
      />

      <WidgetCatalog
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onAdd={(type) => {
          layout.add(type);
          setCatalogOpen(false);
          setCustomizing(true);
        }}
      />
    </div>
  );
}
