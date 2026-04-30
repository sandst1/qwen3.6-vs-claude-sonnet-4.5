import { StatsWidget } from "./components/widgets/StatsWidget";
import { LatencyWidget } from "./components/widgets/LatencyWidget";
import { ErrorsWidget } from "./components/widgets/ErrorsWidget";
import { ActivityWidget } from "./components/widgets/ActivityWidget";
import { ServicesWidget } from "./components/widgets/ServicesWidget";

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <span className="meta">env: production</span>
      </header>

      <div className="dashboard-grid">
        <StatsWidget />
        <LatencyWidget />
        <ErrorsWidget />
        <ActivityWidget />
        <ServicesWidget />
      </div>
    </div>
  );
}
