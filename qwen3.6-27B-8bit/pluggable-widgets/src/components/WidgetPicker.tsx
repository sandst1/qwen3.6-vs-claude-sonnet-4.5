import { useState } from "react";
import type { WidgetInstance } from "../lib";
import { getAllWidgetTypes } from "../lib";

interface WidgetPickerProps {
  currentWidgets: WidgetInstance[];
  onAdd: (typeId: string) => void;
}

export function WidgetPicker({ currentWidgets, onAdd }: WidgetPickerProps) {
  const [open, setOpen] = useState(false);
  const allTypes = getAllWidgetTypes();

  // Determine which widget types are NOT currently on the dashboard
  const currentTypeIds = new Set(currentWidgets.map((w) => w.typeId));
  const available = allTypes.filter((t) => !currentTypeIds.has(t.id));

  if (available.length === 0) {
    return null;
  }

  return (
    <div className="widget-picker">
      <button
        className="widget-picker__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        + Add widget
      </button>

      {open && (
        <div className="widget-picker__dropdown" role="listbox">
          {available.map((type) => (
            <button
              key={type.id}
              className="widget-picker__option"
              role="option"
              onClick={() => {
                onAdd(type.id);
                setOpen(false);
              }}
            >
              <span className="widget-picker__option-title">{type.title}</span>
              <span className="widget-picker__option-meta">
                {type.gridColumnSpan} col{type.gridColumnSpan !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
