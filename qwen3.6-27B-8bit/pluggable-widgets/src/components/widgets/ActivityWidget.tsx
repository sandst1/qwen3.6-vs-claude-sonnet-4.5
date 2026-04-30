import { registry } from "../../plugins/registry";
import type { WidgetDescriptor } from "../../plugins/widget-types";
import { fetchActivity, type ActivityEvent } from "../../api";
import type { ComponentType } from "react";

function ActivityBody({ data }: { data: ActivityEvent[] }) {
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

export const activityWidgetDescriptor: WidgetDescriptor<ActivityEvent[]> = {
  id: "activity",
  title: "Recent activity",
  subtitle: "all environments",
  gridColumnSpan: 7,
  wrapperClass: "widget--activity",
  Component: ActivityBody as ComponentType<{ data: ActivityEvent[] }>,
  fetchData: fetchActivity,
  refreshIntervalMs: 45_000,
};

registry.add(activityWidgetDescriptor);
