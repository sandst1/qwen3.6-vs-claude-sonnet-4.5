# Review: opus-4.6 Pluggable Widgets Implementation

**Final Score: 33.5 / 40**

## Summary

The implementation introduces a clean widget registry pattern with user-facing customization (add/remove/reorder widgets, persisted to localStorage). The architecture is well-scoped for a 30-minute task, with minimal over-engineering. The main weakness is conflating widget *types* with widget *instances* — the layout is stored as `string[]` of type names rather than instances with unique IDs, which causes subtle issues when the same widget type appears multiple times.

---

## Architectural Judgment — 11 / 14

### Designs a Widget contract — 5 / 6

The `WidgetDefinition` interface is well-designed:

```1:12:opus-4.6/pluggable-widgets/src/widgets/registry.ts
import { type ComponentType } from "react";

export interface WidgetDefinition {
  /** Unique key, e.g. "stats", "latency". Used in saved layouts. */
  type: string;
  /** Human-readable name shown in the "Add widget" menu. */
  label: string;
  /** CSS grid column span (out of 12). */
  colSpan: number;
  /** The React component to render. Receives no props. */
  component: ComponentType;
}
```

**Strengths:**
- Clear, focused interface
- `colSpan` enables layout flexibility
- Components receive no props — clean separation

**Missing:**
- No per-widget settings or settings schema (`settings: TSettings` or `defaultSettings`)
- For a dashboard where widgets might have configurable options (refresh rate, display modes), this would be valuable

### Picks a registration pattern — 4 / 4

Clean single-location registration via a `Map`:

```14:31:opus-4.6/pluggable-widgets/src/widgets/registry.ts
const registry = new Map<string, WidgetDefinition>();

/** Register a widget type. Call at module scope. */
export function registerWidget(def: WidgetDefinition) {
  if (registry.has(def.type)) {
    console.warn(`Widget type "${def.type}" registered twice — overwriting.`);
  }
  registry.set(def.type, def);
}

/** Get a registered widget by type key. */
export function getWidget(type: string): WidgetDefinition | undefined {
  return registry.get(type);
}

/** All registered widget types. */
export function allWidgets(): WidgetDefinition[] {
  return Array.from(registry.values());
}
```

All widget registrations happen in one file (`widgets/index.ts`), and `DEFAULT_LAYOUT` lives in `registry.ts`. No scattering.

### Separates "widget type" from "widget instance" — 2 / 4

**This is the main architectural gap.** The layout is stored as `string[]`:

```32:41:opus-4.6/pluggable-widgets/src/widgets/registry.ts
/** The default layout — shown when user has no saved customisation. */
export const DEFAULT_LAYOUT: string[] = [
  "stats",
  "latency",
  "errors",
  "activity",
  "services",
];
```

And rendered using array index as part of the key:

```58:60:opus-4.6/pluggable-widgets/src/widgets/Dashboard.tsx
            <div
              key={`${type}-${idx}`}
              className="widget-slot"
```

**Problems:**
- Adding the same widget type twice (e.g., two "stats" widgets) works visually but they share identity semantically
- No per-instance settings possible (can't have one "stats" widget showing 5-min data and another showing 1-hour data)
- React key stability relies on index, which can cause state issues during reorder

**Better approach:** Layout should be `WidgetInstance[]` with `{ id: string; type: string; settings?: unknown }`.

---

## Ambiguity-handling — 8 / 10

### Names the user-vs-developer fork — 2 / 4

The implementation delivers *both* user customization (add/remove/reorder) and developer extensibility (registry pattern). However, there's no explicit statement of this choice in code comments or README.

The `widgets/index.ts` file does document the developer story well:

```1:11:opus-4.6/pluggable-widgets/src/widgets/index.ts
/**
 * Widget registrations.
 *
 * To add a new widget:
 *   1. Create a component in src/components/widgets/
 *   2. Call registerWidget() here with type, label, colSpan, and component.
 *   3. (Optional) Add the type to DEFAULT_LAYOUT in registry.ts if it should
 *      appear by default for new users.
 *
 * That's it — the dashboard picks it up automatically.
 */
```

But there's no acknowledgment that "pluggable" could mean runtime plugin loading, or why user-configurability was chosen over dev-only extensibility (or vice versa). A brief comment explaining the interpretation would strengthen this.

### Picks scope appropriately for 30 min — 3 / 3

- Arrow buttons for reorder instead of drag-and-drop
- localStorage instead of backend persistence
- Simple add-widget panel instead of a modal or complex picker
- No settings UI per widget

All reasonable scoping decisions.

### Doesn't over-engineer — 3 / 3

- No JSON schema validators
- No zod
- No plugin lifecycle hooks
- No service worker for offline
- No complex state management library

Just React Context + localStorage. Appropriate.

---

## Existing-code Respect — 7.5 / 8

### Doesn't rewrite working widgets gratuitously — 3 / 3

Widgets are nearly unchanged. The only modification is removing widget-specific class names:

**Original:**
```tsx
<div className="widget widget--stats">
```

**After:**
```tsx
<div className="widget">
```

This is a necessary change since grid placement now comes from `colSpan` in the registry rather than CSS classes. The data-fetching pattern (useState + useEffect + interval polling) is preserved identically across all widgets.

### Preserves the visual design — 2 / 2

- Same CSS variables (`:root` block unchanged)
- Same widget chrome (`.widget`, `.widget-header`, `.widget-body` unchanged)
- New UI elements (toolbar, add-widget panel, controls) use the same design language

The new styles extend rather than replace:

```90:131:opus-4.6/pluggable-widgets/src/styles.css
/* widget slot (controls wrapper) */
.widget-slot {
  position: relative;
}
// ... hover-reveal controls using existing --panel, --border, --accent, --bad variables
```

### Migrates layout state somewhere reasonable — 2.5 / 3

localStorage is the right choice:

```10:29:opus-4.6/pluggable-widgets/src/widgets/DashboardContext.tsx
const STORAGE_KEY = "dashboard-layout";

function loadLayout(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((s) => typeof s === "string")) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LAYOUT;
}
```

**Minor gap:** No versioned key (e.g., `dashboard-layout-v1`). If the layout schema changes later, there's no migration story. The validation is defensive (checks it's an array of strings) but adding a new widget type that users don't have in their saved layout won't surface it.

