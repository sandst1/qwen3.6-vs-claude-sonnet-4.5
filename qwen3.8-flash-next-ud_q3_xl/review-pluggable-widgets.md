# Review: Pluggable Widgets Implementation

**Model:** qwen3.8-flash-next-ud_q3_xl  
**Task:** Task 2 — Make the dashboard widgets pluggable  
**Total Score: 38/40**

---

## Scoring Breakdown

### Architectural Judgment — 14/14 pts

#### Designs a Widget contract — 6/6

The implementation defines a clear, well-structured `WidgetPlugin` interface in `src/plugins/types.ts`:

```typescript
export interface WidgetPlugin {
  id: string;                    // Stable, namespaced (e.g., "core.latency")
  title: string;                 // Card header
  subtitle?: string;             // Optional header note
  description: string;           // Shown in catalog
  defaultSpan: number;           // Initial grid width
  allowedSpans?: number[];       // User-selectable widths
  component: ComponentType<WidgetProps>;  // The widget body
}
```

Widget components receive `WidgetProps` with `instanceId` and `span`, allowing per-instance state and responsive behavior. The contract correctly separates concerns: widgets only render their body; the shell (`WidgetFrame`) handles all chrome, headers, and customization controls.

This is a textbook widget contract design.

#### Picks a registration pattern — 4/4

The registry pattern is clean and centralized:

- `WidgetRegistry` class in `src/plugins/registry.ts` with `register()`, `get()`, `list()` methods
- Single registration point in `src/plugins/index.ts`:

```typescript
const coreWidgets = [stats, latency, errors, activity, services];
for (const widget of coreWidgets) {
  registry.register(widget);
}
```

The README explicitly documents: "To add a new widget: create `src/plugins/core/<name>.tsx` ... import it here and add it to this array." One obvious place answers "where is the list of available widget types?"

#### Separates "widget type" from "widget instance" — 4/4

Clear separation between:

- **`WidgetPlugin`** (catalog entry / type definition): what widgets *can* exist
- **`WidgetInstance`** (layout entry): `{ id, type, span? }` — what widgets *do* exist on the user's dashboard

Each instance gets a unique `id` generated via `newInstanceUid()`, allowing the same widget type to appear multiple times with independent state. The layout tracks instances; the registry holds types. This is exactly the right abstraction.

---

### Ambiguity-handling — 8/10 pts

#### Names the user-vs-developer fork — 2/4

The prompt is ambiguous: "pluggable" could mean:

1. **End-user extensibility**: drag-and-drop, layout persistence, add/remove widgets
2. **Developer extensibility**: clean Widget API/registry so adding new types is mechanical

The implementation delivers *both*, which is impressive. However, **there's no explicit acknowledgment of this fork** in the README or code comments. The model didn't call out the ambiguity — it just solved both problems without stating which it prioritized or why.

Strong implementations would say something like: "Pluggable has two readings — developer-side (easy to add new widget types) and user-side (dashboard customization). We're doing both, with developer extensibility as the foundation."

The silent pick is a weak signal, even though the outcome is good.

#### Picks scope appropriately for 30 min — 3/3

The scope is ambitious but achievable:
- Full add/remove/reorder/resize functionality
- Drag-and-drop reordering (native HTML5, no react-grid-layout)
- localStorage persistence with version migration
- Catalog drawer for adding widgets
- All 5 widgets migrated to plugin pattern

No external dependencies were added for customization (just native browser APIs). The implementation is complete and cohesive, not half-finished.

#### Doesn't over-engineer — 3/3

Refreshingly minimal:
- No JSON-schema runtime validators
- No zod validation
- No plugin lifecycle hooks
- Simple localStorage with a version key
- No widget-specific settings schemas (just `span`)

The implementation does exactly what's useful and nothing more.

---

### Existing-code Respect — 8/8 pts

#### Doesn't rewrite working widgets gratuitously — 3/3

All 5 widgets were refactored **consistently** to the plugin pattern:
- Each exports a `WidgetPlugin` default
- Data fetching moved to shared `usePolling` hook
- Same fetch functions from `api.ts` (unchanged)
- Rendering logic preserved

The refactor is uniform — not "refactor one widget, leave three alone."

