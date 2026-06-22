import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAllWidgets, getWidget, type WidgetDefinition } from "./registry";

const STORAGE_KEY = "dashboard-layout";

interface DashboardState {
  activeIds: string[];
}

export interface DashboardActions {
  activeWidgets: WidgetDefinition[];
  addWidget: (defId: string) => void;
  removeWidget: (index: number) => void;
  moveWidget: (index: number, direction: -1 | 1) => void;
  availableWidgets: WidgetDefinition[];
}

const DashboardCtx = createContext<DashboardActions | null>(null);

function loadState(): DashboardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardState;
      if (Array.isArray(parsed.activeIds)) return parsed;
    }
  } catch {}
  return { activeIds: [] };
}

function storeState(state: DashboardState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const DEFAULT_LAYOUT = [
  "stats",
  "latency",
  "errors",
  "activity",
  "services",
];

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>(() => {
    const saved = loadState();
    return saved.activeIds.length > 0 ? saved : { activeIds: DEFAULT_LAYOUT };
  });

  useEffect(() => {
    storeState(state);
  }, [state]);

  const activeWidgets = useMemo(
    () =>
      state.activeIds
        .map((id) => getWidget(id))
        .filter((w): w is WidgetDefinition => w != null),
    [state.activeIds]
  );

  const allDefs = useMemo(() => getAllWidgets(), []);

  const availableWidgets = useMemo(
    () => allDefs.filter((d) => !state.activeIds.includes(d.id)),
    [allDefs, state.activeIds]
  );

  const addWidget = useCallback((defId: string) => {
    setState((prev) => {
      if (prev.activeIds.includes(defId)) return prev;
      return { activeIds: [...prev.activeIds, defId] };
    });
  }, []);

  const removeWidget = useCallback((index: number) => {
    setState((prev) => {
      const next = prev.activeIds.filter((_, i) => i !== index);
      return { activeIds: next };
    });
  }, []);

  const moveWidget = useCallback((index: number, direction: -1 | 1) => {
    setState((prev) => {
      const ids = [...prev.activeIds];
      const target = index + direction;
      if (target < 0 || target >= ids.length) return prev;
      [ids[index], ids[target]] = [ids[target], ids[index]];
      return { activeIds: ids };
    });
  }, []);

  return (
    <DashboardCtx.Provider value={{
      activeWidgets,
      addWidget,
      removeWidget,
      moveWidget,
      availableWidgets,
    }}>
      {children}
    </DashboardCtx.Provider>
  );
}

export function useDashboard(): DashboardActions {
  const ctx = useContext(DashboardCtx);
  if (!ctx) throw new Error("useDashboard must be inside <DashboardProvider>");
  return ctx;
}
