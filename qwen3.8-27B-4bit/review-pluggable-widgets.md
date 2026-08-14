# Review: Qwen 3.8-27B-4bit — Pluggable Widgets

**Overall Score: 34/40**

## Architectural Judgment — 12/14

### Designs a Widget contract — 5/6

The model defined a clear `WidgetDef` interface:

```1:9:qwen3.8-27B-4bit/pluggable-widgets/src/widgets/types.ts
import type { ComponentType } from "react";

export interface WidgetDef {
  id: string;
  name: string;
  description?: string;
  component: ComponentType;
  defaultSpan: number;
}
```

This is a solid contract with the essential fields: `id`, `name`, `component`, `defaultSpan`, and optional `description`. The fields are appropriate for the scope. However, there's no settings schema or generic settings type — the contract doesn't support per-widget configuration beyond the span. For an internal ops dashboard this is acceptable, but it limits future extensibility.

### Picks a registration pattern — 4/4

Clean registry pattern with a single source of truth:

```1:19:qwen3.8-27B-4bit/pluggable-widgets/src/widgets/registry.ts
import type { ComponentType } from "react";
import type { WidgetDef } from "./types";

const registry = new Map<string, WidgetDef>();

export function registerWidget(def: WidgetDef): void {
  if (registry.has(def.id)) {
    throw new Error(`Widget "${def.id}" is already registered`);
  }
  registry.set(def.id, def);
}

export function getWidget(id: string): WidgetDef | undefined {
  return registry.get(id);
}

export function getAllWidgets(): WidgetDef[] {
  return [...registry.values()];
}
```

All widgets registered in one place (`widgets/index.ts`). The `createWidget()` helper makes registration clean. A new developer knows exactly where to look.

### Separates "widget type" from "widget instance" — 3/4

```11:14:qwen3.8-27B-4bit/pluggable-widgets/src/widgets/types.ts
export interface WidgetPlacement {
  widgetId: string;
  span: number;
}
```

Good separation: `WidgetDef` is the catalog entry (type), `WidgetPlacement` is what's on the dashboard (instance). The `widgetId` in placement references the `id` in the definition.

Minor deduction: `WidgetPlacement` lacks a unique instance ID — it uses `widgetId` as the key. This means you can't have two instances of the same widget type on the dashboard (see `useDashboardLayout.ts` line 39 where it checks `if (prev.some((p) => p.widgetId === widgetId))`). For an ops dashboard this is likely fine, but it's a limitation.

---

## Ambiguity-handling — 8/10

### Names the user-vs-developer fork — 2/4

The README implicitly picks both forks:
- **User customization**: add/remove/reorder widgets via the Customize panel
- **Developer extensibility**: add new widget types via the registry

However, there's no explicit reasoning about why both were chosen or acknowledgment that "pluggable" is ambiguous. The model just implemented both without stating the fork decision.

### Picks scope appropriately for 30 min — 3/3

Excellent scope decisions:
- Simple up/down reordering instead of drag-and-drop
- No `react-grid-layout` or similar heavy dependency
- `localStorage` persistence (no backend)
- No per-widget settings UI

The features delivered are functional and complete within the scope.

### Doesn't over-engineer — 3/3

No unnecessary complexity:
- Simple `Map` registry
- Plain `localStorage` JSON
- No zod, no JSON schema validators
- No plugin lifecycle hooks
- No custom event system

---

## Existing-code Respect — 7/8

### Doesn't rewrite working widgets gratuitously — 3/3

Data-fetching patterns were left untouched. The only changes to widget components were removing the `widget--X` modifier classes (e.g., `widget--stats` → `widget`) because grid span is now controlled by the wrapper in `DashboardGrid`:

```15:23:qwen3.8-27B-4bit/pluggable-widgets/src/components/DashboardGrid.tsx
          <div
            key={placement.widgetId}
            className="widget-cell"
            style={{ gridColumn: `span ${placement.span}` }}
          >
            <WidgetComponent />
          </div>
```

