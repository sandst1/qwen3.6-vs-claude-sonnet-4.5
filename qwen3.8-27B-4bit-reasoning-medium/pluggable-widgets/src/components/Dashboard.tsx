import { useState } from "react";
import { allWidgets, getWidget } from "../widgets/registry";
import { useLayout } from "../widgets/useLayout";

export function Dashboard() {
  const { instances, add, remove, moveBefore, reset } = useLayout();
  const [customizing, setCustomizing] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);

  const available = allWidgets().filter(
    (w) => !instances.some((i) => i.widgetId === w.id)
  );

  return (
    <>
      {customizing ? (
        <div className="customize-bar">
          <span className="customize-hint">Drag widgets to reorder</span>
          <span className="customize-label">Add:</span>
          {available.length > 0 ? (
            available.map((w) => (
              <button
                key={w.id}
                className="palette-btn"
                onClick={() => add(w.id)}
              >
                + {w.title}
              </button>
            ))
          ) : (
            <span className="loading">All widgets added</span>
          )}
          <span className="spacer" />
          <button className="palette-btn" onClick={reset}>
            Reset layout
          </button>
          <button className="palette-btn palette-btn--primary" onClick={() => setCustomizing(false)}>
            Done
          </button>
        </div>
      ) : (
        <div className="customize-bar">
          <span className="customize-hint">Layout is saved on this device.</span>
          <span className="spacer" />
          <button className="palette-btn" onClick={() => setCustomizing(true)}>
            Customize layout
          </button>
        </div>
      )}

      <div className="dashboard-grid">
        {instances.map((inst) => {
          const def = getWidget(inst.widgetId);
          if (!def) return null;
          const Widget = def.component;
          return (
            <div
              key={inst.key}
              className={`widget-slot${dragKey === inst.key ? " is-dragging" : ""}`}
              style={{ gridColumn: `span ${def.span}` }}
              draggable={customizing}
              onDragStart={(e) => {
                // Only start a drag from the handle, not from widget content.
                if (!(e.target instanceof Element) || !e.target.closest(".drag-handle")) {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.effectAllowed = "move";
                setDragKey(inst.key);
              }}
              onDragOver={(e) => {
                if (!dragKey || dragKey === inst.key) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                moveBefore(dragKey, inst.key);
              }}
              onDrop={(e) => e.preventDefault()}
              onDragEnd={() => setDragKey(null)}
            >
              {customizing && (
                <div className="widget-tools">
                  <span className="drag-handle" title="Drag to reorder">
                    ⠿
                  </span>
                  <button
                    className="remove-btn"
                    title={`Remove ${def.title}`}
                    onClick={() => remove(inst.key)}
                  >
                    ×
                  </button>
                </div>
              )}
              <Widget />
            </div>
          );
        })}
        {instances.length === 0 && (
          <div className="empty-state">
            No widgets. Use “Customize layout” to add some.
          </div>
        )}
      </div>
    </>
  );
}
