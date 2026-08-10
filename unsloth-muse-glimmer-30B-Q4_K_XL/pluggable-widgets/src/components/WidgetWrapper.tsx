import { useRef } from "react";
import type { WidgetMetadata } from "./widgets/registry";

type Props = {
  instanceId: string;
  meta: WidgetMetadata;
  width: number;
  editMode: boolean;
  onRemove: () => void;
  onMove: (toIndex: number) => void;
  index: number;
  total: number;
  children: React.ReactNode;
};

export function WidgetWrapper({
  instanceId,
  meta,
  width,
  editMode,
  onRemove,
  onMove,
  index,
  total,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", instanceId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId !== instanceId) {
      // drag source will handle move
    }
  };

  const gridCol = Math.max(1, Math.min(12, width));

  return (
    <div
      ref={ref}
      className="widget-wrapper"
      draggable={editMode}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ gridColumn: `span ${gridCol}` }}
    >
      <div className="widget">
        {editMode && (
          <div className="widget-edit-bar">
            <span className="widget-edit-title">{meta.title}</span>
            <div className="widget-edit-actions">
              <button
                className="icon-btn"
                title="Move up"
                disabled={index === 0}
                onClick={() => onMove(index - 1)}
              >
                ↑
              </button>
              <button
                className="icon-btn"
                title="Move down"
                disabled={index === total - 1}
                onClick={() => onMove(index + 1)}
              >
                ↓
              </button>
              <button className="icon-btn" title="Remove" onClick={onRemove}>
                ✕
              </button>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
