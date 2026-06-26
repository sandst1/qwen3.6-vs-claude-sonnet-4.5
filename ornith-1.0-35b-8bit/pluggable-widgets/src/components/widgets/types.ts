import type { ComponentType } from "react";

export interface WidgetDef {
  id: string;
  label: string;
  subtitle: string;
  width: number; // 1–12, grid-column span
  component: ComponentType;
}
