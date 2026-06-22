import { defineWidget } from "./registry";
import { useEffect, useState } from "react";
import {
  fetchActivity,
  fetchErrorCount,
  fetchLatencySeries,
  fetchServiceStatuses,
  fetchSummaryStats,
  type ActivityEvent,
  type ErrorCount,
  type LatencyPoint,
  type ServiceStatus,
  type SummaryStats,
} from "./api";
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

defineWidget({
  id: "stats",
  title: "Summary",
  defaultCols: 3,
  component() {
    const [data, setData] = useState<SummaryStats | null>(null);

    useEffect(() => {
      fetchSummaryStats().then(setData);
      const id = setInterval(() => fetchSummaryStats().then(setData), 30_000);
      return () => clearInterval(id);
    }, []);

    return data == null ? (
      <span className="loading">Loading...</span>
    ) : (
      <div className="stat-grid">
        <Stat label="req/min" value={data.requestsPerMin.toLocaleString()} delta={data.requestsDelta} />
        <Stat label="p99 ms" value={String(data.p99LatencyMs)} delta={data.latencyDelta} invertColor />
        <Stat label="users" value={data.activeUsers.toLocaleString()} delta={data.usersDelta} />
        <Stat label="err %" value={data.errorRate.toFixed(2)} delta={data.errorRateDelta} invertColor />
      </div>
    );
  },
});

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

defineWidget({
  id: "latency",
  title: "Request Latency",
  defaultCols: 6,
  subtitle: "last 2h, ms",
  component() {
    const [data, setData] = useState<LatencyPoint[] | null>(null);

    useEffect(() => {
      fetchLatencySeries().then(setData);
      const id = setInterval(() => fetchLatencySeries().then(setData), 60_000);
      return () => clearInterval(id);
    }, []);

    const SERIES_TO_PLOT = ["p95", "p99"] as const;

    return data == null ? (
      <span className="loading">Loading...</span>
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
    );
  },
});

defineWidget({
  id: "errors",
  title: "Errors",
  defaultCols: 3,
  subtitle: "last 5 min",
  component() {
    const [data, setData] = useState<ErrorCount | null>(null);
    const ALERT_THRESHOLD = 10;

    useEffect(() => {
      fetchErrorCount().then(setData);
      const id = setInterval(() => fetchErrorCount().then(setData), 15_000);
      return () => clearInterval(id);
    }, []);

    return data == null ? (
      <span className="loading">Loading...</span>
    ) : (
      <>
        <div
          className="error-big"
          style={{ color: data.last5min >= ALERT_THRESHOLD ? "var(--bad)" : "var(--text)" }}
        >
          {data.last5min}
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 6 }}>
          {data.last1hr} in last hour
        </div>
      </>
    );
  },
});

defineWidget({
  id: "activity",
  title: "Recent Activity",
  defaultCols: 7,
  subtitle: "all environments",
  component() {
    const [events, setEvents] = useState<ActivityEvent[] | null>(null);

    useEffect(() => {
      fetchActivity().then(setEvents);
      const id = setInterval(() => fetchActivity().then(setEvents), 45_000);
      return () => clearInterval(id);
    }, []);

    return events == null ? (
      <span className="loading">Loading...</span>
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
    );
  },
});

defineWidget({
  id: "services",
  title: "Services",
  defaultCols: 5,
  component() {
    const [services, setServices] = useState<ServiceStatus[] | null>(null);

    useEffect(() => {
      fetchServiceStatuses().then(setServices);
      const id = setInterval(() => fetchServiceStatuses().then(setServices), 30_000);
      return () => clearInterval(id);
    }, []);

    return services == null ? (
      <span className="loading">Loading...</span>
    ) : (
      <div className="services-grid">
        {services.map((s) => (
          <div key={s.name} className="service-cell">
            <span className="service-name">{s.name}</span>
            <span className={`service-status ${s.status}`}>
              {s.status} - {s.uptime}
            </span>
          </div>
        ))}
      </div>
    );
  },
});
