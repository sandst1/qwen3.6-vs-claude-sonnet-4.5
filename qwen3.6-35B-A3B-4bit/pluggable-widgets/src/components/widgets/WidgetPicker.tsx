import { useState } from "react";
import { WidgetDef, WidgetRegistry } from "../../widgets/types";

export function WidgetPicker({
  registry,
  hidden,
  onToggle,
}: {
  registry: WidgetRegistry;
  hidden: string[];
  onToggle: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const allWidgets: WidgetDef[] = registry.getAll();

  const available = allWidgets.filter((w) => !hidden.includes(w.key));
  const hiddenWidgets = allWidgets.filter((w) => hidden.includes(w.key));

  return (
    <div className="widget-picker">
      <button
        className="widget-picker-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="icon">⚙</span>
        <span>Widgets</span>
      </button>

      {open && (
        <div className="widget-picker-panel">
          <h3>Enabled</h3>
          {available.length === 0 && (
            <p className="empty-hint">No widgets enabled</p>
          )}
          <ul className="widget-picker-list">
            {available.map((w) => (
              <li key={w.key} className="widget-picker-item">
                <label>
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => onToggle(w.key)}
                  />
                  <span className="widget-picker-label">
                    <strong>{w.title}</strong>
                    {w.subtitle && (
                      <span className="widget-picker-subtitle">
                        {w.subtitle}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          {hiddenWidgets.length > 0 && (
            <>
              <h3>Hidden</h3>
              <ul className="widget-picker-list">
                {hiddenWidgets.map((w) => (
                  <li key={w.key} className="widget-picker-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => onToggle(w.key)}
                      />
                      <span className="widget-picker-label">
                        <strong>{w.title}</strong>
                        {w.subtitle && (
                          <span className="widget-picker-subtitle">
                            {w.subtitle}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}

          <button
            className="widget-picker-close"
            onClick={() => setOpen(false)}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
