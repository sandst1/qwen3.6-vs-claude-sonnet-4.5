import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
  ReactNode,
} from "react";
import { getAllWidgets } from "./widgetRegistry";

const STORAGE_KEY = "widget-layout-v1";

interface WidgetEntry {
  key: string;
  enabled: boolean;
}

type Action =
  | { type: "REORDER"; from: number; to: number }
  | { type: "TOGGLE"; key: string }
  | { type: "SET_ALL"; enabled: boolean };

function loadLayout(): WidgetEntry[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WidgetEntry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return null;
}

function persist(entries: WidgetEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

function reducer(state: WidgetEntry[], action: Action): WidgetEntry[] {
  switch (action.type) {
    case "REORDER": {
      const from = Math.max(0, Math.min(action.from, state.length - 1));
      const to = Math.max(0, Math.min(action.to, state.length - 1));
      if (from === to) return state;
      const next = [...state];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    }
    case "TOGGLE":
      return state.map((e) =>
        e.key === action.key ? { ...e, enabled: !e.enabled } : e,
      );
    case "SET_ALL":
      return state.map((e) => ({ ...e, enabled: action.enabled }));
    default:
      return state;
  }
}

interface WidgetContextValue {
  entries: WidgetEntry[];
  enabledKeys: string[];
  hiddenKeys: string[];
  reorder: (from: number, to: number) => void;
  toggle: (key: string) => void;
  setAll: (enabled: boolean) => void;
  canMoveUp: (index: number) => boolean;
  canMoveDown: (index: number) => boolean;
}

const WidgetContext = createContext<WidgetContextValue | null>(null);

export function WidgetProvider({ children }: { children: ReactNode }) {
  const plugins = useMemo(() => getAllWidgets(), []);

  const stored = loadLayout();
  const validStored = stored ?? [];

  const initialEntries = useMemo(() => {
    const known = new Set(plugins.map((p) => p.key));
    const seen = new Set<string>();
    const kept: WidgetEntry[] = [];
    for (const e of validStored) {
      if (seen.has(e.key)) continue;
      if (!known.has(e.key)) continue;
      seen.add(e.key);
      kept.push(e);
    }
    for (const p of plugins) {
      if (!seen.has(p.key)) {
        kept.push({ key: p.key, enabled: true });
      }
    }
    return kept.length > 0 ? kept : plugins.map((p) => ({ key: p.key, enabled: true }));
  }, [plugins, validStored]);

  const [entries, dispatch] = useReducer(reducer, initialEntries);

  useEffect(() => {
    persist(entries);
  }, [entries]);

  const enabledKeys = useMemo(
    () => entries.filter((e) => e.enabled).map((e) => e.key),
    [entries],
  );

  const hiddenKeys = useMemo(
    () => entries.filter((e) => !e.enabled).map((e) => e.key),
    [entries],
  );

  const val = useMemo<WidgetContextValue>(
    () => ({
      entries,
      enabledKeys,
      hiddenKeys,
      reorder: (from, to) => dispatch({ type: "REORDER", from, to }),
      toggle: (key) => dispatch({ type: "TOGGLE", key }),
      setAll: (enabled) => dispatch({ type: "SET_ALL", enabled }),
      canMoveUp: (i) => i > 0,
      canMoveDown: (i) => i < entries.length - 1,
    }),
    [entries, enabledKeys, hiddenKeys],
  );

  return (
    <WidgetContext.Provider value={val}>
      {children}
    </WidgetContext.Provider>
  );
}

export function useWidgets(): WidgetContextValue {
  const ctx = useContext(WidgetContext);
  if (!ctx) {
    throw new Error("useWidgets must be used within a WidgetProvider");
  }
  return ctx;
}