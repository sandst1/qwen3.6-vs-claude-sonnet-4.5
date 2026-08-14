import type { DragEvent } from "react";
import type { WidgetDefinition } from "../widgets/registry";

interface WidgetShellProps {
  definition: WidgetDefinition;
  onRemove: () => void;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

export function WidgetShell({
  definition,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}: WidgetShellProps) {
  const { id, title, subtitle, span, Component } = definition;

  return (
    <div
      className={`widget widget-shell ${isDragging ? "widget--dragging" : ""} ${
        isDragOver ? "widget--drag-over" : ""
      }`}
      style={{ gridColumn: `span ${span}` }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="widget-header">
        <span className="widget-title">
          <span
            className="widget-drag-handle"
            draggable
            onDragStart={onDragStart}
            title="Drag to reorder"
          >
            ⠿
          </span>
          {title}
        </span>
        <span className="widget-header-actions">
          {subtitle ? <span className="widget-subtitle">{subtitle}</span> : null}
          <button
            className="widget-remove"
            onClick={onRemove}
            title={`Remove ${title}`}
            aria-label={`Remove ${title}`}
          >
            ×
          </button>
        </span>
      </div>
      <div className="widget-body">
        <Component key={id} />
      </div>
    </div>
  );
}
