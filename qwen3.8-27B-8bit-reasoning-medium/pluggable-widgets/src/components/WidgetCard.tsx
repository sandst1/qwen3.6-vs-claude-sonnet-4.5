import type { DragEvent } from "react";
import type { WidgetDef } from "../widgets/types";

interface WidgetCardProps {
  def: WidgetDef;
  isDragging: boolean;
  onRemove: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnter: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}

/**
 * Shared chrome for all widgets: header (drag handle + title + subtitle +
 * remove button) and body. Widget defs only provide the body.
 */
export function WidgetCard({
  def,
  isDragging,
  onRemove,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDragEnd,
}: WidgetCardProps) {
  const Body = def.component;
  return (
    <div
      className={`widget${isDragging ? " widget--dragging" : ""}`}
      style={{ gridColumn: `span ${def.span}` }}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
    >
      <div
        className="widget-header"
        draggable
        title="Drag to reorder"
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <span className="widget-title">
          <span className="widget-grip" aria-hidden>
            ⠿
          </span>
          {def.title}
        </span>
        <span className="widget-header-right">
          {def.subtitle && <span className="widget-subtitle">{def.subtitle}</span>}
          <button
            className="widget-remove"
            title="Remove widget"
            aria-label={`Remove ${def.title} widget`}
            onClick={onRemove}
          >
            ×
          </button>
        </span>
      </div>
      <div className="widget-body">
        <Body />
      </div>
    </div>
  );
}
