# Review: qwen3.8-27B-8bit/pluggable-widgets

**Prompt:** "Make it pluggable" — enable users to customize the dashboard (add/remove/reorder widgets) and make it easy for developers to add new widget types.

**Final Score: 33/40**

---

## Architectural Judgment — 11/14

### Designs a Widget contract — 5/6

The model defines a clear `WidgetDefinition` interface in `registry.ts`:

```typescript
export interface WidgetDefinition {
  id: WidgetId;
  title: string;
  subtitle?: string;
  span: number;
  Component: ComponentType;
}
```

This is a solid contract that captures the essential shape: identifier, display metadata, layout sizing, and the render component. The decision to move header rendering to a generic `WidgetShell` is clean—widget components now only render their body content.

**Missing:** No `settings` or `settingsSchema` field. For the current scope this is fine, but it limits future extensibility (e.g., a user wanting to configure refresh interval per widget).

### Picks a registration pattern — 4/4

Single `WIDGETS` array in `src/widgets/registry.ts`. Adding a new widget type is documented in a comment:

```typescript
/**
 * All available widget types. To add a new widget:
 *   1. Create a component in src/components/widgets (body only, no header).
 *   2. Add an entry here.
 * That's it — it shows up in the "add widget" menu automatically.
 */
```

One obvious place. No scattered type lists across multiple files.

### Separates "widget type" from "widget instance" — 2/4

**This is the architectural weak spot.** The layout state is:

```typescript
const [layout, setLayout] = useState<WidgetId[]>(loadLayout);
```

This is an array of type IDs, not instance IDs. Consequences:

- You cannot have two instances of the same widget type (e.g., two "stats" widgets showing different time ranges)
- No per-instance settings—the widget definition's metadata is shared by all "instances" (which are really just type references)
- `addWidget` explicitly prevents duplicates: `l.includes(id) ? l : [...l, id]`

For a dashboard where "one of each" is the desired behavior, this works. But the rubric explicitly looks for the type/instance separation to support per-instance configuration. This implementation conflates them.

---

## Ambiguity-Handling — 7/10

### Names the user-vs-developer fork — 1/4

**Silent pick.** The implementation delivers both user customization (add/remove/reorder/persist) AND developer extensibility (registry pattern), but nowhere—not in README, not in code comments—does it acknowledge that "pluggable" has two readings or explain why it chose to address both.

The README is unchanged from the original except for formatting. A strong signal would have been: "Interpreted 'pluggable' as both user-configurable and developer-extensible; prioritized the registry pattern since that unlocks both."

### Picks scope appropriately for 30 min — 3/3

Good scope discipline:

- Native HTML5 drag-and-drop, not react-grid-layout
- localStorage persistence, not a backend
- No per-widget settings UI
- No resize handles
- No complex animations

The result is a working, demonstrable feature without rabbit-holing.

### Doesn't over-engineer — 3/3

No over-engineering:

- No zod or JSON schema validators
- No plugin lifecycle hooks
- No event bus or pub/sub
- No dynamic imports or code splitting
- Simple, synchronous registration

---

## Existing-Code Respect — 8/8

### Doesn't rewrite working widgets gratuitously — 3/3

All five widgets were refactored consistently:

| Before | After |
|--------|-------|
| `<div className="widget widget--stats">` | `<div className="widget-content">` |
| Widget renders its own header | Header moved to `WidgetShell` |
| Self-contained layout | Shell handles grid span |

Data-fetching pattern (useState + useEffect + setInterval) preserved exactly across all widgets. No haphazard "refactor one, leave three" situation.

### Preserves the visual design — 2/2

- Same CSS variables (`:root` block unchanged)
- Same widget chrome (border-radius, padding, header typography)
- Same grid feel (12-column, same spans)
- Added toolbar and drag affordances without disrupting existing aesthetics

### Migrates layout state somewhere reasonable — 3/3

localStorage with a versioned key:

```typescript
const STORAGE_KEY = "ops-dashboard.layout.v1";
```

Graceful handling:

- Parse errors fall back to `DEFAULT_LAYOUT`
- Invalid/unknown widget IDs filtered out
- Duplicates deduplicated (keep first occurrence)
- Storage unavailable (private mode) silently falls back to in-memory

---

## Frontend Craft — 4/4

- **TypeScript discipline:** No `any`. Proper typing throughout: `WidgetDefinition`, `WidgetId`, `DragEvent`, `ComponentType<{}>`.
- **Hook usage:** `useCallback` for stable function references in `useLayout`; proper dependency arrays.
- **No React footguns:** 
  - `key={id}` on rendered widgets
  - Effect cleanup for drag state
  - No infinite re-renders
- **Accessibility:** Remove button has `aria-label`; drag handle has `title` tooltip.

---

## Code Quality — 3/4

- **File organization:** Clear `src/widgets/` folder separating registry concerns from components.
- **Naming:** `WidgetDefinition`, `WidgetShell`, `useLayout`—all self-explanatory.
- **Adding the 6th widget:**
  1. Create `src/components/widgets/FooWidget.tsx` (body only)
  2. Add import + entry to `src/widgets/registry.ts`

That's 1 new file + 1 edit. Not quite "reading just one file," but close. The registry comment explains exactly what to do.

**Minor ding:** The widget components still import their own data-fetching from `../../api`—if a future widget needs shared state, there's no pattern established. But this is a nit.

---

## Strong vs Weak Signals Summary

| Criterion | Signal |
|-----------|--------|
| Defines `WidgetDefinition` type with explicit fields | ✅ Strong |
| One file lists all widget types | ✅ Strong |
| Distinguishes type from instance | ❌ Weak (conflated) |
| Per-widget settings shape is generic | ❌ Weak (no settings) |
| localStorage with versioned key | ✅ Strong |
| Calls out which fork it picked | ❌ Weak (silent) |
| Refactors data-fetching consistently | ✅ Strong |
| 6th widget is 1 file | ⚠️ Partial (2 files) |

---

## Final Breakdown

| Category | Points |
|----------|--------|
| Architectural judgment | 11/14 |
| Ambiguity-handling | 7/10 |
| Existing-code respect | 8/8 |
| Frontend craft | 4/4 |
| Code quality | 3/4 |
| **Total** | **33/40** |
