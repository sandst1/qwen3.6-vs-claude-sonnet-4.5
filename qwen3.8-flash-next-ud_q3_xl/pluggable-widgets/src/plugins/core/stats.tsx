import { fetchSummaryStats } from "../../api";
import { usePolling } from "../usePolling";
import type { WidgetPlugin } from "../types";

function StatsBody() {
  const data = usePolling(fetchSummaryStats, 30_000);
  if (data == null) return <span className="loading">Loading…</span>;
  return (
    <div className="stat-grid">
      <Stat label="req/min" value={data.requestsPerMin.toLocaleString()} delta={data.requestsDelta} />
      <Stat label="p99 ms" value={String(data.p99LatencyMs)} delta={data.latencyDelta} invertColor />
      <Stat label="users" value={data.activeUsers.toLocaleString()} delta={data.usersDelta} />
      <Stat label="err %" value={data.errorRate.toFixed(2)} delta={data.errorRateDelta} invertColor />
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

const plugin: WidgetPlugin = {
  id: "core.stats",
  title: "Summary",
  subtitle: "last 5 min",
  description: "Headline numbers: requests, p99 latency, active users, error rate.",
  defaultSpan: 3,
  component: StatsBody,
};

export default plugin;
