import type { ComponentType } from "react";

export interface WidgetDef {
  id: string;
  name: string;
  description?: string;
  component: ComponentType;
  defaultSpan: number;
}

export interface WidgetPlacement {
  widgetId: string;
  span: number;
}
