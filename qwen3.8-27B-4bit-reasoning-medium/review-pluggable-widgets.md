# Review: qwen3.8-27B-4bit-reasoning-medium — Pluggable Widgets

**Total Score: 39/40**

## Architectural Judgment — 13/14

### Designs a Widget contract (5/6)

The model defines a clean `WidgetDefinition` interface in `src/widgets/types.ts`:

```ts
export interface WidgetDefinition {
  id: string;
  title: string;
  span: number;
  component: ComponentType;
}
```

This captures the essential shape: stable id for persistence, display title for the palette, grid span for layout, and the component to render. The contract is documented with JSDoc explaining its purpose.

**What's missing:** No settings support. A truly forward-looking contract would include `defaultSettings?: TSettings` or a generic `Widget<TSettings>` to anticipate per-widget configuration. For the current scope (no widgets need settings), this omission is acceptable, but it means adding a widget with settings later requires modifying the contract.

### Picks a registration pattern (4/4)

Excellent. Single `registry.ts` file with:
- A `Map<string, WidgetDefinition>` as the store
- `registerWidget()`, `getWidget()`, `allWidgets()` as the API
- All five widgets registered in one place at the bottom

The rubric asks: "Where is the list of available widget types?" Answer: `src/widgets/registry.ts`, lines 29-33. One obvious place.

### Separates "widget type" from "widget instance" (4/4)

Clean separation:
- `WidgetDefinition` in `types.ts` = the catalog entry (what kinds of widgets exist)
- `WidgetInstance` in `useLayout.ts` = a placed widget (unique `key` + reference to `widgetId`)

The architecture correctly supports multiple instances of the same type (each instance gets a unique `key` via `crypto.randomUUID()`), even though the current UI limits it to one instance per type. This is the right architectural decision: the constraint is in the UI, not baked into the data model.

## Ambiguity-Handling — 10/10

### Names the user-vs-developer fork (4/4)

The README explicitly addresses both interpretations of "pluggable":

**User customization:**
> Users can customize the dashboard via the "Customize layout" bar: Add/remove widgets, Reorder widgets by dragging, Reset back to the default layout.

**Developer extensibility:**
> Adding a new widget type: 1. Create a component... 2. Register it in registry.ts

The model implemented both forks rather than picking one. This is the strong response: recognizing that a production dashboard needs both user-facing customization and developer-facing extensibility.

### Picks scope appropriately for 30 min (3/3)

The implementation includes:
- Widget registry with type definitions
- Instance management with localStorage persistence
- Native HTML5 drag-and-drop for reordering
- Add/remove UI with palette
- Customize mode toggle

Notably avoided: react-grid-layout, complex settings UI, multiple instances of same widget type. The drag-and-drop uses native HTML5 APIs rather than a library—lightweight and sufficient.

### Doesn't over-engineer (3/3)

No signs of over-engineering:
- Simple Map-based registry, no dependency injection
- No JSON schema validators or Zod
- No plugin lifecycle hooks
- localStorage with a versioned key (`v1`), no complex migration system
- Native drag-and-drop, no library

## Existing-Code Respect — 8/8

### Doesn't rewrite working widgets gratuitously (3/3)

The model made exactly one consistent change across all widgets: removed the `widget--stats`, `widget--latency`, etc. CSS classes, because grid span is now driven by the registry:

```tsx
// Before (original)
<div className="widget widget--latency">

// After (model)
<div className="widget">
```

This is a *consistent* refactor. The span is now applied via:
```tsx
style={{ gridColumn: `span ${def.span}` }}
```

All data-fetching patterns (useEffect + setInterval polling) were preserved exactly. This is exactly what the rubric wants: "refactors consistently, not haphazardly."

### Preserves the visual design (2/2)

Comparing `styles.css`:
- All CSS variables preserved (`--bg`, `--panel`, `--border`, etc.)
- All widget chrome styles preserved (`.widget`, `.widget-header`, `.widget-body`)
- Same 12-column grid with same gaps
- New styles are purely additive for customization UI (`.widget-slot`, `.drag-handle`, `.customize-bar`, etc.)

The visual design is intact.

### Migrates layout state somewhere reasonable (3/3)

```ts
const STORAGE_KEY = "ops-dashboard.layout.v1";
```

Uses localStorage (fine per rubric) with:
- Versioned key (`v1`)
- Validation on load (type guards, filters unknown widget IDs)
- De-duplication by key
- Graceful fallback to default layout on any error

This is textbook handling of persisted state.

## Frontend Craft — 4/4

**TypeScript discipline:** No `any` types. Proper type guards:
```ts
const valid = parsed.filter(
  (i): i is WidgetInstance =>
    !!i &&
    typeof (i as WidgetInstance).key === "string" &&
    ...
);
```

**Hook usage:** Correct effect dependencies (`[instances]`), `useCallback` for stable references, `useState` with initializer function (`useState<WidgetInstance[]>(loadLayout)`).

**No React footguns:**
- Keys are unique per instance (`inst.key`)
- No effect dependency bugs
- No infinite re-render patterns
- Drag state handled correctly with cleanup on `onDragEnd`

## Code Quality — 4/4

**File organization:**
```
src/widgets/
  types.ts      — WidgetDefinition interface
  registry.ts   — widget type catalog
  useLayout.ts  — layout state hook

src/components/
  Dashboard.tsx — main dashboard with customization UI
  widgets/      — individual widget components
```

**Adding the 6th widget type:**
1. Create `src/components/widgets/CpuWidget.tsx`
2. Add one line to `registry.ts`: `registerWidget({ id: "cpu", ... })`

That's genuinely 1 file to create + 1 line to add. The README documents this explicitly.

---

## Strong Signals Hit

| Signal | Present |
|--------|---------|
| Defines `WidgetDefinition` type with explicit fields | ✓ |
| One file lists all widget types (`widgets/registry.ts`) | ✓ |
| Distinguishes `WidgetType` from `WidgetInstance` | ✓ |
| Per-widget settings shape is generic | ✗ (no settings) |
| localStorage with versioned key | ✓ |
| Calls out user vs dev fork | ✓ (implements both) |
| Refactors consistently | ✓ |
| 6th widget is genuinely 1 file | ✓ |

## Summary

This is a strong implementation that demonstrates clear architectural thinking. The model:
- Recognized both interpretations of "pluggable" and implemented both
- Created clean abstractions (WidgetDefinition vs WidgetInstance)
- Centralized the widget catalog in one file
- Made only consistent refactors to existing code
- Used localStorage properly with versioning and validation
- Scoped appropriately for the time constraint

The only minor gap is the lack of a settings abstraction in the widget contract, which would cost a small refactor if per-widget settings are needed later. For the current requirements, this is the right call.
