# Review: B/pluggable-widgets

## Score: 32 / 40

---

## Architectural judgment — 13 / 14

### Widget contract — 5 / 6

B defines a clear `WidgetDefinition` interface in `widgetRegistry.tsx`:

```typescript
export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  component: ComponentType;
  defaultSpan: number;
  category: string;
}
```

This is a well-shaped contract that captures the essential properties a widget type needs. The `component` field correctly uses `ComponentType`, and metadata fields (`name`, `description`, `category`) support the customization UI cleanly.

What's missing is any notion of per-widget settings. The component type is a bare `ComponentType` with no props — there's no `settings: TSettings` generic, no default-settings factory, no settings schema. This means the contract can't express "this widget type accepts these configuration knobs." For 5 internal widgets that's fine, but the rubric rewards a contract that anticipates per-instance configurability. A `WidgetDefinition<TSettings = void>` with `defaultSettings` and a settings component would have been the full mark.

### Registration pattern — 4 / 4

Single `widgetRegistry` object in one file (`widgetRegistry.tsx`). This is the one obvious place to answer "what widget types exist?" The `getWidgetsByCategory()` helper and `defaultWidgetLayout` array live in the same file, keeping the catalog self-contained. No widget-type information leaks into `App.tsx` or the individual widget files. Clean.

### Type vs. instance separation — 4 / 4

`WidgetDefinition` is the catalog type; `WidgetInstance` is the placed instance:

```typescript
export interface WidgetInstance {
  instanceId: string;
  widgetId: string;
  span?: number;
}
```

The dashboard state (`useDashboardConfig`) operates on `WidgetInstance[]`. The registry is the catalog of available types. This separation is correct and clearly delineated — you can add multiple instances of the same type, each gets its own `instanceId`, and the `widgetId` links back to the definition. This is the right structure.

---

## Ambiguity-handling — 6 / 10

### Names the user-vs-developer fork — 2 / 4

B implemented *both* forks: developer extensibility (registry pattern, 2-step guide for adding a widget type) and end-user configurability (add/remove/reorder at runtime, localStorage persistence). This is arguably the right call, but B never explicitly discusses the ambiguity. No comment, README section, or commit message says "we interpreted 'pluggable' as X because Y" or "there are two readings of this requirement and we chose to support both." The WIDGET_GUIDE and EXAMPLE_NEW_WIDGET docs talk about developer workflow and user workflow separately but never frame it as a deliberate architectural decision between competing interpretations. Silent pick.

### Picks scope appropriately for 30 min — 2 / 3

The feature set is ambitious: registry, type/instance separation, localStorage persistence, customize panel with category tabs, native drag-and-drop reordering, widget wrapper with controls, plus two documentation files totaling ~360 lines of markdown. Everything works, but the two extensive doc files (`WIDGET_GUIDE.md` at 222 lines and `EXAMPLE_NEW_WIDGET.md` at 143 lines) feel like padding rather than substance that shipped within a tight timebox. The actual code scope is reasonable; the docs push it slightly over.

### Doesn't over-engineer — 2 / 3

No zod, no JSON-schema validators, no plugin lifecycle hooks — good. Category tabs in the customize panel for 5 widgets across 4 categories (metrics, alerts, events, status) is slightly premature UI. More notably, there's dead code in `CustomizePanel.tsx`:

```typescript
const canAdd = !activeWidgetIds.has(widget.id) || true; // Always true
disabled={!canAdd && false} // Always false
```

This looks like an abandoned attempt to limit single-instance widgets, left in with `|| true` / `&& false` band-aids. It's not over-engineering per se, but it's vestigial complexity that shouldn't have shipped.

---

## Existing-code respect — 7 / 8

### Doesn't rewrite working widgets gratuitously — 3 / 3

All five widget components (`StatsWidget`, `LatencyWidget`, `ErrorsWidget`, `ActivityWidget`, `ServicesWidget`) are byte-for-byte identical to the originals. The data-fetching pattern (useEffect + setInterval per widget) is preserved exactly. `api.ts` is unchanged. This is perfect restraint — the existing widgets work, and B correctly left them alone rather than refactoring them to accept props or conform to a new data-fetching abstraction.

