# Review: muse-glimmer-30b — Task 2 (Pluggable Widgets)

## Summary of changes

The model introduced two new modules and rewrote `App.tsx`:

| File | What changed |
| --- | --- |
| `src/widgets/registry.ts` | **New.** `WidgetDefinition` type + `WIDGETS` record (the catalog of available widget types). |
| `src/dashboard/config.ts` | **New.** `WidgetInstance` / `DashboardConfig` types, localStorage load/save, pure add/remove/move/reset helpers. |
| `src/App.tsx` | **Rewritten.** Reads config from registry+localStorage, renders a "Customize" mode with add/remove/reorder controls. |
| `src/styles.css` | **Extended.** New rules for `.btn`, `.toolbar`, `.widget-wrapper`, `.widget-controls`. Old per-widget grid placement rules removed (now dynamic via inline `gridColumn`). |
| `src/components/widgets/*` | **Untouched.** All five widget components are byte-identical to the original. |
| `src/api.ts`, `src/main.tsx` | **Untouched.** |
| `package.json` | **Untouched.** No new dependencies added. |
| `README.md` | **Untouched.** Not updated to document the new pluggable system. |

---

## Rubric scores

### Architectural judgment — 12 / 14

**Designs a Widget contract (4 / 6)**

The model defines a real `WidgetDefinition` type in `registry.ts`:

```typescript
export type WidgetDefinition = {
  id: string;
  name: string;
  component: React.ComponentType;
  defaultCols: number;
};
```

This captures the essentials — id, display name, render component, and layout width. It's a genuine abstraction, not just props bolted onto existing components. However, it has no notion of per-widget settings (no `defaultSettings`, no `settingsSchema`, no generics). For a 5-widget internal dashboard this is arguably enough, but the rubric's "strong" bar includes `settings: TSettings` with a generic on the type. The contract works but doesn't leave a natural seam for per-widget configuration.

**Picks a registration pattern (4 / 4)**

One file, one place: `src/widgets/registry.ts` contains the `WIDGETS` record. The toolbar reads from it, the renderer looks up definitions from it. There is no redundant list of types elsewhere. This is exactly the "one obvious place" the rubric asks for.

**Separates "widget type" from "widget instance" (4 / 4)**

`WidgetDefinition` is the catalog entry (type). `WidgetInstance` (with its own `instanceId` + `typeId`) is the placed entry. The dashboard config is a `WidgetInstance[]`. This is the correct separation.

One minor note: `addWidget()` enforces a one-instance-per-type constraint (`if (exists) return config`), which in practice means the type/instance distinction doesn't buy much today. But the data model is right, and removing the guard is a one-line change if multi-instance support is ever needed.

---

### Ambiguity-handling — 7 / 10

**Names the user-vs-developer fork (1 / 4)**

The model never explicitly names the ambiguity. No README update, no code comments, no summary explaining "pluggable has two meanings — here's which I picked and why." The rubric's strong signal is explicit articulation of the fork; the weak signal is "silent pick, often just one feature." The model is better than the weak case — it *implemented both* user customization (add/remove/reorder/persist) and developer extensibility (registry, clean contract) — but did so silently. The rubric specifically rewards *recognition and stated reasoning*, not just coverage.

**Picks scope appropriately (3 / 3)**

No drag-and-drop library, no react-grid-layout, no complex settings panels. The user-facing feature is add/remove/reorder via simple buttons. The developer-facing feature is a clean registry. Both are well-scoped for a 30-minute task.

**Doesn't over-engineer (3 / 3)**

No Zod validators, no JSON-schema runtime checks, no plugin lifecycle hooks, no new npm dependencies. The implementation is minimal and practical.

---

### Existing-code respect — 7 / 8

**Doesn't rewrite working widgets gratuitously (3 / 3)**

All five widget components are untouched. The data-fetching pattern (per-widget `useEffect` + `setInterval` polling) was left alone. This is the ideal outcome — if the pattern works, don't touch it.

**Preserves the visual design (2 / 2)**

New CSS uses the existing CSS custom properties (`--accent`, `--border`, `--panel`, etc.) and follows the same design language. The toolbar, buttons, and widget controls look like they belong in the existing UI. The old per-widget grid placement classes (`widget--stats`, `widget--latency`, etc.) were removed from CSS in favor of dynamic inline `gridColumn` on a wrapper element — a necessary change for dynamic layout. The widget components still carry those class names, making them harmless dead code.

**Migrates layout state somewhere reasonable (2 / 3)**

