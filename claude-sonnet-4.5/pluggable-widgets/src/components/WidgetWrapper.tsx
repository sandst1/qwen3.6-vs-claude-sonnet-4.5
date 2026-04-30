import { ComponentType } from "react";

interface WidgetWrapperProps {
  instanceId: string;
  component: ComponentType;
  span: number;
  onRemove: (instanceId: string) => void;
  isCustomizing: boolean;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, instanceId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, instanceId: string) => void;
}

export function WidgetWrapper({
  instanceId,
  component: Component,
  span,
  onRemove,
  isCustomizing,
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDrop,
}: WidgetWrapperProps) {
  return (
    <div
      className={`widget-container ${isCustomizing ? "customizing" : ""}`}
      style={{ gridColumn: `span ${span}` }}
      draggable={isDraggable && isCustomizing}
      onDragStart={(e) => onDragStart?.(e, instanceId)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, instanceId)}
    >
      {isCustomizing && (
        <div className="widget-controls">
          <button
            className="widget-control-btn drag-handle"
            title="Drag to reorder"
          >
            ⋮⋮
          </button>
          <button
            className="widget-control-btn remove-btn"
            onClick={() => onRemove(instanceId)}
            title="Remove widget"
          >
            ×
          </button>
        </div>
      )}
      <Component />
    </div>
  );
}