### Preserves the visual design — 2 / 2

All original CSS is preserved verbatim. New CSS is purely additive (header actions, widget wrapper controls, customize panel overlay). Same CSS variables used throughout the new styles. The grid placement now happens via `WidgetWrapper`'s inline `style={{ gridColumn: \`span ${span}\` }}` rather than the original `.widget--stats` class rules, but the values match for the default layout and the visual output is identical. The original `.widget--*` grid rules are now effectively dead CSS (the `.widget` element is no longer a direct grid child), but this causes no visual regression.

### Migrates layout state somewhere reasonable — 2 / 3

localStorage with key `"dashboard-config"` — reads on mount, saves on every mutation, falls back to `defaultWidgetLayout` on parse errors. This is a good choice. Missing: the storage key is not versioned. If the `WidgetInstance` shape changes (e.g., adding a `settings` field), there's no migration story. A `"dashboard-config-v1"` key with a version check would have been the full mark.

---

## Frontend craft — 3 / 4

TypeScript is clean throughout — no `any` types, all interfaces are properly defined, generics are used appropriately (`delay<T>`, `ComponentType`). Hook usage is reasonable: `useDashboardConfig` encapsulates the persistence logic well, and `saveConfig` correctly takes the new state as a parameter rather than reading from stale closure state.

The HTML5 drag-and-drop implementation is functional but basic — no visual drag preview, no drop position indicator. The drag-and-drop is applied to the entire `widget-container` div but visually appears to be initiated from the `drag-handle` button, which is slightly misleading (the actual `draggable` is the container, not the handle).

The dead code in `CustomizePanel.tsx` (`|| true`, `&& false`) is the main blemish — it's logically inert code that made it into the final output and suggests incomplete editing.

No effect dependency bugs, no infinite re-render risks, keys are properly unique (`instanceId`).

---

## Code quality — 3 / 4

File organization is logical:
- `widgetRegistry.tsx` — types + catalog + default layout
- `hooks/useDashboardConfig.ts` — persistence logic
- `components/WidgetWrapper.tsx` — render wrapper with controls
- `components/CustomizePanel.tsx` — add-widget UI
- `components/widgets/*` — individual widget components (untouched)

Naming is clear and consistent. A new developer adding the 6th widget type needs to: (1) create a component file, (2) add an entry to `widgetRegistry`. That's a 2-file touch, but only the registry needs reading to understand the pattern — genuinely close to "one file to read." The WIDGET_GUIDE and EXAMPLE_NEW_WIDGET docs make this even more discoverable, though their length is disproportionate to the codebase size.

Minor: the `id` field in `WidgetDefinition` is redundant with the registry object key (both are e.g. `"stats"`). This creates a consistency invariant that isn't enforced.

---

## Summary

| Criterion | Score | Max |
| --- | --- | --- |
| Widget contract | 5 | 6 |
| Registration pattern | 4 | 4 |
| Type vs. instance separation | 4 | 4 |
| Names the user-vs-developer fork | 2 | 4 |
| Picks scope for 30 min | 2 | 3 |
| Doesn't over-engineer | 2 | 3 |
| Doesn't rewrite gratuitously | 3 | 3 |
| Preserves visual design | 2 | 2 |
| Layout state migration | 2 | 3 |
| Frontend craft | 3 | 4 |
| Code quality | 3 | 4 |
| **Total** | **32** | **40** |

### Strengths

- Clean type/instance separation with `WidgetDefinition` and `WidgetInstance`
- Single-file registry with no leaking of widget-type knowledge into the app shell
- Perfect existing-code preservation — all 5 widgets and the API layer untouched
- Functional end-to-end: user-facing customization with persistence actually works
- The 6th widget is genuinely easy to add

### Weaknesses

- Never explicitly discusses the "pluggable for whom?" ambiguity
- No per-widget settings contract (`ComponentType` with no props/generics)
- Dead code in `CustomizePanel` (`|| true`, `&& false`) is sloppy
- Unversioned localStorage key — no migration path
- Documentation volume disproportionate to implementation scope
