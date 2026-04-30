const STORAGE_KEY = "dashboard-layout";

export interface LayoutState {
  order: string[];
  hidden: string[];
}

export function loadLayout(): LayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw != null) {
      return JSON.parse(raw);
    }
  } catch {
    // corrupted storage — fall through to defaults
  }
  return { order: [], hidden: [] };
}

export function saveLayout(layout: LayoutState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // storage full — silently ignore
  }
}

export function mergeWithDefaults(
  stored: LayoutState,
  availableKeys: string[]
): LayoutState {
  const order = stored.order.filter((k) => availableKeys.includes(k));
  const hidden = stored.hidden.filter((k) => availableKeys.includes(k));

  for (const key of availableKeys) {
    if (!order.includes(key)) {
      order.push(key);
    }
    if (!hidden.includes(key) && !stored.order.includes(key)) {
      hidden.push(key);
    }
  }

  return { order, hidden };
}
