import { useCallback, useRef, useState } from "react";
import { WidgetRenderer } from "./WidgetShell";
import { registry } from "../plugins/registry";
import type { WidgetInstance } from "../plugins/widget-types";

let nextId = Date.now();

function uid(): string {
  return `inst-${nextId++}`;
}

const DEFAULT_IDS = ["stats", "latency", "errors", "activity", "services"];

function DraggableWidget({
  instance,
  onPause,
  onResume,
  onRemove,
  onMoveStart,
  onMoveOver,
  onMoveEnd,
}: {
  instance: WidgetInstance;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRemove: (id: string) => void;
  onMoveStart: (id: string) => void;
  onMoveOver: (id: string) => void;
  onMoveEnd: () => void;
}) {
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    onMoveStart(instance.instanceId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onMoveOver(instance.instanceId);
  };

  return (
    <div
      ref={dragRef}
      className="draggable-widget"
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={onMoveEnd}
      onDragEnter={(e) => {
        e.stopPropagation();
        dragRef.current?.classList.add("drag-over");
      }}
      onDragLeave={(e) => {
        e.stopPropagation();
        dragRef.current?.classList.remove("drag-over");
      }}
      onDrop={(e) => {
        e.stopPropagation();
        dragRef.current?.classList.remove("drag-over");
      }}
      onDrag={onMoveEnd}
      onMouseDown={() => onPause(instance.instanceId)}
      onMouseUp={() => onResume(instance.instanceId)}
    >
      <div className="widget-controls">
        <button
          className="widget-remove btn-icon"
          title="Remove widget"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(instance.instanceId);
          }}
        >
          ×
        </button>
        <span className="drag-handle" title="Drag to reorder">⠿</span>
      </div>
      <WidgetRenderer typeId={instance.typeId} />
    </div>
  );
}

function AddWidgetMenu({
  existingIds,
  onAdd,
}: {
  existingIds: string[];
  onAdd: (typeId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const available = registry.getAll().filter((d) => !existingIds.includes(d.id));

  if (available.length === 0) return null;

  return (
    <div className="add-widget-menu">
      <button
        className="add-widget-btn"
        onClick={() => setOpen((o) => !o)}
      >
        + Add Widget
      </button>
      {open && (
        <div
          className="add-widget-dropdown"
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="add-widget-dropdown-inner">
            {available.map((d) => (
              <button
                key={d.id}
                className="add-widget-option"
                role="menuitem"
                onClick={() => {
                  onAdd(d.id);
                  setOpen(false);
                }}
              >
                <span className="add-widget-option-title">{d.title}</span>
                <span className="add-widget-option-meta">
                  {d.gridColumnSpan} col{d.gridColumnSpan !== 1 ? "s" : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardGrid() {
  const [instances, setInstances] = useState<WidgetInstance[]>(
    DEFAULT_IDS.map((typeId) => ({ instanceId: uid(), typeId }))
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const addWidget = (typeId: string) => {
    const id = uid();
    setInstances((prev) => [...prev, { instanceId: id, typeId }]);
  };

  const removeWidget = (instanceId: string) => {
    setInstances((prev) => prev.filter((w) => w.instanceId !== instanceId));
  };

  const reorder = useCallback(
    (targetId: string) => {
      if (!dragId) return;
      setInstances((prev) => {
        const draggedIdx = prev.findIndex((w) => w.instanceId === dragId);
        const targetIdx = prev.findIndex((w) => w.instanceId === targetId);
        if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) return prev;
        const next = [...prev];
        const [removed] = next.splice(draggedIdx, 1);
        next.splice(targetIdx, 0, removed);
        return next;
      });
    },
    [dragId]
  );

  const pause = () => {};
  const resume = () => {};

  return (
    <div className="dashboard-grid">
      {instances.map((inst) => (
        <DraggableWidget
          key={inst.instanceId}
          instance={inst}
          onPause={pause}
          onResume={resume}
          onRemove={removeWidget}
          onMoveStart={setDragId}
          onMoveOver={(id) => {
            if (id !== dragId) reorder(id);
          }}
          onMoveEnd={() => setDragId(null)}
        />
      ))}
      {instances.length === 0 && (
        <p style={{ color: "var(--text-muted)", gridColumn: "1 / -1" }}>
          No widgets on the dashboard. Add one to get started.
        </p>
      )}
      <AddWidgetMenu existingIds={instances.map((i) => i.typeId)} onAdd={addWidget} />
    </div>
  );
}
