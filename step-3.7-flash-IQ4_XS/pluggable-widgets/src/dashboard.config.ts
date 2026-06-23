export interface DashboardConfig {
  widgetIds: string[];
}

export const defaultConfig: DashboardConfig = {
  widgetIds: ["stats", "latency", "errors", "activity", "services"],
};
