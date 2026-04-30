# Review: Pluggable Widgets Implementation

**Model:** qwen3.6-35B-A3B-4bit  
**Total Score:** 28/40

---

## Architectural Judgment — 10/14

### Designs a Widget contract — 4/6

The implementation defines a `WidgetDef` interface in `types.ts`:

```typescript
export interface WidgetDef {
  key: string;
  title: string;
  subtitle: string;
  span: number;
  component: React.ComponentType;
}
```

This captures the basic shape needed for rendering and layout, but lacks:
- Default settings / per-widget configuration
- Settings schema for potential UI generation
- Description field for the picker

The contract is functional but minimal — it enables add/remove/reorder but doesn't lay groundwork for per-widget settings that "pluggable" often implies.

### Picks a registration pattern — 4/4

Strong execution here. The registry pattern is clear and centralized:

- `WidgetRegistry` class in `types.ts` manages widget definitions
- `BUILTIN_WIDGETS` array in `registry.ts` is the single source of truth
- `registerAll()` populates the registry at startup

A developer adding a 6th widget type edits exactly one file (`registry.ts`), adding one entry to the array. This is the ideal outcome.

### Separates "widget type" from "widget instance" — 2/4

This is the architectural weak point. The implementation conflates types and instances:

```typescript
export interface LayoutState {
  order: string[];   // Widget type keys
  hidden: string[];  // Widget type keys
}
```

The dashboard state is essentially "which widget types are visible, in what order" — there's no concept of widget *instances*. Consequences:

- Cannot have two instances of the same widget type (e.g., two latency widgets with different time ranges)
- No per-instance settings or configuration
- No instance-specific IDs

This is the "most common architectural failure mode" called out in the rubric. The `WidgetDef` serves as both the catalog entry and the placed item.

---

## Ambiguity-handling — 5/10

### Names the user-vs-developer fork — 1/4

The implementation does both user customization (picker, reorder, localStorage) and developer extensibility (registry pattern), but there's no explicit acknowledgment of this choice. No comment, no README section, no reasoning about which fork was prioritized.

The code *silently* picked the user-customization reading as primary, evidenced by the UI polish on the picker and drag-drop, while keeping developer extensibility as a pleasant side effect of the registry pattern.

### Picks scope appropriately for 30 min — 2/3

Good scope control:
- ✓ Widget picker with show/hide toggles
- ✓ Drag-and-drop reordering via native HTML5 drag events
- ✓ localStorage persistence with migration logic
- ✓ Reset button
- ✗ No complex grid resizing or react-grid-layout

The drag-drop implementation with the timer-based reorder in `WidgetList` adds some complexity that might not have been necessary — simple up/down buttons would have been faster to implement and arguably better UX.

### Doesn't over-engineer — 2/3

Mostly restrained, but the `WidgetRegistry` class has unused capability:

```typescript
private listeners = new Set<ChangeListener>();
onChange(listener: ChangeListener): () => void { ... }
private notify(): void { ... }
```

This observer pattern is never used — the App component just reads from the registry directly. The registry didn't need to be a class with change listeners; a plain object or simple functions would suffice. Minor over-engineering.

---

## Existing-code Respect — 8/8

### Doesn't rewrite working widgets gratuitously — 3/3

The five existing widget components (`StatsWidget`, `LatencyWidget`, `ErrorsWidget`, `ActivityWidget`, `ServicesWidget`) are **unchanged** from the original. Same data-fetching pattern with `useEffect` + interval, same internal structure. This is the correct call — the widgets worked fine, and making them "pluggable" didn't require touching their internals.

### Preserves the visual design — 2/2

- All CSS variables preserved (`:root` block identical)
- Widget chrome (`.widget`, `.widget-header`, etc.) unchanged
- Same 12-column grid layout
- Grid span moved from CSS classes to inline styles — functionally equivalent

The new UI elements (picker panel, settings panel, widget list) use the same visual language with the existing variables.

### Migrates layout state somewhere reasonable — 3/3

Uses localStorage with key `"dashboard-layout"`:

```typescript
export function loadLayout(): LayoutState { ... }
export function saveLayout(layout: LayoutState): void { ... }
export function mergeWithDefaults(stored: LayoutState, availableKeys: string[]): LayoutState { ... }
```

The `mergeWithDefaults` function handles the case where new widgets are added to the codebase — they'll appear in the layout automatically. No versioned key, but the migration logic is robust enough.

---

## Frontend Craft — 3/4

- **TypeScript discipline:** No `any` types visible. Proper typing throughout.
- **Hook usage:** `useState`, `useCallback`, `useMemo` used appropriately. The `useCallback` wrappers prevent unnecessary re-renders.
- **React patterns:** Keys are used correctly in lists. Conditional rendering is clean.

Minor issue: The `WidgetList` drag-drop implementation uses a timer-based approach with `useRef` to debounce reorders. This works but is slightly unusual — the standard pattern would be to reorder `onDrop` rather than during `onDragOver`. Not a footgun, but adds complexity.

---

## Code Quality — 3/4

**File organization:**
```
src/
  widgets/
    types.ts        # WidgetDef, WidgetRegistry
    registry.ts     # BUILTIN_WIDGETS, registerAll
    storage.ts      # LayoutState, load/save
    WidgetRenderer.tsx
  components/widgets/
    StatsWidget.tsx (unchanged)
    ...
    WidgetPicker.tsx (new)
    WidgetList.tsx (new)
```

Clear separation. A new developer can understand the system by reading `types.ts` → `registry.ts` → `App.tsx`.

**Adding the 6th widget:** Add one entry to `BUILTIN_WIDGETS` array. One file, one edit. This is the target.

**Minor deduction:** The `WidgetRenderer` is a 9-line component that does almost nothing — could have been inlined in `App.tsx`. Not wrong, just extra indirection.

---

## Strong vs Weak Signals Summary

| Signal | Status |
|--------|--------|
| Defines `WidgetDef` type with explicit fields | ✓ Present |
| One file lists all widget types | ✓ `registry.ts` |
| Distinguishes type from instance | ✗ Conflated |
| Per-widget settings shape is generic | ✗ No settings |
| localStorage with versioned key | ⚠ localStorage, no version |
| Calls out which fork and why | ✗ Silent |
| Refactors data-fetching consistently | ✓ Didn't refactor (correct) |
| 6th widget is 1-file add | ✓ Yes |

---

## Summary

A solid implementation that nails the registration pattern and code organization, preserves existing code well, and delivers functional user-facing features. The main gap is the type/instance conflation — the system can show/hide/reorder widget *types*, but can't manage multiple *instances* of the same type with different configurations. This limits the "pluggable" architecture's future utility.

The silent fork between user customization and developer extensibility is a missed opportunity to demonstrate architectural reasoning, even if the actual choice was reasonable.
