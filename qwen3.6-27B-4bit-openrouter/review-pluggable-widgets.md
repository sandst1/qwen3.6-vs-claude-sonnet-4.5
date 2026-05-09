# Review: A/pluggable-widgets

## Score: 28 / 40

| Category | Max | Score |
|---|---|---|
| Architectural judgment | 14 | 11 |
| Ambiguity-handling | 10 | 5 |
| Existing-code respect | 8 | 7 |
| Frontend craft | 4 | 2 |
| Code quality | 4 | 3 |

---

## Architectural judgment — 11 / 14

### Widget contract — 5 / 6

The `WidgetDescriptor<TData>` interface is the centerpiece and it's well-designed:

```typescript
interface WidgetDescriptor<TData = unknown> {
  id: string;
  title: string;
  subtitle: string;
  gridColumnSpan: number;
  wrapperClass: string;
  Component: ComponentType<{ data: TData }>;
  fetchData: () => Promise<TData>;
  refreshIntervalMs: number;
}
```

The generic `TData` parameter gives type-safe data flow from `fetchData` through to `Component`. This is a strong signal — it captures the right shape for what a widget *is*.

Minor friction: `wrapperClass` bakes a CSS implementation detail into the type contract (e.g., `"widget--stats"`). This is a vestige of the original design leaking into the abstraction. More importantly, every widget file requires an `as ComponentType<{ data: T }>` cast when assigning `Component`, which signals the generic isn't flowing through cleanly.

No settings concept exists on the descriptor — no `defaultSettings`, no settings schema. For this scope that's arguably fine (see over-engineering below), but it means the contract isn't extensible for per-widget configuration.

### Registration pattern — 3 / 4

The `WidgetRegistry` class with a `Map<string, WidgetDescriptor>` is clean. Self-registration via module-level `registry.add(descriptor)` with side-effect imports in `App.tsx` works:

```typescript
// App.tsx
import "./components/widgets/StatsWidget";  // registers on import
import "./components/widgets/LatencyWidget";
// ...
```

