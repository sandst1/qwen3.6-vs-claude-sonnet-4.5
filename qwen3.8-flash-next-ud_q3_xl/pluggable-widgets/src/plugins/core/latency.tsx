import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { fetchLatencySeries } from "../../api";
import { usePolling } from "../usePolling";
import type { WidgetPlugin } from "../types";

// Hardcoded — we only show p95 and p99 for now. p50 is fetched but unused.
const SERIES_TO_PLOT = ["p95", "p99"] as const;

function LatencyBody() {
  const data = usePolling(fetchLatencySeries, 60_000);
  if (data == null) return <span className="loading">Loading…</span>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3e5ea" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#656d76" />
        <YAxis tick={{ fontSize: 10 }} stroke="#656d76" />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e3e5ea" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {SERIES_TO_PLOT.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={i === 0 ? "#0969da" : "#cf222e"}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

const plugin: WidgetPlugin = {
  id: "core.latency",
  title: "Request latency",
  subtitle: "last 2h, ms",
  description: "p95 / p99 latency over the last two hours.",
  defaultSpan: 6,
  component: LatencyBody,
};

export default plugin;
