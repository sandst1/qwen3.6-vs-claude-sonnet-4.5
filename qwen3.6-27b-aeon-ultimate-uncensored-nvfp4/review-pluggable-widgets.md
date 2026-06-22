# Review: Qwen3.6-27B Pluggable Widgets Implementation

## Summary

The model built a working user-configurable dashboard with add/remove/reorder functionality and localStorage persistence. It created a clean widget registry pattern but made a silent architectural choice (user extensibility over developer extensibility) without stating the reasoning. The widget contract is minimal, and the type/instance separation is thin.

**Total Score: 26/40**

---

## Architectural Judgment — 9/14

### Designs a Widget contract — 3/6

The model created `WidgetDefinition`:

```typescript
// src/types/widget.ts
export interface WidgetDefinition {
  id: string;
  label: string;
  gridColumn: number;
  component: ComponentType;
}
```

**Strengths:**
- Has a dedicated type file
- Captures the essential fields for rendering

**Weaknesses:**
- No `defaultSettings` or settings schema
- No generic settings type (`settings: TSettings`)
- No way to support per-instance configuration
- Contract is more "component metadata" than a full widget abstraction

The rubric's strong signal is "Per-widget settings shape is generic (`settings: TSettings`) with a generic on the type" — this implementation doesn't have that. It's functional but shallow.

### Picks a registration pattern — 4/4

Single file `config/widgetsRegistry.ts` with clear documentation:

```typescript
/**
 * Add new widget types here. Each entry is a "plug" — a simple object describing
 * the widget, what it looks like, and which React component renders it.
 *
 * To add a new widget:
 * 1. Create the component in `components/widgets/`
 * 2. Add an entry below
 * 3. The dashboard will automatically make it available
 */
export const widgetsRegistry: WidgetDefinition[] = [...]
```

This is the model's strongest point. One obvious place for "where is the list of available widget types?" with inline documentation for adding new types.

### Separates "widget type" from "widget instance" — 2/4

- `widgetsRegistry` = catalog of types ✓
- `activeIds: string[]` = list of instances (sort of)

The problem: instances are just string IDs referencing types. There's no `WidgetInstance` type with its own `instanceId`, `position`, and `settings`. The current design cannot support:
- Two instances of the same widget type
- Per-instance settings (e.g., different time ranges for two latency charts)

The model conflated "which types are visible" with "which instances are placed." This is the exact failure mode the rubric warns about.

---

## Ambiguity-handling — 5/10

### Names the user-vs-developer fork — 0/4

**Silent pick.** The model implemented user extensibility (add/remove/reorder UI) without:
- Stating that "pluggable" has two readings
- Explaining why it chose this interpretation
- Noting the alternative (developer extensibility)

The README was not updated. There's no explanation in comments or code about the architectural choice. This is the rubric's weak signal: "Silent pick, often just one feature implemented."

### Picks scope appropriately for 30 min — 3/3

Good scope control:
- ✓ Add widget from menu
- ✓ Remove widget (×button)
- ✓ Drag-and-drop reorder (native HTML5 DnD)
- ✓ localStorage persistence
- ✗ No react-grid-layout complexity
- ✗ No per-widget settings UI

This is a reasonable ~30-minute scope. Didn't try to ship everything.

### Doesn't over-engineer — 2/3

- No zod or JSON schema validators
- No plugin lifecycle hooks
- Simple localStorage (no IndexedDB)

Minor concern: The drag-and-drop implementation is a bit elaborate for what could have been a simpler approach, but it's not egregious over-engineering.

---

## Existing-code Respect — 7/8

### Doesn't rewrite working widgets gratuitously — 3/3

**Perfect.** All five widget files are byte-for-byte identical to the original:
- `StatsWidget.tsx` — unchanged
- `LatencyWidget.tsx` — unchanged
- `ErrorsWidget.tsx` — unchanged
- `ActivityWidget.tsx` — unchanged
- `ServicesWidget.tsx` — unchanged

