import { useEffect, useState } from "react";
import { fetchSummaryStats, type SummaryStats } from "../../api";
import { registerWidget } from "../../lib";

export function StatsWidget() {
  const [data, setData] = useState<SummaryStats | null>(null);

  useEffect(() => {
    fetchSummaryStats().then(setData);
    const id = setInterval(() => fetchSummaryStats().then(setData), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="widget-body">
      {data == null ? (
        <span className="loading">Loading…</span>
      ) : (
        <div className="stat-grid">
          <Stat label="req/min" value={data.requestsPerMin.toLocaleString()} delta={data.requestsDelta} />
          <Stat label="p99 ms" value={String(data.p99LatencyMs)} delta={data.latencyDelta} invertColor />
          <Stat label="users" value={data.activeUsers.toLocaleString()} delta={data.usersDelta} />
          <Stat label="err %" value={data.errorRate.toFixed(2)} delta={data.errorRateDelta} invertColor />
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  invertColor = false,
}: {
  label: string;
  value: string;
  delta: number;
  invertColor?: boolean;
}) {
  const positive = delta > 0;
  const isGood = invertColor ? !positive : positive;
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className={`stat-delta ${isGood ? "up" : "down"}`}>
        {positive ? "+" : ""}
        {delta}%
      </span>
    </div>
  );
}

registerWidget({
  id: "stats",
  title: "Summary",
  subtitle: "last 5 min",
  component: StatsWidget,
  gridColumnSpan: 3,
});
