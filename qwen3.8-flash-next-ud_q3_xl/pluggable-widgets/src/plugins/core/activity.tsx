import { fetchActivity } from "../../api";
import { usePolling } from "../usePolling";
import type { WidgetPlugin } from "../types";

function ActivityBody() {
  const events = usePolling(fetchActivity, 45_000);
  if (events == null) return <span className="loading">Loading…</span>;
  return (
    <ul className="activity-list">
      {events.map((e) => (
        <li key={e.id} className="activity-item">
          <span>
            <strong>{e.actor}</strong> {e.action}
          </span>
          <span className="activity-when">{e.when}</span>
        </li>
      ))}
    </ul>
  );
}

const plugin: WidgetPlugin = {
  id: "core.activity",
  title: "Recent activity",
  subtitle: "all environments",
  description: "Deploys, rollbacks, incidents and merges, newest first.",
  defaultSpan: 7,
  component: ActivityBody,
};

export default plugin;
