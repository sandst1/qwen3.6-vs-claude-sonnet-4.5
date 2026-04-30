import { useState, useCallback, useMemo } from "react";
import { WidgetRegistry } from "./widgets/types";
import { BUILTIN_WIDGETS, registerAll } from "./widgets/registry";
import { WidgetRenderer } from "./widgets/WidgetRenderer";
import { loadLayout, saveLayout, mergeWithDefaults, type LayoutState } from "./widgets/storage";
import { WidgetPicker } from "./components/widgets/WidgetPicker";
import { WidgetList } from "./components/widgets/WidgetList";

const registry = new WidgetRegistry();
registerAll(registry);



export function App() {
  const [layout, setLayout] = useState<LayoutState>(() => {
    const stored = loadLayout();
    const available = BUILTIN_WIDGETS.map((w) => w.key);
    return mergeWithDefaults(stored, available);
  });

  const enabledWidgets = useMemo(() => {
    return BUILTIN_WIDGETS.filter((w) => !layout.hidden.includes(w.key));
  }, [layout.hidden]);

  const handleToggle = useCallback((key: string) => {
    setLayout((prev) => {
      const hidden = [...prev.hidden];
      const idx = hidden.indexOf(key);
      if (idx >= 0) {
        hidden.splice(idx, 1);
      } else {
        hidden.push(key);
      }
      const next = { ...prev, hidden };
      saveLayout(next);
      return next;
    });
  }, []);

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    setLayout((prev) => {
      const order = [...prev.order];
      const [removed] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, removed);
      const next = { ...prev, order };
      saveLayout(next);
      return next;
    });
  }, []);

  const handleRemove = useCallback((key: string) => {
    setLayout((prev) => {
      const hidden = [...prev.hidden, key];
      const order = prev.order.filter((k) => k !== key);
      const next = { order, hidden };
      saveLayout(next);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    const reset: LayoutState = {
      order: BUILTIN_WIDGETS.map((w) => w.key),
      hidden: [],
    };
    saveLayout(reset);
    setLayout(reset);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Ops Dashboard</h1>
          <span className="meta">env: production</span>
        </div>
        <WidgetPicker
          registry={registry}
          hidden={layout.hidden}
          onToggle={handleToggle}
        />
      </header>

      <div className="dashboard-grid">
        {layout.order
          .filter((key) => !layout.hidden.includes(key))
          .map((key) => {
            const def = registry.get(key);
            if (def == null) return null;
            return (
              <div key={key} style={{ gridColumn: `span ${def.span}` }}>
                <WidgetRenderer registry={registry} widgetKey={key} />
              </div>
            );
          })}
      </div>

      <aside className="settings-panel">
        <div className="settings-header">
          <h2>Layout</h2>
          <button className="settings-reset" onClick={handleReset}>
            Reset
          </button>
        </div>
        <WidgetList
          widgets={enabledWidgets}
          order={layout.order}
          onReorder={handleReorder}
          onRemove={handleRemove}
        />
      </aside>
    </div>
  );
}
