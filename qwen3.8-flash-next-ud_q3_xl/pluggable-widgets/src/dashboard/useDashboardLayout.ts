import { useCallback, useEffect, useMemo, useState } from "react";
import { registry } from "../plugins";
import {
  addWidget,
  clearLayout,
  defaultLayout,
  loadLayout,
  moveWidget,
  removeWidget,
  resizeWidget,
  saveLayout,
  type DashboardLayout,
} from "./layout";

export function useDashboardLayout() {
  const validTypes = useMemo(
    () => new Set(registry.list().map((p) => p.id)),
    []
  );

  const [layout, setLayout] = useState<DashboardLayout>(() => loadLayout(validTypes));

  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  const add = useCallback((type: string) => {
    setLayout((l) => addWidget(l, type));
  }, []);

  const remove = useCallback((id: string) => {
    setLayout((l) => removeWidget(l, id));
  }, []);

  const move = useCallback((from: number, to: number) => {
    setLayout((l) => moveWidget(l, from, to));
  }, []);

  const resize = useCallback((id: string, span: number) => {
    setLayout((l) => resizeWidget(l, id, span));
  }, []);

  const reset = useCallback(() => {
    clearLayout();
    setLayout(defaultLayout(registry.list().map((p) => p.id)));
  }, []);

  return { widgets: layout.widgets, add, remove, move, resize, reset };
}
