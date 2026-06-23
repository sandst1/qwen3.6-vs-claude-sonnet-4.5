# Review: pluggable-widgets — Gemini 3.7 Flash IQ4_XS

## Summary

The model delivers a functional pluggable widget system with a registry pattern,
a `WidgetDefinition` type, user-facing add/remove/reorder controls persisted to
localStorage, and a demonstration sixth widget (ThroughputWidget). The
architecture is sound at a surface level but shallow — no per-instance settings,
no type/instance separation, and no explicit articulation of the design
trade-offs. The existing code is treated with good care.

---

## Architectural Judgment — 9 / 14

### Designs a Widget contract — 3 / 6

A `WidgetDefinition` interface exists:

```typescript
interface WidgetDefinition {
  id: string;
  title: string;
  subtitle?: string;
  gridSpan: number;
  pollInterval: number;
  component: ComponentType;
}
```

This captures the shape at a basic level (id, title, layout size, render
component). However:

- **No settings generic** — there's no `settings: TSettings` or
  `defaultSettings`. Per-widget configuration is not part of the contract.
- **`pollInterval` is dead weight** — it's declared in every definition but
  never consumed by the framework. Each widget still manages its own polling
  internally via `setInterval`. This is metadata that looks useful but isn't
  wired up.
- **No settings UI story** — no `SettingsComponent` or schema for a future
  settings panel.

The contract is enough to register and render widgets but doesn't enable real
per-instance configurability.

### Picks a registration pattern — 4 / 4

Clear and canonical. A singleton `WidgetRegistry` class in
`src/widgets/registry.ts` backed by a `Map`. One file (`src/widgets/index.ts`)
imports all widget definitions and registers them. "Where is the list of widget
types?" has exactly one answer.

### Separates "widget type" from "widget instance" — 2 / 4

Partial separation only:

- **Types** live in the registry (the catalog of available widgets).
- **Active set** is tracked in `DashboardConfig.widgetIds: string[]`.

But the "instances" are really just type IDs — there's no per-instance ID,
no per-instance settings, and you **cannot** place two widgets of the same type
on the dashboard (the add-widget dropdown filters out already-active type IDs).
This conflates "which types are visible" with "which instances are placed,"
which is the common failure mode the rubric flags.

---

## Ambiguity-Handling — 6 / 10

### Names the user-vs-developer fork — 1 / 4

The implementation delivers *both* concerns (registry for developers,
add/remove/reorder UI for users), which shows some awareness of the dual
reading. But there's no written rationale anywhere — no README update, no code
comment, no summary explaining "I interpreted 'pluggable' as both X and Y."
This is a silent pick.

### Picks scope appropriately for 30 min — 3 / 3

Scope is well-managed:

- Registry + widget definitions ✓
- Dashboard component with add/remove/reorder ✓
- localStorage persistence ✓
- Demo 6th widget to prove the pattern ✓
- No drag-and-drop library, no react-grid-layout, no complex settings UI

### Doesn't over-engineer — 2 / 3

Mostly lean — no zod, no JSON schema validators, no plugin lifecycle hooks.
Minor deductions:

- `pollInterval` is declared in every definition but consumed by nothing
- Class-based `WidgetRegistry` with `has()`, `ids` getter, etc. is slightly more
  ceremony than a plain object/array would be for 6 widgets, though it's not
  egregious

---

## Existing-Code Respect — 7 / 8

### Doesn't rewrite working widgets gratuitously — 3 / 3

Excellent. Each widget file is preserved nearly verbatim — the model only
appends a `widgetDefinition` export at the bottom. Internal data-fetching,
polling, and rendering logic is untouched. Consistent treatment across all
widgets.

### Preserves the visual design — 2 / 2

Same CSS variables, same 12-column grid, same widget chrome classes. New CSS for
`.widget-shell`, `.widget-controls`, and `.widget-add-zone` uses the same design
language (border color, radius, muted text, hover states). The original
`.widget--stats` etc. grid-span classes are now superseded by inline
`gridColumn` in `WidgetShell`, making them dead CSS, but visually nothing
changes.

