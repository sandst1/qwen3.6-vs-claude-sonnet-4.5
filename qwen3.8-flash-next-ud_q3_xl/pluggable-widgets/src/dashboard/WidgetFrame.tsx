import type { DragEvent } from "react";
import type { WidgetPlugin } from "../plugins/types";
import { allowedSpans } from "../plugins/types";
import type { WidgetInstance } from "./layout";

export interface WidgetFrameProps {
  instance: WidgetInstance;
  plugin: WidgetPlugin;
  index: number;
  lastIndex: number;
  customizing: boolean;
  onRemove: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onResize: (id: string, span: number) => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
}

/**
 * Card chrome shared by every widget: header, controls (customize mode),
 * drag behavior, and the plugin body. Widgets never render their own frame.
 */
export function WidgetFrame({
  instance,
  plugin,
  index,
  lastIndex,
  customizing,
  onRemove,
  onMove,
  onResize,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: WidgetFrameProps) {
  const span = instance.span ?? plugin.defaultSpan;
  const Body = plugin.component;

  const handleDragOver = (e: DragEvent) => {
    if (customizing) e.preventDefault(); // allow drop / dragEnter chain
  };

  return (
    <div
      className={`widget${customizing ? " widget--customizing" : ""}`}
      style={{ gridColumn: `span ${span}` }}
      onDragEnter={() => customizing && onDragEnter(index)}
      onDragOver={handleDragOver}
    >
      <div className="widget-header">
        <span className="widget-title">{plugin.title}</span>
        <span className="widget-header-right">
          {plugin.subtitle && <span className="widget-subtitle">{plugin.subtitle}</span>}
          {customizing && (
            <span className="widget-controls">
              <button
                type="button"
                className="icon-btn"
                title="Move left"
                aria-label={`Move ${plugin.title} left`}
                disabled={index === 0}
                onClick={() => onMove(index, index - 1)}
              >
                ◀
              </button>
              <button
                type="button"
                className="icon-btn"
                title="Move right"
                aria-label={`Move ${plugin.title} right`}
                disabled={index === lastIndex}
                onClick={() => onMove(index, index + 1)}
              >
                ▶
              </button>
              <label className="span-control">
                <span className="span-label">width</span>
                <select
                  className="span-select"
                  aria-label={`Width of ${plugin.title}`}
                  value={span}
                  onChange={(e) => onResize(instance.id, Number(e.target.value))}
                >
                  {allowedSpans(plugin).map((s) => (
                    <option key={s} value={s}>
                      {s}/12
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                title="Remove widget"
                aria-label={`Remove ${plugin.title}`}
                onClick={() => onRemove(instance.id)}
              >
                ✕
              </button>
              <span
                className="drag-handle"
                title="Drag to reorder"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", instance.id);
                  onDragStart(index);
                }}
                onDragEnd={onDragEnd}
              >
                ⠿
              </span>
            </span>
          )}
        </span>
      </div>
      <div className="widget-body">
        <Body instanceId={instance.id} span={span} />
      </div>
    </div>
  );
}
