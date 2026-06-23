import { type ComponentType } from "react";

export interface WidgetDefinition {
  id: string;
  title: string;
  subtitle?: string;
  gridSpan: number;
  pollInterval: number;
  component: ComponentType;
}

export type WidgetId = string;
