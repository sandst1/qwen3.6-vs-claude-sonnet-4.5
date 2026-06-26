# Review: pluggable-widgets (ornith-1.0-35b-8bit)

**Score: 30/40**

---

## Architectural judgment — 9/14

### Designs a Widget contract — 4/6

Defines a real `WidgetDef` interface:

```1:9:ornith-1.0-35b-8bit/pluggable-widgets/src/components/widgets/types.ts
import type { ComponentType } from "react";

export interface WidgetDef {
  id: string;
  label: string;
  subtitle: string;
  width: number; // 1–12, grid-column span
  component: ComponentType;
}
```

Captures the essential shape: id, display label, subtitle, grid width, and component reference. However:
- No generic settings shape (`settings: TSettings`) — widgets can't have per-instance configuration.
- Metadata duplication: the registry stores `label` and `subtitle`, but each widget also renders its own hardcoded title and subtitle internally. The registry metadata is only used by the WidgetPalette, not by the actual widget rendering. This creates a subtle inconsistency — e.g., the registry says `subtitle: "tracked services"` for Services, but the actual widget renders `"6 tracked"` dynamically.

### Picks a registration pattern — 3/4

Centralized array registry in one file:

```8:44:ornith-1.0-35b-8bit/pluggable-widgets/src/components/widgets/registry.ts
export const widgetRegistry: WidgetDef[] = [
  {
    id: "stats",
    label: "Summary",
    subtitle: "last 5 min",
    width: 3,
    component: StatsWidget,
  },
  // ... all 5 widgets
];

export function getWidgetDef(id: string): WidgetDef | undefined {
  return widgetRegistry.find((w) => w.id === id);
}
```

One obvious place for "where is the list of available widget types?" — good. Minor deductions: it's a static array that must be edited directly (no `registerWidget()` function for self-registration), and the metadata duplication between registry labels and widget-internal headers means the abstraction leaks. Adding a 6th widget requires keeping the registry entry's `label`/`subtitle` in sync with the widget's own header rendering.

### Separates "widget type" from "widget instance" — 2/4

This is the main architectural weakness. The layout state is a plain `string[]` of type IDs:

```30:31:ornith-1.0-35b-8bit/pluggable-widgets/src/components/useDashboardLayout.ts
const [ids, setIds] = useState<string[]>(loadLayout);
```

And `addWidget` explicitly prevents duplicates:

```36:43:ornith-1.0-35b-8bit/pluggable-widgets/src/components/useDashboardLayout.ts
const addWidget = useCallback(
    (widgetId: string) => {
      setIds((prev) => {
        if (prev.includes(widgetId)) return prev;
        return [...prev, widgetId];
      });
    },
    [],
  );
```

There is no `WidgetInstance` concept — no per-instance uid, no per-instance settings, no way to place two instances of the same widget type. The rubric looks for a list of widget *instances* (with their own ids, position, per-instance settings) backed by a catalog of *types*. Here, the layout is just type IDs. This is the partial conflation pattern seen in several other implementations.

---

## Ambiguity-handling — 8/10

### Names the user-vs-developer fork — 2/4

The implementation delivers *both* forks:
- **Developer extensibility**: centralized registry; adding a widget is 2 files (create component + edit `registry.ts`)
- **User customization**: WidgetPalette with add/remove/reorder, persisted to localStorage

However, there's no stated reasoning about which interpretation of "pluggable" was prioritized or why both were included. The README was not updated to describe the new system at all — it still documents the original static five-widget layout. Silent pick.

### Picks scope appropriately for 30 min — 3/3

Appropriate scoping:
- Simple checkbox-based add/remove instead of drag-and-drop
- Up/down arrow reordering instead of react-grid-layout
- localStorage persistence (not inventing a backend)
- No settings UI beyond visibility and order

### Doesn't over-engineer — 3/3

Clean restraint:
- Simple array registry — no class hierarchies or factory patterns
- No zod or JSON-schema validators
- No plugin lifecycle hooks
- No abstracted "WidgetManager" or "WidgetLoader" classes

---

## Existing-code respect — 7/8

### Doesn't rewrite working widgets gratuitously — 3/3

Minimal, consistent refactoring across all 5 widgets. The only change: removing the per-widget CSS class suffix (`widget widget--stats` → `widget`) since grid placement is now handled inline by the Dashboard.

**Original:**
```14:15:original/pluggable-widgets/src/components/widgets/StatsWidget.tsx
    <div className="widget widget--stats">
      <div className="widget-header">
```

**Refactored:**
```14:15:ornith-1.0-35b-8bit/pluggable-widgets/src/components/widgets/StatsWidget.tsx
    <div className="widget">
      <div className="widget-header">
```

Data-fetching patterns, state management, polling intervals, and UI rendering are all preserved verbatim. The change is consistently applied across all 5 widgets.

