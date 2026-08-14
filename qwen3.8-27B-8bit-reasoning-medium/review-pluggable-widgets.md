# Review: qwen3.8-27B-8bit-reasoning-medium — Pluggable Widgets

**Score: 34 / 40**

## Summary

Strong implementation that delivers a well-architected pluggable widget system. The model created a clean `WidgetDef` interface, a single-file registry, localStorage persistence with proper versioning, and consistent refactoring of all widgets. User customization (add/remove/reorder via drag-drop) works end-to-end. The main gap is the conflation of widget types with widget instances — the current design doesn't support multiple instances of the same widget type or per-instance settings.

---

## Architectural Judgment — 11 / 14

### Designs a Widget contract — 5 / 6

The `WidgetDef` interface captures the essential shape:

```14:25:qwen3.8-27B-8bit-reasoning-medium/pluggable-widgets/src/widgets/types.ts
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
```

Good: explicit fields, JSDoc comments, clear semantics. Missing: no `defaultSettings` or settings schema field — the contract doesn't support per-widget configuration. Acceptable given scope, but not the full abstraction.

### Picks a registration pattern — 4 / 4

Single source of truth in `widgets/registry.ts`:

```1:23:qwen3.8-27B-8bit-reasoning-medium/pluggable-widgets/src/widgets/registry.ts
import type { WidgetDef } from "./types";
import { statsWidget } from "../components/widgets/StatsWidget";
import { latencyWidget } from "../components/widgets/LatencyWidget";
import { errorsWidget } from "../components/widgets/ErrorsWidget";
import { activityWidget } from "../components/widgets/ActivityWidget";
import { servicesWidget } from "../components/widgets/ServicesWidget";

const definitions: WidgetDef[] = [
  statsWidget,
  latencyWidget,
  errorsWidget,
  activityWidget,
  servicesWidget,
];

/** All known widget types, keyed by id. */
export const WIDGET_TYPES: Record<string, WidgetDef> = Object.fromEntries(
  definitions.map((d) => [d.id, d]),
);

/** Default layout for first-time users (order = the original dashboard). */
export const DEFAULT_LAYOUT: string[] = definitions.map((d) => d.id);
```

Clean. One obvious place to answer "what widget types exist?"

### Separates "widget type" from "widget instance" — 2 / 4

The layout state is `string[]` — an array of type IDs:

```28:37:qwen3.8-27B-8bit-reasoning-medium/pluggable-widgets/src/hooks/useDashboardLayout.ts
export function useDashboardLayout() {
  const [layout, setLayout] = useState<string[]>(loadLayout);
  // ...
  const addWidget = useCallback((id: string) => {
    setLayout((l) => (l.includes(id) ? l : [...l, id]));
  }, []);
```

This conflates type and instance:
- You cannot have two "stats" widgets side by side
- There are no per-instance settings
- `addWidget` guards against duplicates because instance ID ≡ type ID

For "add and remove widgets, reorder them" this technically works, but it's architecturally limiting. A proper design would have `WidgetInstance = { instanceId, typeId, settings }` and `layout: WidgetInstance[]`.

---

## Ambiguity Handling — 7 / 10

### Names the user-vs-developer fork — 1 / 4

The README documents *both* user features and developer workflow but never explicitly acknowledges that "pluggable" has two readings:

> **Layout** — Users can remove a widget (× in its header), add widgets back (dashed "Add widget" tile), and drag widget headers to reorder.
>
> **Adding a new widget type** — Widgets are pluggable. To add one: [3 steps]

Silent pick. No stated reasoning for why it tackled user customization AND developer extensibility, or why that was appropriate for 30 minutes.

### Picks scope appropriately — 3 / 3

Excellent scope judgment:
- Implemented: add/remove/reorder, drag-drop (native HTML5, not react-grid-layout), localStorage persistence
- Didn't attempt: full grid layout library, settings UI, backend sync, JSON schema validation

Native HTML5 drag-and-drop keeps dependencies minimal while delivering the UX.

### Doesn't over-engineer — 3 / 3

