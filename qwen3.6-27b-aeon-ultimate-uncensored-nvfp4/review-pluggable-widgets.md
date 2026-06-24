# Review: Qwen3.6-27B-AEON-Ultimate-Uncensored-NVFP4 — Pluggable Widgets

## Summary

The implementation demonstrates solid architectural judgment with a proper widget registry pattern and clear type/instance separation. However, it has an unfinished persistence story (code exists but isn't wired up) and contains a runtime-breaking typo.

**Total Score: 30.5 / 40**

---

## Architectural Judgment — 13/14

### Designs a Widget contract — 5/6

The model defines a proper `WidgetType` interface in `lib/widget-schema.ts`:

```typescript
export interface WidgetType extends WidgetMetadata {
  id: string;
  title: string;
  subtitle: string;
  size: WidgetSize;
  Component: ComponentType;
}
```

**Strong signal.** The contract captures the essential shape: identifier, display metadata, sizing hint, and render function. Each widget self-registers with its config:

```typescript
const statsConfig: WidgetType = {
  id: "stats",
  title: "Summary",
  subtitle: "last 5 min",
  size: "medium",
  Component: StatsWidget,
};
registry.register(statsConfig);
```

Deducted 1 point because there's no generic per-widget settings shape (`settings: TSettings`). For a 30-minute task this is acceptable, but a strong implementation would leave room for widget-specific configuration.

### Picks a registration pattern — 4/4

**Strong signal.** A dedicated `WidgetRegistry` class in `lib/widget-registry.ts`:

```typescript
export class WidgetRegistry {
  private widgets = new Map<string, WidgetType>();
  register(widgetType: WidgetType): void { ... }
  get(id: string): WidgetType | undefined { ... }
  getAll(): WidgetType[] { ... }
}
export const registry = new WidgetRegistry();
```

The list of available widget types lives in exactly one place. Widgets self-register via side-effect imports, coordinated through `components/widgets/index.ts`:

```typescript
import "./StatsWidget";
import "./LatencyWidget";
// ...
```

This is a clean, idiomatic pattern. "Where is the list of available widget types?" has one obvious answer.

### Separates "widget type" from "widget instance" — 4/4

**Strong signal.** Clear separation:

| Concept | Type | Location |
|---------|------|----------|
| Catalog entry (type) | `WidgetType` | `WidgetRegistry` |
| Placed widget (instance) | `LayoutEntry` | `useDashboardStore` state |

The `LayoutEntry` shape:
```typescript
export interface LayoutEntry {
  id: string;
  size?: WidgetSize;
  collapsed?: boolean;
}
```

Dashboard state is a list of instances that reference types by `id`. This is the correct abstraction for add/remove/reorder functionality.

---

## Ambiguity-Handling — 7/10

### Names the user-vs-developer fork — 2/4

**Weak signal.** The model implemented *both* forks:
- User extensibility: sidebar with add/remove, drag-drop reorder, collapse/expand
- Developer extensibility: registry, widget contract, self-registration

But there's no stated reasoning about which fork was prioritized or why. The README doesn't acknowledge the tension. A strong response would explicitly note: "The prompt has two readings — I'm focusing on [X] because [Y], and structuring the code so [Z] is easy to add later."

### Picks scope appropriately for 30 min — 2/3

Reasonable scope choices:
- Native HTML5 drag-drop instead of `react-grid-layout`
- No per-widget settings UI
- Sidebar instead of inline toolbar

However, there's an oddity: `widget-schema.ts` contains `loadLayout()` and `saveLayout()` functions for localStorage persistence, but they're **never called**. The dashboard initializes fresh from the registry every time:

```typescript
const [layout, setLayout] = useState<LayoutEntry[]>(() => {
  return registry.getAll().map((w) => ({ id: w.id, size: w.size, collapsed: false }));
});
```

This suggests scope creep mid-implementation — persistence was started but abandoned. Honest stubbing ("// TODO: wire up persistence") would be cleaner than dead code.

### Doesn't over-engineer — 3/3

**Strong signal.** No JSON-schema validators, no zod, no plugin lifecycle hooks, no event bus patterns. The implementation is appropriately minimal for a 5-widget internal tool.

---

## Existing-Code Respect — 5.5/8

### Doesn't rewrite working widgets gratuitously — 3/3

**Strong signal.** The refactor is consistent across all widgets:

| Original | Refactored |
|----------|------------|
| React component only | Same component + config object + `registry.register()` |

Data-fetching patterns (useEffect + setInterval polling) are preserved identically. No widget was treated differently from others.

### Preserves the visual design — 1.5/2

Mostly preserved:
- Same CSS variables (`--bg`, `--panel`, `--border`, `--text`, etc.)
- Same widget internal structure (`.widget-header`, `.widget-body`, `.widget-title`)
- 12-column grid retained

Changes:
- Added `.widget-card` wrapper with header chrome (title, collapse, remove, drag handle)
- Grid column spans changed from per-widget CSS classes to dynamic inline styles
- Size abstracted to `small`/`medium`/`large` buckets

The visual *feel* is preserved but the widget chrome adds notable UI overhead. This is acceptable for the user-extensibility features, but the original widgets had a cleaner, more minimal appearance.

### Migrates layout state somewhere reasonable — 1/3

**Weak signal.** The persistence infrastructure exists:

```typescript
const STORAGE_KEY = "dashboard-layout";
export function loadLayout(): DashboardLayout { ... }
export function saveLayout(layout: DashboardLayout): void { ... }
```

But it's **dead code** — never invoked. Layout resets on every page refresh. This is worse than either:
- Not implementing persistence (honestly scoped)
- Implementing persistence (useful feature)

Half-implemented features are technical debt.

---

## Frontend Craft — 2/4

### TypeScript discipline

Good:
- No `any` types
- Proper interface definitions
- Explicit typing throughout

### Hook usage

Good:
- `useCallback` with correct dependency arrays
- `useEffect` with cleanup (`clearInterval`)
- State initialization functions

### Bugs

**Critical bug in `ServicesWidget.tsx` line 11:**

```typescript
const id = setInterval(() => fetchServiceStatuses().then(setSets), 30_000);
//                                                        ^^^^^^^ TYPO
```

Should be `setServices`. This will cause a `ReferenceError` at runtime when the interval fires.

**Minor issues:**
- `dragHandleRef={null}` prop passed but never used
- Drag-over visual feedback (`drag-over` class) is defined in CSS but the class is never applied

---

## Code Quality — 3/4

### File organization

Clean separation:
```
src/
├── lib/
│   ├── widget-schema.ts    # Types + persistence (unused)
│   ├── widget-registry.ts  # Registry class
│   └── dashboard-store.ts  # React state hook
├── components/
│   ├── widgets/
│   │   ├── index.ts        # Barrel imports
│   │   ├── StatsWidget.tsx # Self-registering widgets
│   │   └── ...
│   ├── DashboardLayout.tsx
│   ├── WidgetCard.tsx
│   └── Sidebar.tsx
└── App.tsx
```

### Adding the 6th widget

To add a new widget type:

1. Create `src/components/widgets/FooWidget.tsx` with component + config + `registry.register()`
2. Add `import "./FooWidget"` to `widgets/index.ts`

That's **2 files**, which is close to the ideal of 1. The barrel import requirement is minor friction.

### Naming

Clear and consistent. `WidgetType`, `LayoutEntry`, `registry`, `useDashboardStore` — all self-explanatory.

---

## Scorecard

| Criterion | Points | Score |
|-----------|--------|-------|
| **Architectural judgment** | 14 | **13** |
| · Widget contract | 6 | 5 |
| · Registration pattern | 4 | 4 |
| · Type/instance separation | 4 | 4 |
| **Ambiguity-handling** | 10 | **7** |
| · Names the fork | 4 | 2 |
| · Appropriate scope | 3 | 2 |
| · Not over-engineered | 3 | 3 |
| **Existing-code respect** | 8 | **5.5** |
| · Consistent refactoring | 3 | 3 |
| · Visual design preserved | 2 | 1.5 |
| · Layout state migration | 3 | 1 |
| **Frontend craft** | 4 | **2** |
| **Code quality** | 4 | **3** |
| **Total** | **40** | **30.5** |

---

## Strong vs Weak Signals Summary

| Aspect | Signal |
|--------|--------|
| `WidgetType` interface with explicit fields | ✅ Strong |
| One file lists all widget types | ✅ Strong |
| Distinguishes `WidgetType` from `LayoutEntry` | ✅ Strong |
| Per-widget settings generic | ❌ Not implemented |
| localStorage persistence | ⚠️ Code exists but unused |
| Calls out which fork and why | ❌ Silent pick |
| Refactors data-fetching consistently | ✅ Strong |
| 6th widget is 1 file | ⚠️ 2 files (acceptable) |
| No runtime bugs | ❌ `setSets` typo breaks ServicesWidget |

---

## Verdict

Solid architectural foundation with proper registry pattern and type/instance separation. The implementation covers both user and developer extensibility, though without explicit reasoning about scope prioritization. The main weaknesses are dead persistence code and a runtime-breaking typo that would be caught immediately in manual testing. With the typo fixed and persistence either removed or wired up, this would score 34-35/40.
