# Review: Pluggable Widgets Implementation (Qwen 3.6 27B 4-bit)

**Total Score: 33/40**

---

## Summary

The implementation creates a solid pluggable widget architecture with a central registry, refactors all existing widgets consistently, and adds user configurability through a settings panel. The code is clean and well-organized. The main weakness is the lack of a true widget *instance* concept—the dashboard only tracks an ordered list of widget type IDs, meaning users cannot have multiple instances of the same widget type with different configurations.

---

## Architectural Judgment — 11/14

### Designs a Widget Contract — 5/6

The `WidgetDescriptor` interface in `registry.ts` is well-designed:

```15:36:qwen3.6-27B-4bit/pluggable-widgets/src/registry.ts
export interface WidgetDescriptor<T = unknown> {
  /** Unique identifier, used as the key in registry and config */
  id: string;

  /** Display title shown in widget header */
  title: string;

  /** Optional subtitle shown in widget header. Can be static or computed from data. */
  subtitle?: string | ((data: T | null) => string);

  /** Grid column span (1–12). Default layout fits 12 columns. */
  size: number;

  /** Polling interval in milliseconds */
  interval: number;

  /** Async function that fetches fresh data */
  fetch: () => Promise<T>;

  /** Presentational component. Receives current data (null while loading). */
  component: (data: T | null) => ReactNode;
}
```

**Strengths:**
- Generic `<T>` for type-safe data
- Computed subtitle option `(data: T | null) => string`
- Clear separation: fetch function + presentational component
- Good JSDoc documentation

**Weakness:**
- No per-widget settings schema support (e.g., `defaultSettings: TSettings`, `settingsSchema`). For the current scope this is fine, but it limits future configurability.

### Picks a Registration Pattern — 4/4

Excellent. Single `registry.ts` file with a Map-based registry:

```38:61:qwen3.6-27B-4bit/pluggable-widgets/src/registry.ts
const registry = new Map<string, WidgetDescriptor<unknown>>();

export function registerWidget<T>(desc: WidgetDescriptor<T>): void {
  if (registry.has(desc.id)) {
    console.warn(`Widget "${desc.id}" is already registered, skipping.`);
    return;
  }
  registry.set(desc.id, desc as WidgetDescriptor<unknown>);
}

/** Return all registered widgets in registration order. */
export function getRegisteredWidgets(): readonly WidgetDescriptor<unknown>[] {
  return Array.from(registry.values());
}

/** Look up a single widget by id. */
export function getWidget(id: string): WidgetDescriptor<unknown> | undefined {
  return registry.get(id);
}
```

"Where is the list of available widget types?" has one obvious answer: `registry.ts`.

### Separates "Widget Type" from "Widget Instance" — 2/4

**This is the main architectural weakness.**

The dashboard state is just an ordered list of widget type IDs:

```6:9:qwen3.6-27B-4bit/pluggable-widgets/src/hooks/useDashboard.tsx
export interface DashboardConfig {
  /** Ordered list of widget IDs to display */
  order: string[];
}
```

There is no concept of:
- **Instance ID** separate from type ID
- **Multiple instances** of the same widget type
- **Per-instance settings** (e.g., two Latency widgets showing different time ranges)

The implementation distinguishes the catalog (registry) from placed widgets (order), but conflates "which type" with "which instance." If a user removes the Stats widget and re-adds it, there's no instance identity—it's just the same type ID.

---

## Ambiguity-Handling — 8/10

### Names the User-vs-Developer Fork — 2/4

The implementation supports **both** interpretations of "pluggable":
1. **Developer pluggability**: Registry pattern, `registerWidget()` API, good docs on how to add a widget
2. **User pluggability**: Settings panel with toggle/reorder/reset, localStorage persistence

However, there's no explicit documentation stating this choice. The code implicitly implements both without calling out the ambiguity or explaining the reasoning. A strong answer would include a comment like:

> "Pluggable" can mean developer-extensible (easy to add new widget types) or user-configurable (users can customize their layout). We support both: the registry pattern for developers, and the settings panel for users.

### Picks Scope Appropriately — 3/3

The implementation is appropriately scoped:
- No heavy library like `react-grid-layout` for drag-and-drop
- Uses native HTML5 drag-and-drop for reordering (only in the settings panel, not the grid itself)
- `localStorage` persistence is simple and reasonable
- Settings panel is minimal but functional

### Doesn't Over-Engineer — 3/3

No unnecessary complexity:
- No JSON-schema validators
- No zod
- No plugin lifecycle hooks
- Simple Map-based registry
- Native drag-and-drop

---

## Existing-Code Respect — 7/8

### Doesn't Rewrite Working Widgets Gratuitously — 3/3

All 5 widgets were refactored **consistently** to the new pattern. Each widget now:
1. Defines a content component that receives data
2. Calls `registerWidget()` at module scope

Example transformation (StatsWidget):

