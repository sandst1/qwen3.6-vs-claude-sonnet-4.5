import { useEffect, useState } from "react";
import { fetchActivity, type ActivityEvent } from "../../api";
import type { WidgetDef } from "../../widgets/types";

export function ActivityWidget() {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);

  useEffect(() => {
    fetchActivity().then(setEvents);
    const id = setInterval(() => fetchActivity().then(setEvents), 45_000);
    return () => clearInterval(id);
  }, []);

  return events == null ? (
    <span className="loading">Loading…</span>
  ) : (
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

export const activityWidget: WidgetDef = {
  id: "activity",
  title: "Recent activity",
  subtitle: "all environments",
  span: 7,
  component: ActivityWidget,
};