### Preserves the visual design — 2/2

All CSS variables preserved. The new styles (toolbar, palette, move buttons) follow the same design language — same colors, border-radius, font sizes, and hover patterns. Grid still uses the 12-column layout. Widget chrome (`.widget`, `.widget-header`, `.widget-body`) is untouched.

### Migrates layout state somewhere reasonable — 2/3

localStorage with sensible key and defensive loading:

```6:18:ornith-1.0-35b-8bit/pluggable-widgets/src/components/useDashboardLayout.ts
function loadLayout(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return widgetRegistry.map((w) => w.id);
}
```

Good validation — checks it's a string array before using it. Falls back to default layout on corruption. Minor deduction: no versioned storage key (`ops-dashboard-layout-v1`), so if the schema changes later there's no migration path.

---

## Frontend craft — 3/4

- No `any` types — `WidgetDef`, `DashboardLayoutActions`, all properly typed
- Correct hook call order — `WidgetPalette` declares hooks before the `if (!open) return null` early return
- Proper `useEffect` cleanup — `setInterval` cleanup preserved from original; click-outside listener cleaned up
- Correct `key` usage — `key={w.id}` in widget rendering

Minor issues:

- **Ineffective `useMemo`**: `useMemo(() => toDashboardActions(layout), [layout])` — `layout` is a new object reference on every render (the hook returns a fresh object literal), so this memoization never actually caches. The `actions` object is recreated every render regardless.

```33:33:ornith-1.0-35b-8bit/pluggable-widgets/src/components/Dashboard.tsx
  const actions = useMemo(() => toDashboardActions(layout), [layout]);
```

- **Palette positioning**: The palette uses `position: absolute; top: 100%` relative to the `.dashboard` container, which includes the entire widget grid. On a dashboard with several rows of widgets, the palette would appear below all of them rather than near the toolbar button. Should be positioned relative to the toolbar or the toggle button.

- **Toggle button vs click-outside conflict**: Clicking "Configure widgets" while the palette is open fires the mousedown handler (closing it) then the click handler (reopening it), making it impossible to close the palette via its toggle button.

---

## Code quality — 3/4

### File organization

Clean separation:
- `widgets/types.ts` — type definition
- `widgets/registry.ts` — registration and lookup
- `Dashboard.tsx` — layout orchestration
- `WidgetPalette.tsx` — configuration UI
- `useDashboardLayout.ts` — state management hook

### Adding the 6th widget

Requires **2 files**:
1. Create `widgets/NewWidget.tsx` with component (including its own header)
2. Add import + entry in `registry.ts`

Clear and mechanical. Could be 1 file with a self-registration pattern, but 2 files is acceptable.

### Minor issues

- `DashboardLayoutActions` interface is exported from `Dashboard.tsx` and imported by `WidgetPalette.tsx`, while `Dashboard.tsx` imports `WidgetPalette`. This creates a cross-dependency (type-only, not circular at runtime, but a code organization smell — the interface should be in its own file).
- README not updated — still describes the original static layout with no mention of the pluggable system, how to add widgets, or how customization works.

---

## Strong signals present

| Signal | Present |
|--------|---------|
| Defines `WidgetDef` with explicit fields | ✓ |
| One file lists all widget types (registry.ts) | ✓ |
| Distinguishes `WidgetType` from `WidgetInstance` | ✗ (no instance concept) |
| Uses `localStorage` for persistence | ✓ |
| Refactors data-fetching consistently | ✓ (not refactored — preserved) |
| 6th widget type is 1-2 files | ✓ (2 files) |

## Weak signals present

| Signal | Present |
|--------|---------|
| Silent pick of user vs dev fork | ✓ (no stated reasoning) |
| No versioned localStorage key | ✓ |
| Single `Widget` shape muddles type/instance | ✓ (no instance model) |
| Metadata duplication (titles in registry AND widgets) | ✓ |

---

## Summary

A solid, cleanly-scoped implementation that delivers both user customization (add/remove/reorder) and developer extensibility (centralized registry). The `WidgetDef` contract is real and reasonable. Widget changes are minimal and consistent — only the CSS class suffix was removed.

The main gaps: no type/instance separation (can't place duplicate widgets, no per-instance state), metadata duplication between the registry and widget-internal headers, a few minor React patterns that don't quite land (ineffective `useMemo`, palette positioning), and zero documentation of the new architecture. The README was not updated at all.

Compared to the strongest implementation in this benchmark (Qwen 27B-8bit at 35.5/40), the ornith version misses the `WidgetInstance` abstraction and the self-registering widget pattern, but avoids the frontend bugs seen in some other implementations.

**Would merge:** Yes, with notes on the type/instance conflation and metadata duplication.