```41:49:qwen3.6-27B-4bit/pluggable-widgets/src/components/widgets/StatsWidget.tsx
registerWidget({
  id: "stats",
  title: "Summary",
  subtitle: "last 5 min",
  size: 3,
  interval: 30_000,
  fetch: fetchSummaryStats,
  component: StatsContent,
});
```

The data-fetching pattern was consistently extracted to `useWidgetData` hook. No widget was left half-refactored.

### Preserves the Visual Design — 2/2

- Same CSS variables preserved
- Same widget chrome (header with title/subtitle, body)
- Same grid layout (12-column grid)
- Removed hardcoded `.widget--stats` classes, now uses inline `gridColumn: span ${size}` (acceptable trade-off)
- New settings panel styling is additive and fits the existing design language

### Migrates Layout State Somewhere Reasonable — 2/3

Uses `localStorage` with key `"dashboard-config"`:

```24:39:qwen3.6-27B-4bit/pluggable-widgets/src/hooks/useDashboard.tsx
function loadConfig(): DashboardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardConfig;
      // Validate: only keep IDs that are actually registered
      const registeredIds = new Set(getRegisteredWidgets().map((w) => w.id));
      const order = parsed.order.filter((id) => registeredIds.has(id));
      if (order.length > 0) return { order };
    }
  } catch {
    // corrupt storage, fall through to defaults
  }
  // Default: all registered widgets in registration order
  return { order: getRegisteredWidgets().map((w) => w.id) };
}
```

**Strengths:**
- Filters out unregistered widget IDs (handles removed widgets gracefully)
- Falls back to defaults on parse error

**Weakness:**
- No versioned key (e.g., `dashboard-config-v1`). If the schema changes, there's no migration story.

---

## Frontend Craft — 3/4

**Strengths:**
- TypeScript throughout, no `any`
- Good use of generics (`WidgetDescriptor<T>`)
- `useCallback` used appropriately in `useDashboard` and `SettingsPanel`
- No obvious infinite re-renders or key warnings
- Clean hook extraction (`useWidgetData`)

**Issues:**

In `useWidgetData.ts`, the inner `fetch` function is defined at render time but used in `useEffect` without being wrapped in `useCallback`:

```19:39:qwen3.6-27B-4bit/pluggable-widgets/src/hooks/useWidgetData.ts
  const fetch = () => {
    fetchFn()
      .then((result) => {
        // ...
      })
  };

  useEffect(() => {
    fetch();
    if (interval > 0) {
      const id = setInterval(fetch, interval);
      return () => clearInterval(id);
    }
  }, [fetchFn, interval]);
```

If `fetchFn` changes identity on re-render (e.g., inline arrow function), this will cause unnecessary re-fetches. In practice this works because the `fetch` functions are stable module-level exports, but it's fragile.

Also, the inner function named `fetch` shadows the global `fetch` API—a minor naming issue.

---

## Code Quality — 4/4

Excellent organization:

```
src/
  registry.ts           # Widget contract + registration
  api.ts                # Data fetching (unchanged)
  hooks/
    useDashboard.tsx    # Layout state management
    useWidgetData.ts    # Fetch + polling abstraction
  components/
    WidgetShell.tsx     # Shared widget chrome
    SettingsPanel.tsx   # User configuration UI
    widgets/
      StatsWidget.tsx   # One file per widget type
      LatencyWidget.tsx
      ...
```

**Adding a 6th widget type is genuinely 1 file:**
1. Create `src/components/widgets/NewWidget.tsx`
2. Define content component
3. Call `registerWidget({...})`
4. Import in `App.tsx` (side-effect import)

Clear naming, good JSDoc in `registry.ts`, sensible file structure.

---

## Strong vs Weak Signals Summary

| Criterion | Signal |
|-----------|--------|
| `WidgetDescriptor` type with explicit fields | ✅ Strong |
| One file lists all widget types | ✅ Strong (`registry.ts`) |
| Distinguishes type from instance | ⚠️ Partial (order is type IDs, no instance model) |
| Per-widget settings shape is generic | ❌ Weak (no settings support) |
| Layout persists with versioned key | ⚠️ Partial (persists, no version) |
| Calls out user-vs-dev fork | ❌ Weak (silent pick) |
| Refactors consistently | ✅ Strong (all 5 widgets) |
| 6th widget is 1 file | ✅ Strong |

---

## Score Breakdown

| Category | Points |
|----------|--------|
| Designs a Widget contract | 5/6 |
| Picks a registration pattern | 4/4 |
| Separates type from instance | 2/4 |
| Names the user-vs-developer fork | 2/4 |
| Picks scope appropriately | 3/3 |
| Doesn't over-engineer | 3/3 |
| Doesn't rewrite gratuitously | 3/3 |
| Preserves visual design | 2/2 |
| Migrates layout state reasonably | 2/3 |
| Frontend craft | 3/4 |
| Code quality | 4/4 |
| **Total** | **33/40** |
