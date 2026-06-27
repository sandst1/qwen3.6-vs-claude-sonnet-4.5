# Review: Pluggable Widgets Implementation

**Model:** Qwen 3.6 35B (agent-pair A3B)  
**Task:** Make the ops dashboard pluggable  
**Score:** 35/40

---

## Summary

This is a strong implementation that demonstrates solid architectural judgment. The model created a well-designed `WidgetPlugin` interface, a proper registry pattern, and correctly separated widget types from widget instances. The main weakness is in ambiguity handling — the model silently implemented user-facing customization without explicitly discussing the "user vs developer" interpretation of "pluggable."

---

## Architectural Judgment — 13/14

### Designs a Widget contract — 5/6

The `WidgetPlugin` interface in `widgetRegistry.ts` is well-designed:

```1:28:agent-pair-qwen3.6-35B-A3B/pluggable-widgets/src/widgets/widgetRegistry.ts
export type WidgetRendererFn<TData = unknown> = (
  data: TData,
) => React.ReactNode;

// ...

export interface WidgetPlugin<TData = unknown> {
  key: string;
  title: string;
  subtitle: string;
  columnSpan: number;
  pollIntervalMs: number;
  fetchData: () => Promise<TData>;
  render: WidgetRendererFn<TData>;
  errorRender?: ErrorRendererFn;
  customClass?: string;
}
```

Strong points:
- Generic `TData` type parameter for type-safe data flow
- Captures the essential shape: metadata (key, title, subtitle), layout (columnSpan), behavior (pollIntervalMs), and functionality (fetchData, render)
- Optional error renderer for custom error handling

Minor gaps: No settings schema or per-instance settings support, though this is reasonable given the scope.

### Picks a registration pattern — 4/4

Single registry file with a clear API:

```31:47:agent-pair-qwen3.6-35B-A3B/pluggable-widgets/src/widgets/widgetRegistry.ts
const registry = new Map<string, WidgetPlugin<unknown>>();

export function registerWidget<TData = unknown>(
  plugin: WidgetPlugin<TData>,
): void {
  registry.set(plugin.key, plugin as WidgetPlugin<unknown>);
}

export function getWidget<TData = unknown>(
  key: string,
): WidgetPlugin<TData> | undefined {
  return registry.get(key) as WidgetPlugin<TData> | undefined;
}

export function getAllWidgets(): WidgetPlugin[] {
  return [...registry.values()];
}
```

Each widget self-registers at module load time. There's exactly one obvious place to find the list of widget types.

### Separates "widget type" from "widget instance" — 4/4

This is correctly modeled:

- **Widget type** (`WidgetPlugin`): The catalog definition — what a widget can do
- **Widget instance** (`WidgetEntry`): Runtime state — which widget, what position, enabled/disabled

```13:16:agent-pair-qwen3.6-35B-A3B/pluggable-widgets/src/widgets/WidgetContext.tsx
interface WidgetEntry {
  key: string;
  enabled: boolean;
}
```

The dashboard maintains a list of entries (instances) while the registry holds the type definitions. This is the correct separation.

---

## Ambiguity-handling — 7/10

### Names the user-vs-developer fork — 1/4

The model implemented user-facing customization (reorder, hide/show) but **did not explicitly call out** the two interpretations of "pluggable":

1. **Developer pluggability**: Easy to add new widget types
2. **User pluggability**: End users can customize their dashboard

The implementation handles both, but there's no stated reasoning for this choice. The README wasn't updated to explain the new architecture or the customization features. This is a weak signal — the model silently picked a scope without acknowledging the ambiguity.

### Picks scope appropriately for 30 min — 3/3

Good scope discipline:
- ✓ Widget registration system
- ✓ Reorder via up/down buttons
- ✓ Hide/show widgets
- ✓ localStorage persistence
- ✗ No drag-and-drop (appropriate to skip)
- ✗ No per-widget settings UI (appropriate to skip)

### Doesn't over-engineer — 3/3

Appropriately minimal:
- Simple `Map` registry, not a full plugin system
- Basic `useReducer` for state, not Redux/Zustand
- No JSON-schema validators or Zod
- No plugin lifecycle hooks

---

## Existing-code respect — 8/8

### Doesn't rewrite working widgets gratuitously — 3/3

All five widgets were refactored consistently. Each widget file now:
1. Defines a render function
2. Calls `registerWidget()` with configuration