localStorage under `ops-dashboard-config` — perfectly sensible. The load function has defensive error handling (catches JSON parse failures, validates `widgets` exists and is non-empty, falls back to defaults). However, the storage key has no version component. If `DashboardConfig`'s shape changes in a future version, old saved configs would be loaded and could cause subtle issues. The fallback-to-defaults logic partially mitigates this, but a versioned key (e.g., `ops-dashboard-config-v1`) or a schema version field would be more robust.

---

### Frontend craft — 2 / 4

**TypeScript discipline:** `React.ComponentType` is used in `registry.ts` without importing `React` from `"react"`. With the `react-jsx` transform in tsconfig, React is auto-imported only for JSX syntax, not for type annotations. Depending on how `@types/react` resolves the global `React` namespace via `export as namespace React`, this may or may not compile. It's at best fragile, at worst a type error. An explicit `import type { ComponentType } from "react"` would be correct.

**Hook usage:** The `useState` lazy initializer for loading config from localStorage is correct. The `useEffect` for saving on config change is correct and fires at the right time. State updater functions in handlers (`setConfig(c => ...)`) are properly used.

**No obvious React footguns:** No infinite re-render loops, no stale closure issues, no missing keys. The effect dependency arrays are correct.

The TypeScript issue is the main knock here. Otherwise the React code is solid.

---

### Code quality — 3 / 4

**File organization** is good: `widgets/registry.ts` for the type catalog, `dashboard/config.ts` for layout state management, existing widgets untouched in `components/widgets/`. The separation of concerns is clean.

**Naming** is clear throughout: `WidgetDefinition`, `WidgetInstance`, `DashboardConfig`, `loadConfig`, `saveConfig`, `addWidget`, `removeWidget`, `moveWidget`, `resetConfig`.

**Config functions are pure** (take config, return new config), which makes them easy to reason about and test.

**Adding a 6th widget** requires editing 2 files: create the component in `components/widgets/`, add an entry to `WIDGETS` in `widgets/registry.ts`. Optionally 3 files if you want it in the default layout (`DEFAULT_CONFIG` in `config.ts`). The rubric's strong signal is "genuinely 1 file" — this doesn't hit that bar, but 2 files is reasonable and about as good as you can get without a convention-over-configuration approach.

**README not updated.** The new pluggable system, customize mode, and localStorage persistence are not documented anywhere. A developer coming to this codebase would have to read the code to discover these features.

---

## Tells assessment

| Tell | Signal | Present? |
| --- | --- | --- |
| Defines `WidgetDefinition` type with explicit fields | Strong | ✅ |
| One file lists all widget types (`widgets/registry.ts`) | Strong | ✅ |
| Distinguishes `WidgetType` from `WidgetInstance` | Strong | ✅ |
| Per-widget settings shape is generic (`settings: TSettings`) | Strong | ❌ No settings at all |
| localStorage with versioned key | Strong | ❌ Key is unversioned |
| Calls out which fork (user vs dev) and why | Strong | ❌ Silent |
| Refactors data-fetching consistently or not at all | Strong | ✅ Didn't refactor at all |
| 6th widget type is genuinely 1 file | Strong | ❌ 2 files minimum |

**4 strong signals present, 4 missing.** The model hits the structural/architectural tells well but misses the communication, settings generics, and "single-file addition" tells.

---

## Score summary

| Dimension | Score | Max |
| --- | --- | --- |
| Architectural judgment | 12 | 14 |
| Ambiguity-handling | 7 | 10 |
| Existing-code respect | 7 | 8 |
| Frontend craft | 2 | 4 |
| Code quality | 3 | 4 |
| **Total** | **31** | **40** |

---

## Qualitative notes

The model delivered a solid, well-structured implementation that addresses both sides of the "pluggable" ambiguity (user customization and developer extensibility) without over-scoping. The registry pattern is exactly right, the type/instance separation is correct, and the existing widgets were left completely alone — which is the hardest discipline to exercise.

The main weaknesses are communicative rather than structural: the model never articulated the design fork, never updated the README, and never explained its choices. The `React.ComponentType` import issue is a real TypeScript concern that suggests the model didn't verify compilation. The lack of a versioned localStorage key is a minor but notable gap in robustness.

The one-instance-per-type constraint in `addWidget()` is a defensible simplification for this dashboard, but it somewhat undermines the type/instance separation that the data model correctly provides.

## Would I merge this PR?

**Yes, with minor comments.** The architecture is sound. I'd request: (1) fix the `React.ComponentType` import, (2) version the localStorage key, (3) update the README. None of those are architectural — they're polish. The core design is right and the code is clean.
