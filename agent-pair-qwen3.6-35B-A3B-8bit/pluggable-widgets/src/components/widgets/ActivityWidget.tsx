import { fetchActivity } from "../../api";
import { registerWidget } from "../../widgets/widgetRegistry";

function renderActivity(data: Awaited<ReturnType<typeof fetchActivity>>) {
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
  key: "activity",
  title: "Recent activity",
  subtitle: "all environments",
  columnSpan: 7,
  pollIntervalMs: 45_000,
  fetchData: () => fetchActivity(),
  render: renderActivity,
});