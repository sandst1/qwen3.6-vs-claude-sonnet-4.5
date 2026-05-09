import type { DashboardLayout } from "./widget-types";

const STORAGE_KEY = "ops-dashboard-layout";

/** Default layout — the original hardcoded order */
const DEFAULT_LAYOUT: DashboardLayout = {
  widgets: [
    { uid: "default-stats",    typeId: "stats" },
    { uid: "default-latency",  typeId: "latency" },
    { uid: "default-errors",   typeId: "errors" },
    { uid: "default-activity", typeId: "activity" },
    { uid: "default-services", typeId: "services" },
  ],
};

let uidCounter = 0;

function generateUid(): string {
  return `widget-${Date.now()}-${++uidCounter}`;
}

/** Load layout from localStorage, falling back to defaults */
export function loadLayout(): DashboardLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardLayout;
      if (Array.isArray(parsed.widgets)) return parsed;
    }
  } catch {
    // corrupted data — fall through to defaults
  }
  return DEFAULT_LAYOUT;
}

/** Persist layout to localStorage */
export function saveLayout(layout: DashboardLayout): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

/** Add a widget instance to the layout */
export function addWidget(layout: DashboardLayout, typeId: string): DashboardLayout {
  return {
    ...layout,
    widgets: [...layout.widgets, { uid: generateUid(), typeId }],
  };
}

/** Remove a widget instance from the layout */
export function removeWidget(layout: DashboardLayout, uid: string): DashboardLayout {
  return {
    ...layout,
    widgets: layout.widgets.filter((w) => w.uid !== uid),
  };
}

/** Move a widget up or down in the layout */
export function moveWidget(layout: DashboardLayout, uid: string, direction: "up" | "down"): DashboardLayout {
  const index = layout.widgets.findIndex((w) => w.uid === uid);
  if (index === -1) return layout;
  if (direction === "up" && index === 0) return layout;
  if (direction === "down" && index === layout.widgets.length - 1) return layout;

  const newWidgets = [...layout.widgets];
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  [newWidgets[index], newWidgets[swapIndex]] = [newWidgets[swapIndex], newWidgets[index]];
  return { ...layout, widgets: newWidgets };
}
