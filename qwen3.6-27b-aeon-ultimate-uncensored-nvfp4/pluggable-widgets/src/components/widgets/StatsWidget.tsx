import { useEffect, useState } from "react";
import { fetchSummaryStats, type SummaryStats } from "../../api";
import { registry } from "../../lib/widget-registry";
import type { WidgetType } from "../../lib/widget-schema";

export function StatsWidget() {
  const [data, setData] = useState<SummaryStats | null>(null);

  useEffect(() => {
    fetchSummaryStats().then(setData);
    const id = setInterval(() => fetchSummaryStats().then(setData), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return (
      <div className="widget widget--stats">
        <div className="widget-header">
          <span className="widget-title">Summary</span>
          <span className="widget-subtitle">last 5 min</span>
        </div>
        <div className="widget-body">
          <span className="loading">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="widget widget--stats">
      <div className="widget-header">
        <span className="widget-title">Summary</span>
        <span className="widget-subtitle">last 5 min</span>
      </div>
      <div className="widget-body">
        <div className="stat-grid">
          <div className="stat">
            <span className="stat-label">req/min</span>
            <span className="stat-value">{data.requestsPerMin.toLocaleString()}</span>
            <span className={`stat-delta ${data.requestsDelta > 0 ? "up" : "down"}`}>
              {data.requestsDelta > 0 ? "+" : ""}{data.requestsDelta}%
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">p99 ms</span>
            <span className="stat-value">{data.p99LatencyMs}</span>
            <span className={`stat-delta ${data.latencyDelta > 0 ? "down" : "up"}`}>
              {data.latencyDelta > 0 ? "+" : ""}{data.latencyDelta}%
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">users</span>
            <span className="stat-value">{data.activeUsers.toLocaleString()}</span>
            <span className={`stat-delta ${data.usersDelta > 0 ? "up" : "down"}`}>
              {data.usersDelta > 0 ? "+" : ""}{data.usersDelta}%
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">err %</span>
            <span className="stat-value">{data.errorRate.toFixed(2)}</span>
            <span className={`stat-delta ${data.errorRateDelta > 0 ? "down" : "up"}`}>
              {data.errorRateDelta > 0 ? "+" : ""}{data.errorRateDelta}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const statsConfig: WidgetType = {
  id: "stats",
  title: "Summary",
  subtitle: "last 5 min",
  size: "medium",
  Component: StatsWidget,
};

registry.register(statsConfig);
