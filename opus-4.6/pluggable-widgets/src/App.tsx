import "./widgets"; // side-effect: registers all widgets
import { DashboardProvider } from "./widgets/DashboardContext";
import { Dashboard } from "./widgets/Dashboard";

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <span className="meta">env: production</span>
      </header>

      <DashboardProvider>
        <Dashboard />
      </DashboardProvider>
    </div>
  );
}
