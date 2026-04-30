import { useState, useRef, useCallback } from "react";
import { WidgetDef } from "../../widgets/types";

export function WidgetList({
  widgets,
  order,
  onReorder,
  onRemove,
}: {
  widgets: WidgetDef[];
  order: string[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (key: string) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDragStart = useCallback(
    (index: number) => {
      setDragIndex(index);
    },
    []
  );

  const handleDragOver = useCallback(
    (index: number) => {
      setOverIndex(index);
      if (dragIndex == null || dragIndex === index) return;

      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        onReorder(dragIndex, index);
        setDragIndex(index);
      }, 150);
    },
    [dragIndex, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const getOrderedList = (): WidgetDef[] => {
    const map = new Map(widgets.map((w) => [w.key, w]));
    return order
      .filter((key) => map.has(key))
      .map((key) => map.get(key)!);
  };

  const list = getOrderedList();

  if (list.length === 0) {
    return (
      <div className="widget-list-empty">
        <p>No widgets in layout</p>
      </div>
    );
  }

  return (
    <ul className="widget-list">
      {list.map((widget, index) => (
        <li
          key={widget.key}
          className={`widget-list-item${dragIndex === index ? " dragging" : ""}${overIndex === index ? " over" : ""}`}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => {
            e.preventDefault();
            handleDragOver(index);
          }}
          onDragEnd={handleDragEnd}
        >
          <div className="widget-list-handle">⠿</div>
          <div className="widget-list-info">
            <span className="widget-list-title">{widget.title}</span>
            {widget.subtitle && (
              <span className="widget-list-subtitle">{widget.subtitle}</span>
            )}
          </div>
          <div className="widget-list-actions">
            <button
              className="widget-list-btn"
              onClick={() => onRemove(widget.key)}
              title={`Remove ${widget.title}`}
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