---

## Frontend Craft — 3 / 4

**TypeScript discipline:** No `any` usage. Proper types throughout.

**Hook usage:** Correctly uses `useCallback` in Context to avoid unnecessary re-renders:

```49:64:opus-4.6/pluggable-widgets/src/widgets/DashboardContext.tsx
  const addWidget = useCallback((type: string) => {
    setLayout((prev) => [...prev, type]);
  }, []);

  const removeWidget = useCallback((index: number) => {
    setLayout((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveWidget = useCallback((from: number, to: number) => {
    setLayout((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);
```

**Effect dependencies:** Correct. The save effect depends on `layout`:

```45:47:opus-4.6/pluggable-widgets/src/widgets/DashboardContext.tsx
  useEffect(() => {
    saveLayout(layout);
  }, [layout]);
```

**React keys:** Using `${type}-${idx}` is a weak pattern when reordering. Moving a widget doesn't preserve its identity — React may recreate it. For these stateless widgets it's fine, but if widgets had internal state (like scroll position or form input), reordering would reset it.

---

## Code Quality — 4 / 4

**File organization:**
```
src/widgets/
  ├── registry.ts        # WidgetDefinition interface + registry functions
  ├── DashboardContext.tsx  # Layout state + persistence
  ├── Dashboard.tsx      # Renders layout + controls
  └── index.ts           # All widget registrations
```

Clear separation. The 6th widget type requires:
1. Create `src/components/widgets/NewWidget.tsx`
2. Add `registerWidget(...)` call in `src/widgets/index.ts`
3. (Optional) Add to `DEFAULT_LAYOUT`

The `index.ts` documentation makes this explicit. One file to read.

**Naming:** Clear and consistent. `WidgetDefinition` for types, layout for instances (though the instance concept is weak).

---

## Strong vs Weak Signals Summary

| Signal | Assessment |
|--------|-----------|
| Defines `WidgetDefinition` type with explicit fields | ✅ Strong |
| One file lists all widget types | ✅ Strong (`widgets/index.ts`) |
| Distinguishes `WidgetType` from `WidgetInstance` | ⚠️ Weak — layout is just `string[]` |
| Per-widget settings shape is generic | ❌ Not implemented |
| localStorage with versioned key | ⚠️ Partial — no versioned key |
| Calls out user vs dev fork | ⚠️ Weak — implemented but not stated |
| Refactors data-fetching consistently | ✅ Strong — didn't touch it at all |
| 6th widget is 1 file | ✅ Strong — 1 file + 1 import |

---

## Recommendations

1. **Introduce widget instances:** Change layout to `{ id: string; type: string }[]` and generate unique IDs on add. This enables per-instance settings later.

2. **Version the storage key:** Use `dashboard-layout-v1` and add a migration path when the schema changes.

3. **Document the design choice:** Add a brief comment explaining why the implementation targets both user customization and developer extensibility.

4. **Consider stable keys:** Generate instance IDs (e.g., `crypto.randomUUID()`) rather than using array indices in React keys.
