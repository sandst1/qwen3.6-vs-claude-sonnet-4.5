import { Dashboard } from "./components/Dashboard";

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <span className="meta">env: production</span>
      </header>
      <Dashboard />
    </div>
  );
}
