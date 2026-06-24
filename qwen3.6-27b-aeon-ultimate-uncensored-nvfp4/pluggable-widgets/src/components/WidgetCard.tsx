import { registry } from "../lib/widget-registry";
import type { WidgetSize } from "../lib/widget-schema";

interface WidgetCardProps {
  id: string;
  size: WidgetSize;
  collapsed: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  index: number;
  isDragging: boolean;
}

export function WidgetCard(props: WidgetCardProps) {
  const { id, size, collapsed, onToggle, onRemove, index, isDragging } = props;
  const widgetType = registry.get(id);

  if (!widgetType) return null;
  const { Component } = widgetType;

  const colSpan = size === "small" ? "span 1" : size === "medium" ? "span 2" : "span 3";

  return (
    <div
      className={`widget-card ${isDragging ? "dragging" : ""}`}
      style={{ gridColumn: colSpan }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        props.onDragStart(index);
      }}
      onDragOver={props.onDragOver}
      onDragEnd={props.onDragEnd}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="widget-card-header">
        <span className="widget-card-title">{widgetType.title}</span>
        <div className="widget-card-actions">
          <button className="widget-card-btn" onClick={onToggle}>
            {collapsed ? "▼" : "▲"}
          </button>
          <button className="widget-card-btn widget-card-btn-remove" onClick={onRemove}>
            ×
          </button>
          <span className="drag-handle">⠿</span>
        </div>
      </div>
      {!collapsed && <Component />}
    </div>
  );
}
