import { WIDGETS } from "../widgets/registry";

export type WidgetInstance = {
  instanceId: string;
  typeId: string;
};

export type DashboardConfig = {
  widgets: WidgetInstance[];
};

const STORAGE_KEY = "ops-dashboard-config";
const DEFAULT_CONFIG: DashboardConfig = {
  widgets: [
    { instanceId: "stats-1", typeId: "stats" },
    { instanceId: "latency-1", typeId: "latency" },
    { instanceId: "errors-1", typeId: "errors" },
    { instanceId: "activity-1", typeId: "activity" },
    { instanceId: "services-1", typeId: "services" },
  ],
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function loadConfig(): DashboardConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as DashboardConfig;
    if (!parsed.widgets?.length) return DEFAULT_CONFIG;
    return parsed;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: DashboardConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function addWidget(config: DashboardConfig, typeId: string): DashboardConfig {
  if (!WIDGETS[typeId]) return config;
  const exists = config.widgets.some((w) => w.typeId === typeId);
  if (exists) return config;
  const newInstance: WidgetInstance = {
    instanceId: `${typeId}-${generateId()}`,
    typeId,
  };
  return { widgets: [...config.widgets, newInstance] };
}

export function removeWidget(config: DashboardConfig, instanceId: string): DashboardConfig {
  return { widgets: config.widgets.filter((w) => w.instanceId !== instanceId) };
}

export function moveWidget(config: DashboardConfig, instanceId: string, direction: "up" | "down"): DashboardConfig {
  const idx = config.widgets.findIndex((w) => w.instanceId === instanceId);
  if (idx === -1) return config;
  const newIdx = direction === "up" ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= config.widgets.length) return config;
  const widgets = [...config.widgets];
  [widgets[idx], widgets[newIdx]] = [widgets[newIdx], widgets[idx]];
  return { widgets };
}

export function resetConfig(): DashboardConfig {
  return { widgets: DEFAULT_CONFIG.widgets };
}
