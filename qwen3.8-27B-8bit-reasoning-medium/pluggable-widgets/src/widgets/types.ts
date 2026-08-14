import type { ComponentType } from "react";

/**
 * A pluggable dashboard widget.
 *
 * To add a new widget type:
 *   1. Create the body component in src/components/widgets/<Name>Widget.tsx
 *   2. Export a `WidgetDef` from that file (id, title, span, component, optional subtitle)
 *   3. Add the def to the list in src/widgets/registry.ts
 *
 * That's it — the dashboard picks it up for rendering, the add-widget menu,
 * drag-to-reorder, and remove.
 */
export interface WidgetDef {
  /** Stable unique id, persisted in the user's saved layout. Never change after shipping. */
  id: string;
  /** Header title. */
  title: string;
  /** Optional muted text on the right of the header. */
  subtitle?: string;
  /** Width in grid columns (out of 12). */
  span: number;
  /** Body component. Renders inside the shared card chrome. */
  component: ComponentType;
}
