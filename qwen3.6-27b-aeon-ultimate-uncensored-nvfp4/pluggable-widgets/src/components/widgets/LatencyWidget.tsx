import { useEffect, useState } from "react";
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
import { registry } from "../../lib/widget-registry";
import type { WidgetType } from "../../lib/widget-schema";

const SERIES_TO_PLOT = ["p95", "p99"] as const;

export function LatencyWidget() {
  const [data, setData] = useState<LatencyPoint[] | null>(null);

  useEffect(() => {
    fetchLatencySeries().then(setData);
    const id = setInterval(() => fetchLatencySeries().then(setData), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="widget widget--latency">
      <div className="widget-header">
        <span className="widget-title">Request latency</span>
        <span className="widget-subtitle">last 2h, ms</span>
      </div>
      <div className="widget-body">
        {data == null ? (
          <span className="loading">Loading…</span>
        ) : (
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
        )}
      </div>
    </div>
  );
}

const latencyConfig: WidgetType = {
  id: "latency",
  title: "Request Latency",
  subtitle: "last 2h",
  size: "large",
  Component: LatencyWidget,
};

registry.register(latencyConfig);
