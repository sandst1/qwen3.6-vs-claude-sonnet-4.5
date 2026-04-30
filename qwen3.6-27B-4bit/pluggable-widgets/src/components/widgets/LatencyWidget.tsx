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
import { fetchLatencySeries, type LatencyPoint } from "../../api";
import { registerWidget } from "../../registry";

const SERIES_TO_PLOT = ["p95", "p99"] as const;

function LatencyContent(data: LatencyPoint[] | null) {
  if (!data) return null;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3e5ea" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#656d76" />
        <YAxis tick={{ fontSize: 10 }} stroke="#656d76" />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e3e5ea" }}
        />
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

registerWidget({
  id: "latency",
  title: "Request latency",
  subtitle: "last 2h, ms",
  size: 6,
  interval: 60_000,
  fetch: fetchLatencySeries,
  component: LatencyContent,
});
