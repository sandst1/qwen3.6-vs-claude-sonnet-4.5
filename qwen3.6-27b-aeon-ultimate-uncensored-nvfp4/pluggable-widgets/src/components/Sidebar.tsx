import { registry } from "../lib/widget-registry";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  installedIds: string[];
  onInstall: (id: string) => void;
  onRemove: (id: string) => void;
}

export function Sidebar(props: SidebarProps) {
  const all = registry.getAll();
  const installed = all.filter((w) => props.installedIds.includes(w.id));
  const available = all.filter((w) => !props.installedIds.includes(w.id));

  if (!props.open) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={props.onClose} />
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Widgets</h2>
          <button className="sidebar-close" onClick={props.onClose}>×</button>
        </div>

        <div className="sidebar-section">
          <h3>Installed</h3>
          {installed.length === 0 ? (
            <p className="sidebar-empty">No widgets installed</p>
          ) : (
            <ul className="sidebar-list">
              {installed.map((w) => (
                <li key={w.id} className="sidebar-item">
                  <span className="sidebar-item-name">{w.title}</span>
                  <button className="sidebar-btn-remove" onClick={() => props.onRemove(w.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sidebar-section">
          <h3>Available</h3>
          {available.length === 0 ? (
            <p className="sidebar-empty">All widgets installed</p>
          ) : (
            <ul className="sidebar-list">
              {available.map((w) => (
                <li key={w.id} className="sidebar-item">
                  <span className="sidebar-item-name">{w.title}</span>
                  <button className="sidebar-btn-add" onClick={() => props.onInstall(w.id)}>
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
