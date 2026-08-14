import { useEffect, useState } from "react";
import { fetchActivity, type ActivityEvent } from "../../api";

export function ActivityWidget() {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);

  useEffect(() => {
    fetchActivity().then(setEvents);
    const id = setInterval(() => fetchActivity().then(setEvents), 45_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="widget">
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
