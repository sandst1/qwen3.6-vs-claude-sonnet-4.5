import { registry } from "../plugins";

export interface WidgetCatalogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (type: string) => void;
}

/** Slide-over panel listing every registered widget type. */
export function WidgetCatalog({ open, onClose, onAdd }: WidgetCatalogProps) {
  return (
    <>
      {open && <div className="catalog-backdrop" onClick={onClose} />}
      <aside className={`catalog${open ? " catalog--open" : ""}`} aria-hidden={!open}>
        <div className="catalog-header">
          <h2 className="catalog-title">Add widget</h2>
          <button type="button" className="icon-btn" aria-label="Close catalog" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="catalog-list">
          {registry.list().map((plugin) => (
            <div key={plugin.id} className="catalog-item">
              <div className="catalog-item-info">
                <span className="catalog-item-title">{plugin.title}</span>
                <span className="catalog-item-desc">{plugin.description}</span>
                <span className="catalog-item-meta">default width: {plugin.defaultSpan}/12</span>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => onAdd(plugin.id)}
                aria-label={`Add ${plugin.title}`}
              >
                Add
              </button>
            </div>
          ))}
        </div>
        <p className="catalog-note">
          You can add the same widget more than once — each copy is independent.
        </p>
      </aside>
    </>
  );
}
