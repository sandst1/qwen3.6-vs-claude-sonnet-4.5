import { registry } from "../../plugins/registry";
import type { WidgetDescriptor } from "../../plugins/widget-types";
import { fetchSummaryStats, type SummaryStats } from "../../api";
import type { ComponentType } from "react";

function StatsBody({ data }: { data: SummaryStats }) {
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

export const statsWidgetDescriptor: WidgetDescriptor<SummaryStats> = {
  id: "stats",
  title: "Summary",
  subtitle: "last 5 min",
  gridColumnSpan: 3,
  wrapperClass: "widget--stats",
  Component: StatsBody as ComponentType<{ data: SummaryStats }>,
  fetchData: fetchSummaryStats,
  refreshIntervalMs: 30_000,
};

registry.add(statsWidgetDescriptor);