No zod, no JSON-schema validators, no plugin lifecycle hooks. The implementation is proportional to the problem.

---

## Existing-Code Respect — 8 / 8

### Doesn't rewrite working widgets gratuitously — 3 / 3

All five widgets refactored consistently:
- Header/chrome extracted to shared `WidgetCard`
- Body component now only renders content
- Each exports a `WidgetDef` constant
- Data-fetching patterns preserved exactly (same intervals, same hooks)

Compare before/after for `StatsWidget`:

**Before (original):**
```tsx
return (
  <div className="widget widget--stats">
    <div className="widget-header">
      <span className="widget-title">Summary</span>
      <span className="widget-subtitle">last 5 min</span>
    </div>
    <div className="widget-body">{/* content */}</div>
  </div>
);
```

**After (refactored):**
```tsx
// Body only — chrome comes from WidgetCard
return data == null ? (
  <span className="loading">Loading…</span>
) : (
  <div className="stat-grid">{/* content */}</div>
);

export const statsWidget: WidgetDef = {
  id: "stats",
  title: "Summary",
  subtitle: "last 5 min",
  span: 3,
  component: StatsWidget,
};
```

Clean, consistent extraction across all widgets.

### Preserves visual design — 2 / 2

- Same CSS variables (`:root` block unchanged)
- Same widget chrome styling
- Same grid layout (12-column)
- Additive styles for new features (drag grip, remove button, add-tile)

### Migrates layout state somewhere reasonable — 3 / 3

localStorage with versioned key and defensive loading:

```4:22:qwen3.8-27B-8bit-reasoning-medium/pluggable-widgets/src/hooks/useDashboardLayout.ts
const STORAGE_KEY = "ops-dashboard.layout.v1";

function loadLayout(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return DEFAULT_LAYOUT;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_LAYOUT;
    const seen = new Set<string>();
    return parsed.filter((id): id is string => {
      // Drop unknown ids (widget removed from code) and duplicates.
      if (typeof id !== "string" || !(id in WIDGET_TYPES) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  } catch {
    return DEFAULT_LAYOUT;
  }
}
```

Good: versioned key (`.v1`), graceful fallback, filters out unknown/removed widget types.

---

## Frontend Craft — 4 / 4

- No `any` types
- Proper cleanup in effects (all `clearInterval` returns)
- Type-safe event handlers (`DragEvent<HTMLDivElement>`)
- No key warnings (using stable IDs)
- Effect dependencies correct

---

## Code Quality — 4 / 4

Clean file organization:
```
src/
  widgets/
    types.ts        # WidgetDef interface
    registry.ts     # All widget types, default layout
  components/
    WidgetCard.tsx  # Shared chrome
    AddWidgetTile.tsx
    widgets/
      StatsWidget.tsx  # Each exports body + WidgetDef
      ...
  hooks/
    useDashboardLayout.ts
```

README documents the 3-step process for adding a widget. A new developer can add the 6th widget type by reading one example file and adding one line to the registry.

---

## Tells

| Criterion | Signal |
|-----------|--------|
| Defines `Widget`/`WidgetDef` type with explicit fields | ✅ Strong |
| One file lists all widget types | ✅ Strong (`widgets/registry.ts`) |
| Distinguishes `WidgetType` from `WidgetInstance` | ❌ Weak (single shape, no instances) |
| Per-widget settings shape is generic | ❌ Weak (no settings support) |
| localStorage with versioned key | ✅ Strong (`.v1`, filters unknown IDs) |
| Calls out user vs dev fork and why | ❌ Weak (silent pick) |
| Refactors consistently or not at all | ✅ Strong (all 5 widgets refactored identically) |
| 6th widget type is 1 file | ✅ Strong (1 file + 1 registry line) |

---

## Score Breakdown

| Category | Points |
|----------|--------|
| Architectural judgment | 11 / 14 |
| Ambiguity handling | 7 / 10 |
| Existing-code respect | 8 / 8 |
| Frontend craft | 4 / 4 |
| Code quality | 4 / 4 |
| **Total** | **34 / 40** |
