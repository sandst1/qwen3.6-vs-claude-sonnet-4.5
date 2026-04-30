import { fetchActivity, type ActivityEvent } from "../../api";
import { registerWidget } from "../../registry";

function ActivityContent(data: ActivityEvent[] | null) {
  if (!data) return null;
  return (
    <ul className="activity-list">
      {data.map((e) => (
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

registerWidget({
  id: "activity",
  title: "Recent activity",
  subtitle: "all environments",
  size: 7,
  interval: 45_000,
  fetch: fetchActivity,
  component: ActivityContent,
});
