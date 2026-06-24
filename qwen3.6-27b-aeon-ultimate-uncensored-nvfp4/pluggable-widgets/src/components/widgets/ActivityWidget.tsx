import { useEffect, useState } from "react";
import { fetchActivity, type ActivityEvent } from "../../api";
import { registry } from "../../lib/widget-registry";
import type { WidgetType } from "../../lib/widget-schema";

export function ActivityWidget() {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);

  useEffect(() => {
    fetchActivity().then(setEvents);
    const id = setInterval(() => fetchActivity().then(setEvents), 45_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="widget widget--activity">
      <div className="widget-header">
        <span className="widget-title">Recent activity</span>
        <span className="widget-subtitle">all environments</span>
      </div>
      <div className="widget-body">
        {events == null ? (
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
        )}
      </div>
    </div>
  );
}

const activityConfig: WidgetType = {
  id: "activity",
  title: "Recent Activity",
  subtitle: "all environments",
  size: "medium",
  Component: ActivityWidget,
};

registry.register(activityConfig);
