import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { fetchThroughputSeries, type ThroughputSample } from "../../api";

export function ThroughputWidget() {
  const [data, setData] = useState<ThroughputSample[] | null>(null);

  useEffect(() => {
    fetchThroughputSeries().then(setData);
    const id = setInterval(() => fetchThroughputSeries().then(setData), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="widget">
      <div className="widget-header">
        <span className="widget-title">Throughput</span>
        <span className="widget-subtitle">MB/s, last hour</span>
      </div>
      <div className="widget-body">
        {data == null ? (
          <span className="loading">Loading…</span>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e5ea" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#656d76" />
              <YAxis tick={{ fontSize: 10 }} stroke="#656d76" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e3e5ea" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="inbound" fill="#0969da" radius={[2, 2, 0, 0]} />
              <Bar dataKey="outbound" fill="#1a7f37" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export const widgetDefinition = {
  id: "throughput",
  title: "Throughput",
  subtitle: "MB/s, last hour",
  gridSpan: 6,
  pollInterval: 30_000,
  component: ThroughputWidget,
} as const;