#### Preserves the visual design — 2/2

- All CSS variables preserved (`--bg`, `--panel`, `--accent`, etc.)
- Same widget card chrome (header, title, subtitle, body)
- Same grid feel (12-column)
- New styles added additively for controls, catalog drawer, customize mode

The dashboard still looks and feels the same when not customizing.

#### Migrates layout state somewhere reasonable — 3/3

Layout persisted to `localStorage` with:
- Versioned key: `ops-dashboard.layout.v1`
- Version field in the layout object for future migrations
- Invalid widget types silently dropped on load
- Corrupt/missing data falls back to default layout

This is exactly the right approach for an internal tool.

---

### Frontend Craft — 4/4 pts

**TypeScript discipline:**
- No `any` types anywhere
- Proper generics: `usePolling<T>`, `ComponentType<WidgetProps>`
- Clean type imports/exports

**Hook usage:**
- `usePolling` has proper cleanup (`cancelled` flag, `clearInterval`)
- `useDashboardLayout` correctly wraps state with `useCallback` for stable references
- Effect dependencies are correct

**No React footguns:**
- Keys properly set on all list items
- Cleanup in all effects
- No infinite re-render traps
- Proper ref usage for drag state

---

### Code Quality — 4/4 pts

**Clarity and naming:**
- `WidgetPlugin` vs `WidgetInstance` — clear naming
- `allowedSpans()` helper documents its purpose
- File names match their contents

**File organization:**
```
src/
  plugins/
    types.ts          # Contract
    registry.ts       # Registration
    index.ts          # Single registration point
    usePolling.ts     # Shared hook
    core/             # Built-in widgets
  dashboard/
    layout.ts         # Model + persistence
    useDashboardLayout.ts
    WidgetFrame.tsx   # Card chrome
    DashboardGrid.tsx
    WidgetCatalog.tsx
```

**Adding the 6th widget type:**
1. Create `src/plugins/core/thing.tsx` (one file)
2. Add one line to `src/plugins/index.ts`

That's it. No changes to App, grid, CSS, or anywhere else. This passes the "genuinely 1 file" test.

**Documentation:**
The README is comprehensive:
- Architecture overview
- Key contracts explained
- Step-by-step guide for adding widgets
- Customization UX documented

---

## Strong Signals Observed

| Signal | Present? |
|--------|----------|
| Defines `Widget`/`WidgetDefinition` type with explicit fields | ✅ |
| One file lists all widget types (`plugins/index.ts`) | ✅ |
| Distinguishes `WidgetType` (catalog) from `WidgetInstance` (placed) | ✅ |
| Layout persists with `localStorage` with versioned key | ✅ |
| Refactors data-fetching consistently across all widgets | ✅ |
| The 6th widget type is genuinely 1 file | ✅ |
| Calls out which fork (user vs dev) it picked and why | ❌ |

---

## Qualitative Notes

**What impressed me:**
- The model tackled both user-facing and developer-facing extensibility, and did both well
- Clean separation of concerns throughout: registry vs layout, type vs instance, chrome vs body
- Native drag-and-drop without pulling in react-grid-layout or similar
- The README is genuinely useful documentation, not boilerplate
- `usePolling` hook is a nice extraction that all widgets share

**Where it stumbled:**
- No explicit acknowledgment of the prompt's ambiguity — the model just decided to do both without explaining the tradeoff or priority
- The `usePolling` hook's comment says "pass a stable fetcher" but doesn't enforce this (minor)

**Surprising:**
- The scope is large for a single-prompt implementation, yet everything works together
- No shortcuts taken (e.g., didn't skip the catalog, didn't hardcode layouts)

---

## Would I merge this PR?

**Yes.** This is a clean, well-architected implementation that addresses both interpretations of "pluggable." The plugin system makes adding new widgets trivial, and the user customization is complete and polished. The only feedback I'd give is to add a sentence to the README acknowledging the design choice to support both developer and user extensibility.

---

## Summary

| Section | Score |
|---------|-------|
| Architectural judgment | 14/14 |
| Ambiguity-handling | 8/10 |
| Existing-code respect | 8/8 |
| Frontend craft | 4/4 |
| Code quality | 4/4 |
| **Total** | **38/40** |