This is a consistent refactor applied to all widgets.

### Preserves the visual design — 2/2

CSS variables preserved. Same widget chrome (header, subtitle, body structure). The removal of hardcoded grid placements from CSS is appropriate since spans are now dynamic. Overall visual fidelity maintained.

### Migrates layout state somewhere reasonable — 2/3

```5:26:qwen3.8-27B-4bit/pluggable-widgets/src/widgets/useDashboardLayout.ts
const STORAGE_KEY = "dashboard-layout";

function loadLayout(): WidgetPlacement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLayout();
    const parsed: WidgetPlacement[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultLayout();
    const valid = parsed.filter((p) => getWidget(p.widgetId) && p.span >= 1 && p.span <= 12);
    return valid.length > 0 ? valid : defaultLayout();
  } catch {
    return defaultLayout();
  }
}
```

Uses `localStorage` with validation (filters out invalid widget IDs, clamps spans). Falls back to default on parse errors. However, **no versioned key** — if the schema changes in the future, there's no migration path. A key like `dashboard-layout-v1` would be more robust.

---

## Frontend Craft — 4/4

- **TypeScript discipline**: No `any` anywhere. Proper typing with `ComponentType`, `WidgetDef`, `WidgetPlacement`.
- **Hook usage**: Correct use of `useCallback` with functional `setState` updates (avoiding stale closures).
- **Effect dependencies**: `useEffect` for persistence depends on `[layout]` — correct.
- **No React footguns**: Keys are stable (`placement.widgetId`), no obvious infinite re-render risks.

---

## Code Quality — 3/4

### File organization

```
src/widgets/
├── index.ts          # registration + exports
├── registry.ts       # Map + lookup functions
├── types.ts          # WidgetDef, WidgetPlacement
└── useDashboardLayout.ts
```

Clean separation of concerns.

### Adding the 6th widget

Per the README:

1. Create component in `src/components/widgets/`
2. Add one line in `src/widgets/index.ts`:
   ```ts
   createWidget("my-widget", "My Widget", MyWidget, 6, "description");
   ```

This is essentially **2 files** (the component + one import/registration line), not "1 file". The rubric's ideal is a single file, but this is close and practical.

### Naming

Clear names throughout: `WidgetDef`, `WidgetPlacement`, `useDashboardLayout`, `DashboardGrid`, `CustomizePanel`.

---

## Summary

| Category | Score | Notes |
|----------|-------|-------|
| Architectural judgment | 12/14 | Solid contract and registry; minor: no instance IDs, no settings |
| Ambiguity-handling | 8/10 | Good scope, but didn't explicitly state fork decision |
| Existing-code respect | 7/8 | Consistent refactor, no versioned storage key |
| Frontend craft | 4/4 | Clean TypeScript, correct hooks |
| Code quality | 3/4 | 2-file addition, clear organization |
| **Total** | **34/40** | |

### Strengths

- Clean type/instance separation (`WidgetDef` vs `WidgetPlacement`)
- Single-source registry pattern
- Appropriate scope for the time constraint
- Preserved existing code patterns (data fetching, CSS)
- Functional customize UI with localStorage persistence

### Weaknesses

- No explicit reasoning about the "pluggable" ambiguity
- Can't have multiple instances of the same widget type
- No settings/config system for widgets
- Missing version key on localStorage

### Strong vs Weak Signals

| Signal | Status |
|--------|--------|
| Defines `Widget`/`WidgetDefinition` type with explicit fields | ✓ |
| One file lists all widget types | ✓ `widgets/index.ts` |
| Distinguishes `WidgetType` from `WidgetInstance` | ✓ |
| Per-widget settings shape is generic | ✗ No settings system |
| `localStorage` with versioned key | ⚠ No version |
| Calls out fork decision and why | ⚠ Implicit only |
| Refactors consistently | ✓ |
| 6th widget is 1 file | ⚠ 2 files |

This is a **strong implementation** that demonstrates good architectural instincts and appropriate scoping for a time-constrained task.
