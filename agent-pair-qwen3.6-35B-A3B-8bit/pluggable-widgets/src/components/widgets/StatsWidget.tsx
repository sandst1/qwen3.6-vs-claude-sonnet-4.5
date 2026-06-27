import { fetchSummaryStats } from "../../api";
import { registerWidget } from "../../widgets/widgetRegistry";

function renderStats(data: Awaited<ReturnType<typeof fetchSummaryStats>>) {
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

registerWidget({
  key: "stats",
  title: "Summary",
  subtitle: "last 5 min",
  columnSpan: 3,
  pollIntervalMs: 30_000,
  fetchData: () => fetchSummaryStats(),
  render: renderStats,
});