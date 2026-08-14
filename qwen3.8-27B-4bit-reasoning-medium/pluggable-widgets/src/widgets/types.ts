import type { ComponentType } from "react";

/**
 * A pluggable widget type. Register one of these in `registry.ts` to make a
 * new widget available in the dashboard's "add widget" palette.
 *
 * The component renders a full widget card (see existing widgets in
 * `src/components/widgets/`) and fetches its own data.
 */
export interface WidgetDefinition {
  /** Unique stable id, used in persisted layouts. */
  id: string;
  /** Display name, shown in the add-widget palette. */
  title: string;
  /** Grid columns this widget occupies (1-12). */
  span: number;
  component: ComponentType;
}
