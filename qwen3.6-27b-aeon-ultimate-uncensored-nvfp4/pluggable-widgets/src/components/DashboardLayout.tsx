import { useState, useCallback } from "react";
import { registry } from "../lib/widget-registry";
import { WidgetCard } from "./WidgetCard";
import type { LayoutEntry } from "../lib/widget-schema";

interface DashboardLayoutProps {
  entries: LayoutEntry[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function DashboardLayout(props: DashboardLayoutProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      props.onReorder(dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };
  return (
    <div className="dashboard-grid">
      {props.entries.map((entry, index) => {
        const isDragging = dragIndex === index;
        return (
          <WidgetCard
            key={entry.id}
            id={entry.id}
            size={entry.size}
            collapsed={entry.collapsed}
            onToggle={() => props.onToggle(entry.id)}
            onRemove={() => props.onRemove(entry.id)}
            dragHandleRef={null}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            index={index}
            isDragging={isDragging}
          />
        );
      })}
    </div>
  );
}
