import { useState } from "react";
import { WIDGET_TYPES } from "../widgets/registry";

interface AddWidgetTileProps {
  /** Widget type ids not currently on the dashboard. */
  available: string[];
  onAdd: (id: string) => void;
}

/** Dashed tile at the end of the grid for adding widgets that were removed. */
export function AddWidgetTile({ available, onAdd }: AddWidgetTileProps) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="add-tile"
      tabIndex={0}
      onClick={() => setOpen((o) => !o)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => e.key === "Enter" && setOpen((o) => !o)}
    >
      <div className="add-tile-label">
        <span className="add-tile-plus" aria-hidden>
          +
        </span>
        Add widget
      </div>
      {open && (
        <div className="add-tile-menu" role="menu">
          {available.length === 0 && <div className="add-tile-empty">All widgets added</div>}
          {available.map((id) => (
            <button
              key={id}
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(id);
                setOpen(false);
              }}
            >
              {WIDGET_TYPES[id].title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
