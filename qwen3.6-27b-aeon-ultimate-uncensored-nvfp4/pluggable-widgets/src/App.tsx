import { useState } from "react";
import { useDashboardStore } from "./lib/dashboard-store";
import { DashboardLayout } from "./components/DashboardLayout";
import { Sidebar } from "./components/Sidebar";
import "./components/widgets";

export function App() {
  const store = useDashboardStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <span className="meta">env: production</span>
        <div className="app-header-actions">
          <button className="btn-sidebar" onClick={() => setSidebarOpen(true)}>
            Widgets
          </button>
        </div>
      </header>

      <DashboardLayout
        entries={store.layout}
        onToggle={store.toggleCollapsed}
        onRemove={store.removeWidget}
        onReorder={store.reorderWidget}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        installedIds={store.layout.map((e) => e.id)}
        onInstall={store.addWidget}
        onRemove={store.removeWidget}
      />
    </div>
  );
}