The model correctly recognized that the existing data-fetching pattern was fine and left it alone.

### Preserves the visual design — 2/2

- Same CSS variables
- Same widget chrome (`.widget`, `.widget-header`, etc.)
- New controls styled consistently (uses `--accent`, `--panel`, `--border`)
- Grid layout preserved

### Migrates layout state somewhere reasonable — 2/3

Uses localStorage with key `"dashboard_widgets"`:

```typescript
const STORAGE_KEY = "dashboard_widgets";

function loadWidgetOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultWidgets();
  } catch {
    return getDefaultWidgets();
  }
}
```

**Good:** localStorage is appropriate, has error handling, has default fallback.

**Missing:** No versioned key (e.g., `dashboard_widgets_v1`). If the schema changes later, there's no migration story.

---

## Frontend Craft — 3/4

**TypeScript discipline:** Clean. No `any` types. Proper use of `ComponentType`, explicit typing throughout.

**Hook usage:** `useWidgetManager` is well-structured with proper effect dependencies:

```typescript
useEffect(() => {
  saveWidgetOrder(activeIds);
}, [activeIds]);
```

**React patterns:** State management is correct, no obvious infinite re-render risks.

**Bug:** CSS class name mismatch:

```tsx
// Dashboard.tsx uses:
className={`widget-container ${isDragging ? 'widget-dragging' : ''} ${isDropTarget ? 'widget-drop-target' : ''}`}

// styles.css defines:
.widget-dragsource .widget { opacity: 0.6; }
.widget-droptarget::before { ... }
```

The JavaScript references `widget-dragging` and `widget-drop-target`, but the CSS defines `widget-dragsource` and `widget-droptarget`. The drag visual feedback won't work.

---

## Code Quality — 3/4

**File organization:** Clean structure:
```
src/
  types/widget.ts          # Contract
  config/widgetsRegistry.ts # Registry
  hooks/useWidgetManager.ts # State management
  components/Dashboard.tsx  # Main dashboard
  components/widgets/       # Individual widgets (unchanged)
```

**Adding the 6th widget:** Requires edits to 2 files:
1. Create `components/widgets/NewWidget.tsx`
2. Add entry to `config/widgetsRegistry.ts`

Not quite "genuinely 1 file," but close and clearly documented.

**README not updated:** The README still describes the original layout without mentioning the new pluggable architecture, user controls, or how to add widgets. A developer reading just the README wouldn't know about the registry pattern.

---

## Tells Summary

| Signal | Present? |
|--------|----------|
| Defines `Widget` / `WidgetDefinition` type with explicit fields | ✓ Partial — has type but minimal fields |
| One file lists all widget types | ✓ Yes — `widgetsRegistry.ts` |
| Distinguishes `WidgetType` from `WidgetInstance` | ✗ No — instances are just IDs |
| Per-widget settings shape is generic | ✗ No settings support |
| If layout persists, uses localStorage with versioned key | ✓/✗ localStorage, but no version |
| Calls out which fork it picked and why | ✗ Silent pick |
| Refactors data-fetching consistently or doesn't refactor at all | ✓ Didn't refactor at all |
| The 6th widget type is genuinely 1 file | ✗ 2 files required |

---

## Qualitative Notes

**What surprised me:** The model correctly identified that the existing widgets didn't need refactoring. Many models would have tried to "improve" the data-fetching pattern or add hooks.

**Where it shined:** The registry pattern is clean and well-documented. The scope control was appropriate.

**Where it stumbled:**
1. Silent architectural choice — didn't acknowledge the user-vs-developer ambiguity
2. No real type/instance separation — can't have two instances of the same widget
3. CSS class name bug would break drag feedback
4. README not updated

**Would I merge this PR?** Conditionally yes, after:
1. Fix the CSS class name mismatch
2. Add a brief note to the README about the new architecture
3. (Optional) Add a brief comment explaining the user-extensibility choice

The core architecture is sound for the scope chosen, but the silent architectural pick and missing documentation are real gaps.
