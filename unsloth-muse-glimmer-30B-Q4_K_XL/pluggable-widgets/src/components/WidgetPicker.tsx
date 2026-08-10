import type { WidgetMetadata } from "./widgets/registry";

type Props = {
  available: WidgetMetadata[];
  onAdd: (widgetId: string) => void;
};

export function WidgetPicker({ available, onAdd }: Props) {
  return (
    <div className="widget-picker">
      <span className="picker-label">Add widget:</span>
      <div className="picker-list">
        {available.map((w) => (
          <button
            key={w.id}
            className="btn"
            onClick={() => onAdd(w.id)}
          >
            {w.title}
          </button>
        ))}
      </div>
    </div>
  );
}
