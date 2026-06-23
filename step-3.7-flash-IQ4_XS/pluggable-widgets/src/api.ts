/**
 * Mock backend. Simulates a metrics/ops API with realistic-feeling latency.
 * Replace with real fetch() calls to /api/* when wiring to the real backend.
 */

function delay<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function jitter(base: number, spread: number): number {
  return base + (Math.random() - 0.5) * spread;
}

export interface SummaryStats {
  requestsPerMin: number;
  requestsDelta: number; // percent vs last period
  p99LatencyMs: number;
  latencyDelta: number;
  activeUsers: number;
  usersDelta: number;
  errorRate: number; // percent
  errorRateDelta: number;
}

export async function fetchSummaryStats(): Promise<SummaryStats> {
  return delay(420, {
    requestsPerMin: Math.round(jitter(12_400, 800)),
    requestsDelta: +(jitter(2.4, 1.5)).toFixed(1),
    p99LatencyMs: Math.round(jitter(184, 30)),
    latencyDelta: +(jitter(-3.1, 2)).toFixed(1),
    activeUsers: Math.round(jitter(847, 50)),
    usersDelta: +(jitter(1.8, 1)).toFixed(1),
    errorRate: +(jitter(0.42, 0.2)).toFixed(2),
    errorRateDelta: +(jitter(0.03, 0.05)).toFixed(2),
  });
}

export interface LatencyPoint {
  time: string; // HH:mm
  p50: number;
  p95: number;
  p99: number;
}

export async function fetchLatencySeries(): Promise<LatencyPoint[]> {
  // Last 24 points, one per 5 minutes
  const now = new Date();
  const series: LatencyPoint[] = [];
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 5 * 60_000);
    series.push({
      time: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`,
      p50: Math.round(jitter(45, 10)),
      p95: Math.round(jitter(120, 25)),
      p99: Math.round(jitter(190, 40)),
    });
  }
  return delay(580, series);
}

export interface ErrorCount {
  last5min: number;
  last1hr: number;
}

export async function fetchErrorCount(): Promise<ErrorCount> {
  return delay(330, {
    last5min: Math.round(jitter(7, 5)),
    last1hr: Math.round(jitter(94, 30)),
  });
}

export interface ActivityEvent {
  id: string;
  when: string;
  actor: string;
  action: string;
}

export async function fetchActivity(): Promise<ActivityEvent[]> {
  const actions = [
    "deployed api-gateway v2.41.0",
    "rolled back checkout-svc",
    "scaled web-frontend to 12 replicas",
    "ack'd PagerDuty incident #4821",
    "merged PR #1284 to main",
    "ran migration: add_index_on_users_email",
    "rotated DB credentials for billing-db",
  ];
  const actors = ["maria", "deploybot", "jay", "tomi", "github-actions"];
  const events: ActivityEvent[] = [];
  for (let i = 0; i < 8; i++) {
    const minsAgo = i * 7 + Math.floor(Math.random() * 3);
    events.push({
      id: `e${Date.now()}-${i}`,
      when: minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ago`,
      actor: actors[Math.floor(Math.random() * actors.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
    });
  }
  return delay(490, events);
}

export interface ServiceStatus {
  name: string;
  status: "ok" | "warn" | "down";
  uptime: string;
}

export async function fetchServiceStatuses(): Promise<ServiceStatus[]> {
  return delay(390, [
    { name: "api-gateway", status: "ok", uptime: "99.98%" },
    { name: "auth-svc", status: "ok", uptime: "99.99%" },
    { name: "checkout-svc", status: "warn", uptime: "99.71%" },
    { name: "billing-db", status: "ok", uptime: "100%" },
    { name: "search", status: "ok", uptime: "99.94%" },
    { name: "notifications", status: "down", uptime: "97.20%" },
  ]);
}

export interface ThroughputSample {
  time: string;
  inbound: number;
  outbound: number;
}

export async function fetchThroughputSeries(): Promise<ThroughputSample[]> {
  const now = new Date();
  const series: ThroughputSample[] = [];
  for (let i = 11; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 5 * 60_000);
    series.push({
      time: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`,
      inbound: Math.round(jitter(340, 60)),
      outbound: Math.round(jitter(280, 50)),
    });
  }
  return delay(350, series);
}
