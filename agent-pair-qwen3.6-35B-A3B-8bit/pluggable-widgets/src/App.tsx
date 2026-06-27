import "./components/widgets/StatsWidget";
import "./components/widgets/LatencyWidget";
import "./components/widgets/ErrorsWidget";
import "./components/widgets/ActivityWidget";
import "./components/widgets/ServicesWidget";
import { WidgetProvider, useWidgets } from "./widgets/WidgetContext";
import { WidgetRenderer } from "./widgets/WidgetRenderer";

function Dashboard() {
  const {
    entries,
    hiddenKeys,
    reorder,
    setAll,
  } = useWidgets();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <span className="meta">env: production</span>
      </header>

      {hiddenKeys.length > 0 && (
        <div className="hidden-widgets">
          <span className="hidden-widgets-title">Hidden widgets</span>
          <button
            className="widget-btn"
            onClick={() => setAll(true)}
          >
            Show all
          </button>
          {entries
            .filter((e) => !e.enabled)
            .map((entry) => (
              <div key={entry.key} className="hidden-widget-item">
                <span>{entry.key}</span>
                <button
                  className="widget-btn"
                  onClick={() => setAll(true)}
                  title="Re-enable"
                >
                  ↩
                </button>
              </div>
            ))}
        </div>
      )}

      <div className="dashboard-grid">
        {entries
          .filter((e) => e.enabled)
          .map((entry, _i, _filteredArr) => {
            const fullIdx = entries.indexOf(entry);
            return (
              <WidgetRenderer
                key={entry.key}
                widgetKey={entry.key}
                onReorder={(dir) => {
                  const idx = dir === "up" ? fullIdx - 1 : fullIdx + 1;
                  if (
                    (dir === "up" && fullIdx > 0) ||
                    (dir === "down" && fullIdx < entries.length - 1)
                  ) {
                    reorder(fullIdx, Math.max(0, Math.min(idx, entries.length - 1)));
                  }
                }}
              />
            );
          })}
      </div>
    </div>
  );
}

export function App() {
  return (
    <WidgetProvider>
      <Dashboard />
    </WidgetProvider>
  );
}
