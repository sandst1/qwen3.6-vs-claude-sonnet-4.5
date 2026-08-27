/**
 * The user's dashboard layout: which widget instances are shown, in which
 * order, at which width. Persisted to localStorage, validated against the
 * registry on load (unknown/removed widget types are dropped).
 */

const STORAGE_KEY = "ops-dashboard.layout.v1";
const LAYOUT_VERSION = 1;

export interface WidgetInstance {
  /** Unique per instance — the same widget type can appear multiple times. */
  id: string;
  /** Widget type id from the registry. */
  type: string;
  /** Grid span; falls back to the plugin's defaultSpan. */
  span?: number;
}

export interface DashboardLayout {
  version: number;
  widgets: WidgetInstance[];
}

let counter = 0;
function newInstanceUid(type: string): string {
  return `${type}#${Date.now().toString(36)}-${(counter++).toString(36)}`;
}

export function defaultLayout(types: string[]): DashboardLayout {
  return {
    version: LAYOUT_VERSION,
    widgets: types.map((type) => ({ id: newInstanceUid(type), type })),
  };
}

export function loadLayout(validTypes: Set<string>): DashboardLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLayout([...validTypes]);
    const parsed = JSON.parse(raw) as DashboardLayout;
    if (parsed.version !== LAYOUT_VERSION || !Array.isArray(parsed.widgets)) {
      return defaultLayout([...validTypes]);
    }
    // Drop instances whose widget type no longer exists (unregistered plugin).
    const widgets = parsed.widgets.filter((w) => typeof w?.type === "string" && validTypes.has(w.type));
    // An explicitly emptied dashboard stays empty; only a missing key defaults.
    return { version: LAYOUT_VERSION, widgets };
  } catch {
    return defaultLayout([...validTypes]);
  }
}

export function saveLayout(layout: DashboardLayout): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Storage full or unavailable — layout just won't persist.
  }
}

export function clearLayout(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ---- pure reducers ----

export function addWidget(
  layout: DashboardLayout,
  type: string
): DashboardLayout {
  return { ...layout, widgets: [...layout.widgets, { id: newInstanceUid(type), type }] };
}

export function removeWidget(layout: DashboardLayout, id: string): DashboardLayout {
  return { ...layout, widgets: layout.widgets.filter((w) => w.id !== id) };
}

/** Move the instance at `from` to index `to`. */
export function moveWidget(
  layout: DashboardLayout,
  from: number,
  to: number
): DashboardLayout {
  if (from === to || from < 0 || to < 0) return layout;
  const widgets = [...layout.widgets];
  const [moved] = widgets.splice(from, 1);
  widgets.splice(Math.min(to, widgets.length), 0, moved);
  return { ...layout, widgets };
}

export function resizeWidget(
  layout: DashboardLayout,
  id: string,
  span: number
): DashboardLayout {
  return {
    ...layout,
    widgets: layout.widgets.map((w) => (w.id === id ? { ...w, span } : w)),
  };
}