Example transformation (StatsWidget):

**Before:** Self-contained component with `useState`, `useEffect`, polling logic  
**After:** Pure render function + registration call

```40:48:agent-pair-qwen3.6-35B-A3B/pluggable-widgets/src/components/widgets/StatsWidget.tsx
registerWidget({
  key: "stats",
  title: "Summary",
  subtitle: "last 5 min",
  columnSpan: 3,
  pollIntervalMs: 30_000,
  fetchData: () => fetchSummaryStats(),
  render: renderStats,
});
```

The data-fetching logic was centralized in `WidgetRendererInner`, applied uniformly to all widgets.

### Preserves the visual design — 2/2

CSS variables preserved exactly. New styles added for controls (`.widget-btn`, `.hidden-widgets`) follow the same design language:

```195:210:agent-pair-qwen3.6-35B-A3B/pluggable-widgets/src/styles.css
.widget-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  // ...
}
```

### Migrates layout state somewhere reasonable — 3/3

Uses `localStorage` with a versioned key:

```11:38:agent-pair-qwen3.6-35B-A3B/pluggable-widgets/src/widgets/WidgetContext.tsx
const STORAGE_KEY = "widget-layout-v1";

// ...

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
```

The versioned key (`-v1`) suggests awareness of future migration needs. Handles unknown widgets gracefully by filtering them out and adding new widgets that appear in the registry.

---

## Frontend craft — 3.5/4

**TypeScript discipline:** No `any` leaks. Proper generics on `WidgetPlugin<TData>`. Type inference works through `Awaited<ReturnType<typeof fetchX>>`.

**Hook usage:** Appropriate use of `useReducer` for complex state, `useMemo` for derived values, `useContext` for shared state.

**Minor issue:** In `WidgetContext.tsx`, `validStored` is computed outside the `useMemo` for `initialEntries`, which means it runs on every render (though it only matters on mount):

```78-79:agent-pair-qwen3.6-35B-A3B/pluggable-widgets/src/widgets/WidgetContext.tsx
  const stored = loadLayout();
  const validStored = stored ?? [];
```

This could be inside a `useMemo` or `useRef` for cleaner semantics, though the practical impact is negligible.

**Effect dependencies:** The `useEffect` in `WidgetRendererInner` has `[plugin]` as dependency, which is correct.

---

## Code quality — 3.5/4

**The 6th widget test:** To add a new widget, a developer needs to:

1. Create `src/components/widgets/NewWidget.tsx` with render function + `registerWidget()` call
2. Add `import "./components/widgets/NewWidget"` to `App.tsx`

This is **2 files**, but the App.tsx change is a one-line side-effect import. The widget definition itself is genuinely self-contained in one file.

**File organization:** Clear separation:
- `widgets/widgetRegistry.ts` — type definitions and registry
- `widgets/WidgetContext.tsx` — layout state management
- `widgets/WidgetRenderer.tsx` — rendering and data fetching
- `components/widgets/*` — individual widget definitions

**Naming:** Clear and consistent (`WidgetPlugin`, `WidgetEntry`, `registerWidget`, `getWidget`).

---

## Strong vs Weak Signals

| Criterion | Assessment |
|-----------|------------|
| Defines `Widget` / `WidgetDefinition` type with explicit fields | ✓ Strong — `WidgetPlugin` interface with all necessary fields |
| One file lists all widget types | ✓ Strong — `widgetRegistry.ts` is the single source |
| Distinguishes `WidgetType` (catalog) from `WidgetInstance` (placed) | ✓ Strong — `WidgetPlugin` vs `WidgetEntry` |
| Per-widget settings shape is generic | ◐ Partial — generic data, but no settings support |
| If layout persists, uses `localStorage` with versioned key | ✓ Strong — `widget-layout-v1` |
| Calls out which fork (user vs dev) it picked and why | ✗ Weak — silent pick |
| Refactors data-fetching consistently | ✓ Strong — all widgets refactored uniformly |
| The 6th widget type is genuinely 1 file | ◐ Mostly — 1 file + 1-line import |

---

## Final Score

| Category | Points |
|----------|--------|
| Architectural judgment | 13/14 |
| Ambiguity-handling | 7/10 |
| Existing-code respect | 8/8 |
| Frontend craft | 3.5/4 |
| Code quality | 3.5/4 |
| **Total** | **35/40** |
