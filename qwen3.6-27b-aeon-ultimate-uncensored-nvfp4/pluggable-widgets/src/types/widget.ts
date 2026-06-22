import { ComponentType } from "react";

export interface WidgetDefinition {
  id: string;
  label: string;
  gridColumn: number;
  component: ComponentType;
}
