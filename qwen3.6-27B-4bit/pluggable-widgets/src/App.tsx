import { useState } from "react";

// Import widgets for side-effect registration. Order matters: determines default layout.
import "./components/widgets/StatsWidget";
import "./components/widgets/LatencyWidget";
import "./components/widgets/ErrorsWidget";
import "./components/widgets/ActivityWidget";
import "./components/widgets/ServicesWidget";

import { getWidget } from "./registry";
import { DashboardProvider, useDashboard } from "./hooks/useDashboard";
import { WidgetShell } from "./components/WidgetShell";
import { SettingsPanel } from "./components/SettingsPanel";

function Dashboard() {
  const { order } = useDashboard();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <div className="app-header-right">
          <span className="meta">env: production</span>
          <button
            className="settings-toggle"
            onClick={() => setSettingsOpen(true)}
            title="Customize dashboard"
          >
            &#9881;
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        {order.map((id) => {
          const desc = getWidget(id);
          if (!desc) return null;
          return <WidgetShell key={desc.id} descriptor={desc} />;
        })}
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export function App() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
}
