import { useEffect, useState, useRef } from "react";
import { getWidget, WidgetPlugin } from "./widgetRegistry";

function DefaultErrorRenderer({ error }: { error: Error }) {
  return (
    <div style={{ color: "var(--bad)", fontSize: 12 }}>
      Failed to load. {error.message}
    </div>
  );
}

export function WidgetRenderer({
  widgetKey,
  onRemove,
  onReorder,
  draggable = false,
}: {
  widgetKey: string;
  onRemove?: () => void;
  onReorder?: (direction: "up" | "down") => void;
  draggable?: boolean;
}) {
  const plugin = getWidget(widgetKey);
  if (!plugin) {
    return (
      <div className="widget">
        <div className="widget-header">
          <span className="widget-title">Unknown</span>
        </div>
        <div className="widget-body">
          <span className="loading">Unknown widget: {widgetKey}</span>
        </div>
      </div>
    );
  }

  return (
    <WidgetRendererInner
      plugin={plugin}
      onRemove={onRemove}
      onReorder={onReorder}
      draggable={draggable}
    />
  );
}

function WidgetRendererInner({
  plugin,
  onRemove,
  onReorder,
  draggable,
}: {
  plugin: WidgetPlugin;
  onRemove?: () => void;
  onReorder?: (direction: "up" | "down") => void;
  draggable: boolean;
}) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scheduleFetch = () => {
    plugin
      .fetchData()
      .then(setData)
      .catch(setError);
  };

  useEffect(() => {
    scheduleFetch();
    intervalRef.current = setInterval(scheduleFetch, plugin.pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [plugin]);

  const customClass = plugin.customClass ?? `widget--${plugin.key}`;

  return (
    <div
      className={`widget ${customClass}`}
      style={{ gridColumn: `span ${plugin.columnSpan}` }}
      data-widget={plugin.key}
    >
      <div className="widget-header">
        <span className="widget-title">{plugin.title}</span>
        <span className="widget-subtitle">{plugin.subtitle}</span>
        <span className="widget-controls">
          {draggable && (
            <span className="widget-drag-handle" title="Drag to reorder">
              ⠿
            </span>
          )}
          {onReorder && (
            <>
              <button
                className="widget-btn"
                onClick={() => onReorder("up")}
                title="Move up"
              >
                ↑
              </button>
              <button
                className="widget-btn"
                onClick={() => onReorder("down")}
                title="Move down"
              >
                ↓
              </button>
            </>
          )}
          {onRemove && (
            <button
              className="widget-btn widget-btn--danger"
              onClick={onRemove}
              title="Remove widget"
            >
              ✕
            </button>
          )}
        </span>
      </div>
      <div className="widget-body">
        {data == null ? (
          <span className="loading">Loading…</span>
        ) : error ? (
          <DefaultErrorRenderer error={error} />
        ) : (
          plugin.render(data)
        )}
      </div>
    </div>
  );
}