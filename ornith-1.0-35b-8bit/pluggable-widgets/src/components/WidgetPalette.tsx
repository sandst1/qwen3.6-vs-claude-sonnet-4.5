import { useRef, useEffect } from "react";
import { widgetRegistry } from "./widgets/registry";
import type { DashboardLayoutActions } from "./Dashboard";

interface WidgetPaletteProps {
  open: boolean;
  onClose: () => void;
  activeIds: string[];
  actions: DashboardLayoutActions;
}

export function WidgetPalette({ open, onClose, activeIds, actions }: WidgetPaletteProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="palette" ref={ref}>
      <div className="palette-header">
        <span className="palette-title">Configure widgets</span>
        <button className="palette-reset" onClick={actions.resetLayout} title="Restore default layout">
          Reset
        </button>
      </div>
      <ul className="palette-list">
        {widgetRegistry.map((w) => {
          const active = activeIds.includes(w.id);
          return (
            <li key={w.id} className={`palette-item${active ? " palette-item--active" : ""}`}>
              <label className="palette-item-label">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => {
                    if (e.target.checked) {
                      actions.addWidget(w.id);
                    } else {
                      actions.removeWidget(w.id);
                    }
                  }}
                />
                <span className="palette-item-name">{w.label}</span>
                <span className="palette-item-width">{w.width} cols</span>
              </label>
              {active && (
                <div className="palette-item-actions">
                  <button
                    className="palette-move"
                    onClick={() => actions.moveUp(w.id)}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    className="palette-move"
                    onClick={() => actions.moveDown(w.id)}
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