However, the list of widget types lives in **two places**: the side-effect imports in `App.tsx` (which controls what's loaded) and `DEFAULT_IDS` in `DashboardGrid.tsx` (which controls the initial layout). A developer adding a 6th widget must update both. The registry answers "what types exist?" but `DEFAULT_IDS` separately answers "what shows by default?" — these should ideally be unified (e.g., `registry.getAll()` for the default layout, or a `defaultVisible` field on the descriptor).

Side-effect imports are also fragile in principle — a bundler could tree-shake them if it doesn't detect side effects, though Vite won't in practice.

### Type vs instance separation — 3 / 4

Clean separation exists: `WidgetDescriptor` is the catalog type, `WidgetInstance` is a placed widget with `instanceId` + `typeId`. Dashboard state is `WidgetInstance[]`. This is the right data model.

Two issues:
1. `WidgetInstance` has no per-instance settings — just `instanceId` and `typeId`. The type/instance split enables customization per placement, but none is actually possible.
2. `AddWidgetMenu` filters out already-used types (`!existingIds.includes(d.id)`), preventing multiple instances of the same type. This undermines the instance model — if you can only have one of each type, the `instanceId` distinction adds complexity without payoff.

---

## Ambiguity-handling — 5 / 10

### Names the user-vs-developer fork — 1 / 4

Silent pick. The implementation addresses *both* developer pluggability (registry, descriptor contract — a developer adds a widget type by writing one file and registering it) *and* user pluggability (add/remove/reorder widgets at runtime via DashboardGrid UI). But it never states which fork it picked or why. The README is unchanged from the original and still says "Five widgets in a 12-column CSS grid." No comments or docs explain the architectural choices.

This is the weakest area. The rubric explicitly rewards "stating the reasoning," and the implementation makes a reasonable choice but doesn't articulate it.

### Picks scope appropriately for 30 min — 2 / 3

The scope is ambitious: registry + type/instance types + `useWidgetData` hook + `WidgetShell` + `WidgetRenderer` + `DashboardGrid` with add/remove + drag-and-drop reorder + `AddWidgetMenu` dropdown UI. Most of this is delivered and functional.

The drag-and-drop implementation is where the scope stretches too far — it has implementation bugs (see Frontend craft), and the `onPause`/`onResume` callbacks are empty stubs, suggesting features were started but abandoned. A cleaner cut would have been add/remove without reordering, or acknowledging drag-and-drop as a stub.

### Doesn't over-engineer — 2 / 3

No JSON-schema validators, no Zod, no plugin lifecycle hooks. The registry class is appropriately scoped. The `useWidgetData` hook is a justified extraction (DRYs up five identical `useEffect` patterns). Good restraint here overall.

The drag-and-drop is the one area that pushes past what's useful — HTML5 drag-and-drop for widget reordering adds ~80 lines of event handling code with bugs, when the core value of the refactor is the registry/descriptor pattern.

---

## Existing-code respect — 7 / 8

### Doesn't rewrite working widgets gratuitously — 3 / 3

All five widgets were refactored consistently: each was split into a pure body component + a descriptor object, data fetching was extracted into `useWidgetData`, and the header/loading/wrapper chrome was extracted into `WidgetShell`. This is systematic — no widget was left half-refactored. The refactoring is justified by the pluggability goal.

### Preserves the visual design — 2 / 2

CSS variables are preserved verbatim. The original widget classes (`.widget--stats`, `.widget--latency`, etc.) and grid placements are retained. New CSS is additive — drag handles, remove buttons, and the "Add Widget" menu are new UI elements that don't disturb the existing chrome.

One minor loss: `ServicesWidget` subtitle changed from the dynamic `${services.length} tracked` to hardcoded `"6 tracked"`, because the subtitle is now a static field on the descriptor rather than derived from data at render time. This is a small expressiveness regression.

### Migrates layout state somewhere reasonable — 2 / 3

Layout state lives in-memory via `useState` in `DashboardGrid`. The rubric says in-memory is fine if honestly scoped, but there's no acknowledgment that state resets on refresh. For a 30-minute scope this is the right call — localStorage persistence would have added complexity — but a one-line comment would earn the point.

---

## Frontend craft — 2 / 4

### Conditional hook call (bug)

`WidgetRenderer` calls `useWidgetData` after an early return:

```typescript
export function WidgetRenderer({ typeId }: { typeId: string }) {
  const descriptor = registry.get(typeId);
  if (!descriptor) {
    return (...);  // early return
  }
  const data = useWidgetData(descriptor.fetchData, ...);  // hook after conditional
  // ...
}
```

This violates the Rules of Hooks — hooks must be called in the same order on every render. In practice this won't cause runtime issues because `descriptor` is always defined for valid typeIds (registered at import time), but it would be flagged by `eslint-plugin-react-hooks` and is a genuine footgun if a widget type is ever removed dynamically.

### Drag event handling (bug)

`DraggableWidget` sets `onDrag={onMoveEnd}`, but `onDrag` fires continuously during the drag operation, not at the end. This calls `setDragId(null)` repeatedly *during* dragging, which would break the reorder logic. The correct event is `onDrop` or using `onDragEnd` (which is already set separately, making this a redundant and conflicting handler).

### Positive notes

- `useWidgetData` is well-crafted: uses a `cancelled` flag for unmount safety, `useRef` for the fetch function to avoid stale closures, and proper cleanup.
- No `any` usage — the `as ComponentType` casts are the closest thing, and they're bounded.
- Dependencies and hook patterns are generally correct outside the conditional call.

---

## Code quality — 3 / 4

### File organization

Clean separation: `src/plugins/` holds the type system (`widget-types.ts`, `registry.ts`, `useWidgetData.ts`), `src/components/` holds the rendering infrastructure (`WidgetShell.tsx`, `DashboardGrid.tsx`), and `src/components/widgets/` holds individual widget definitions. This is well-organized and intuitive.

### The 6th widget experience

Adding a 6th widget requires:
1. Create `src/components/widgets/FooWidget.tsx` (body component + descriptor + `registry.add`)
2. Add `import "./components/widgets/FooWidget"` in `App.tsx`
3. Optionally add to `DEFAULT_IDS` in `DashboardGrid.tsx` if it should appear by default

That's 2–3 files. Not quite the "genuinely 1 file" strong signal, but close. The descriptor file itself is self-contained and readable — a developer can understand the contract by reading one existing widget file.

### Garbled text

`widget-types.ts` line 31 contains: `"ties a type to user定制的 layout state"` — mixed English and Chinese characters in the JSDoc comment. This is a minor quality issue (likely model artifact) but would be confusing to other developers.

### README not updated

The README still describes the original five-widget architecture and doesn't mention the registry, descriptors, or add/remove functionality. Documentation should reflect the new architecture.

---

## Strong vs weak signals summary

| Rubric signal | Assessment |
|---|---|
| Defines `WidgetDescriptor` type with explicit fields | **Strong** — generic `TData`, explicit contract |
| One file lists all widget types | **Mixed** — registry exists, but `DEFAULT_IDS` is a second list |
| Distinguishes `WidgetType` from `WidgetInstance` | **Strong** — clean separation in types, somewhat undermined by AddWidgetMenu filter |
| Per-widget settings shape is generic | **Absent** — no settings concept |
| Layout persistence | **N/A** — in-memory, appropriate for scope |
| Calls out which fork it picked and why | **Weak** — silent pick |
| Refactors consistently | **Strong** — all five widgets refactored the same way |
| 6th widget is genuinely 1 file | **Mixed** — 1 file for the widget, but 1–2 more files need touching |
