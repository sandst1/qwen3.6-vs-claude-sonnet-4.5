# Review: pluggable-widgets (amodel)

**Score: 35.5/40**

---

## Architectural judgment — 13/14

### Designs a Widget contract — 5/6

Strong implementation. The `WidgetType` interface captures the essential shape:

```5:21:amodel/pluggable-widgets/src/lib/widget-types.ts
export interface WidgetType {
  /** Unique identifier (e.g. "stats", "latency") */
  id: string;
  /** Display name shown in the picker and widget header */
  title: string;
  /** Optional subtitle shown next to the title (e.g. "last 5 min") */
  subtitle?: string;
  /** The React component to render (body content only — no outer shell) */
  component: ComponentType;
  /** How many of the 12 grid columns this widget spans (1–12) */
  gridColumnSpan: number;
}
```

Minor deduction: No generic settings shape (`settings: TSettings`). While not strictly required by the prompt, a fully "pluggable" system would anticipate per-widget configuration. The current contract is pragmatic but doesn't leave room for widgets with custom settings.

### Picks a registration pattern — 4/4

Exemplary. Single registry file with clean API:

```1:14:amodel/pluggable-widgets/src/lib/widget-registry.ts
import type { WidgetType } from "./widget-types";

const registry = new Map<string, WidgetType>();

export function registerWidget(widget: WidgetType): void {
  if (registry.has(widget.id)) {
    throw new Error(`Widget "${widget.id}" is already registered`);
  }
  registry.set(widget.id, widget);
}
```

Each widget self-registers at module scope — no central "list of widgets" file that must be updated. This is the strong signal pattern from the rubric.

### Separates "widget type" from "widget instance" — 4/4

Perfect separation:

```23:36:amodel/pluggable-widgets/src/lib/widget-types.ts
/**
 * A single widget instance placed on the dashboard.
 * The `uid` is a runtime-generated unique ID so the same widget type
 * can appear multiple times if needed.
 */
export interface WidgetInstance {
  uid: string;
  typeId: string;
}

/** Full dashboard layout saved to / loaded from localStorage */
export interface DashboardLayout {
  widgets: WidgetInstance[];
}
```

Dashboard state holds instances, registry holds types. The architecture correctly anticipates multiple instances of the same widget type.

---

## Ambiguity-handling — 8.5/10

### Names the user-vs-developer fork — 2.5/4

The implementation delivers *both* forks:
- **Developer pluggability**: New widget = 1 file + 1 import
- **User customization**: Add/remove/reorder via UI, persisted to localStorage

However, there's no explicit documentation stating which interpretation of "pluggable" was prioritized or why both were included. The rubric rewards stated reasoning — silent picks lose points.

### Picks scope appropriately for 30 min — 3/3

Appropriate scoping:
- Simple up/down reordering instead of drag-and-drop
- No react-grid-layout dependency
- localStorage persistence (not inventing a backend)
- No settings UI beyond add/remove

### Doesn't over-engineer — 3/3

Clean restraint:
- No zod or JSON-schema validators
- No plugin lifecycle hooks
- Simple `Map<string, WidgetType>` registry
- No abstracted "WidgetLoader" or "WidgetManager" classes

---

## Existing-code respect — 7/8

### Doesn't rewrite working widgets gratuitously — 3/3

Data-fetching pattern preserved verbatim across all widgets. The only structural change: widgets now render just their body content, delegating the chrome to `WidgetFrame`:

**Original:**
```27:32:original/pluggable-widgets/src/components/widgets/LatencyWidget.tsx
  return (
    <div className="widget widget--latency">
      <div className="widget-header">
        <span className="widget-title">Request latency</span>
        <span className="widget-subtitle">last 2h, ms</span>
      </div>
```

**Refactored:**
```27:29:amodel/pluggable-widgets/src/components/widgets/LatencyWidget.tsx
  return (
    <div className="widget-body">
      {data == null ? (
```

Consistent refactoring across all 5 widgets.

### Preserves the visual design — 2/2

CSS variables untouched. New widget-controls and picker styles follow the same design language (colors, border-radius, font-sizes).

### Migrates layout state somewhere reasonable — 2/3

localStorage with sensible key and fallback:

```22:34:amodel/pluggable-widgets/src/lib/layout-store.ts
export function loadLayout(): DashboardLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardLayout;
      if (Array.isArray(parsed.widgets)) return parsed;
    }
  } catch {
    // corrupted data — fall through to defaults
  }
  return DEFAULT_LAYOUT;
}
```

Minor deduction: No versioned storage key (`ops-dashboard-layout-v1`). If the schema changes in a future iteration, there's no migration path — corrupted data just falls back to defaults. Acceptable for a 30-min exercise but noted.

---

## Frontend craft — 4/4

- No `any` types
- Clean TypeScript: `WidgetType`, `WidgetInstance`, `DashboardLayout` fully typed
- Proper hook usage with cleanup (`clearInterval` in `useEffect` return)
- Correct `key` usage (`instance.uid` for list rendering)
- No effect dependency bugs
- Accessible controls (`aria-label`, `aria-expanded`, `role="listbox"`)

---

## Code quality — 3/4

### File organization

Clean separation:
- `lib/widget-types.ts` — type definitions
- `lib/widget-registry.ts` — registration logic  
- `lib/layout-store.ts` — persistence
- `components/WidgetFrame.tsx` — wrapper rendering
- `components/WidgetPicker.tsx` — add widget UI
- `components/widgets/*.tsx` — individual widgets

### Adding the 6th widget

Requires **2 files**:
1. Create `widgets/NewWidget.tsx` with component + `registerWidget()` call
2. Add import in `App.tsx`

The import step is necessary because JavaScript only executes side effects when a module is loaded. This could be eliminated with a glob import pattern or explicit registry file, but would add complexity. Acceptable trade-off.

Minor deduction for the 2-file requirement vs the rubric's "genuinely 1 file" ideal.

---

## Strong signals present

| Signal | Present |
|--------|---------|
| Defines `WidgetType` with explicit fields | ✓ |
| One file lists all widget types (registry.ts) | ✓ |
| Distinguishes `WidgetType` from `WidgetInstance` | ✓ |
| Uses `localStorage` for persistence | ✓ |
| Refactors data-fetching consistently | ✓ |
| 6th widget type is 1-2 files | ✓ (2 files) |

## Weak signals present

| Signal | Present |
|--------|---------|
| Silent pick of user vs dev fork | ✓ (no stated reasoning) |
| No versioned localStorage key | ✓ |

---

## Summary

A solid implementation that gets the core abstractions right. The `WidgetType`/`WidgetInstance` separation and self-registering widget pattern are exactly what the rubric rewards. User customization (add/remove/reorder) is functional and persisted. The main gaps: no explicit reasoning about the user-vs-developer ambiguity, no settings generics, and the 2-file requirement for new widgets. Overall, demonstrates strong architectural judgment within reasonable scope.