### Migrates layout state somewhere reasonable — 2 / 3

localStorage with key `"dashboard-config"` — reads on init, writes on change,
falls back to a sensible default. Good. Deduction for:

- No versioned storage key (what happens when the config shape evolves?)
- No migration or validation beyond a try/catch on `JSON.parse`

---

## Frontend Craft — 3 / 4

- TypeScript throughout, no `any` usage visible
- `useCallback` and `useEffect` used correctly in `useDashboardConfig`
- React keys derived from widget IDs (stable, unique within the active set)
- `ComponentType` import from React is the right abstraction for the registry
- Minor concern: using `as const` on widget definitions while the registry
  expects `WidgetDefinition` could create subtle type friction (works in
  practice due to structural typing, but `satisfies WidgetDefinition` would be
  more explicit)
- The `pollInterval` in definitions is never consumed — a future developer might
  wonder why it exists

---

## Code Quality — 2 / 4

**Good:**

- File organization is logical and navigable
  (`widgets/types.ts`, `widgets/registry.ts`, `widgets/index.ts`,
  `hooks/useDashboardConfig.ts`, `components/Dashboard.tsx`,
  `components/WidgetShell.tsx`)
- Naming is clear and consistent
- The ThroughputWidget serves as documentation-by-example for how to add a new
  widget

**Gaps:**

- **README not updated** — still describes the old 5-widget static layout with
  no mention of the pluggable system, the registry, or how to add a new widget
- Adding a 6th widget requires editing 2 files minimum (create widget file +
  register in `widgets/index.ts`), plus `api.ts` if a new data source is needed.
  Close to "one file" but not there
- No inline documentation of the design — no doc comments on `WidgetDefinition`
  explaining what each field is for

---

## Total Score: 27 / 40

| Dimension | Score | Max |
|-----------|-------|-----|
| Architectural judgment | 9 | 14 |
| Ambiguity-handling | 6 | 10 |
| Existing-code respect | 7 | 8 |
| Frontend craft | 3 | 4 |
| Code quality | 2 | 4 |
| **Total** | **27** | **40** |

---

## Strong / Weak Signals

| Signal | Assessment |
|--------|-----------|
| Defines `WidgetDefinition` type with explicit fields | ✓ Yes — though shallow |
| One file lists all widget types (`widgets/registry.ts`) | ✓ Yes — canonical registry |
| Distinguishes WidgetType from WidgetInstance | ✗ Partial — no real instances |
| Per-widget settings shape is generic | ✗ No settings at all |
| localStorage persistence with versioned key | ✗ Persists, but no version key |
| Calls out which fork (user vs dev) it picked and why | ✗ Silent pick |
| Refactors data-fetching consistently or not at all | ✓ Doesn't refactor at all (good) |
| The 6th widget type is genuinely 1 file | ~Close — 2 files minimum |

---

## Qualitative Notes

The model's biggest strength is restraint with existing code — the minimal-touch
approach of appending `widgetDefinition` exports rather than rewriting widget
internals is the right call. The registry pattern is cleanly executed and the
localStorage persistence hook is well-written.

The biggest weakness is lack of depth in the abstraction. The `WidgetDefinition`
looks like a contract but doesn't actually enable the framework to do anything
the widgets don't already do themselves (polling is still self-managed, settings
don't exist). The type/instance conflation means you can't have two of the same
widget, which limits "user customizability" in practice. The complete absence of
written rationale (no README update, no design comments) means a future developer
gets the *what* but not the *why*.

## Would I merge this PR?

**Conditional yes** — with a request to update the README, remove or wire up the
unused `pollInterval` field, and add a brief design comment explaining the
type-vs-instance limitation. The code works, is clean, and doesn't break
anything. It's a solid 70% solution that would need a follow-up for real
per-instance support.
