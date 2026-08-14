# Task 2: Pluggable Widgets — Detailed Results

Make a React dashboard widget system **pluggable**. Core challenge: deciding "pluggable for whom" (users vs developers).

Starter code: `original/pluggable-widgets/` · Rubric: [BENCHMARK.md](./BENCHMARK.md) · Overall results: [README.md](./README.md)

---

## Score Breakdown

| Criterion | Max | 3.8-27B-FP8 | 3.8-FP8 (med) | 3.8-27B-4bit | 3.8-4bit (med) | 27B-Q6K | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | NVFP4 | Unsloth-NVFP4 | AEON-NVFP4 | Sonnet 4.5 | Opus 4.6 | DS-V4-REAP-180B | DS-V4-0731-IQ3 | Ornith-35B-8bit | Step-3.7-Flash | A1-FP8 | Ternary-27B | Laguna-S2.1 | Muse Glimmer-30B | Unsloth-Muse-Q4 |
|-----------|-----|-------------|---------------|--------------|----------------|---------|------------------|---------------|----------|--------------|---------------------|-------|------------|------------|------------|----------|-----------------|----------------|-----------------|----------------|--------|-------------|-------------|-----------------|-----------------|
| Architectural judgment | 14 | 11 | 11 | 12 | 13 | 13 | 13 | 11 | 11 | 10 | 13 | 12 | 11 | 13 | 13 | 11 | 10 | 13 | 9 | 9 | 10 | 12.5 | 13 | 12 | 11 |
| Ambiguity-handling | 10 | 7 | 7 | 8 | 10 | 7 | 8.5 | 5 | 8 | 5 | 7 | 7 | 7 | 7 | 6 | 8 | 8 | 8 | 8 | 6 | 7 | 7 | 7 | 7 | 5 |
| Existing-code respect | 8 | 8 | 8 | 7 | 8 | 7 | 7 | 7 | 7 | 8 | 8 | 8 | 8 | 8 | 5.5 | 7.5 | 7 | 7 | 8 | 7 | 7 | 5 | 7.5 | 7 | 7 |
| Frontend craft | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 2 | 3 | 3 | 3.5 | 3 | 2 | 2 | 3 | 3 | 3 | 4 | 3 | 3 | 2 | 3 | 3 | 2 | 3 |
| Code quality | 4 | 3 | 4 | 3 | 4 | 3 | 3 | 3 | 4 | 2 | 3.5 | 2 | 3 | 3 | 3 | 4 | 3 | 4 | 3 | 2 | 3 | 3 | 3 | 3 | 3 |
| **Total** | **40** | **33** | **34** | **34** | **39** | **34** | **35.5** | **28** | **33** | **28** | **35** | **32** | **31** | **30.5** | **32** | **33.5** | **32** | **37** | **30** | **27** | **24** | **33** | **33.5** | **31** | **29** |

**Leaderboard (widgets only):** 3.8-4bit reasoning-medium (39) · DS-V4-0731 (37) · local 8-bit (35.5) · 35B-A3B-8bit pair (35) · Q6K / 3.8-27B-4bit / 3.8-FP8 reasoning-medium (34 tie) · Laguna / Opus 4.6 (33.5 tie) · Qwen 3.8-FP8 thinking-off (33)

---

## Architectural Approaches

| Aspect | 3.8-27B-FP8 | 3.8-FP8 (med) | 3.8-27B-4bit | 3.8-4bit (med) | 27B-Q6K | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | NVFP4 | Unsloth-NVFP4 | AEON-NVFP4 | Sonnet 4.5 | Opus 4.6 | DS-V4-REAP-180B | DS-V4-0731-IQ3 | Ornith-35B-8bit | Step-3.7-Flash | A1-FP8 | Ternary-27B | Laguna-S2.1 | Muse Glimmer-30B | Unsloth-Muse-Q4 |
|--------|-------------|---------------|--------------|----------------|---------|------------------|---------------|----------|--------------|---------------------|-------|------------|------------|------------|----------|-----------------|----------------|-----------------|----------------|--------|-------------|-------------|-----------------|-----------------|
| **Widget contract** | `WidgetDefinition` interface (id, title, subtitle, span, `Component`; no generic settings) | `WidgetDef` interface (id, title, subtitle, span, `component`; no generic settings) | `WidgetDef` interface (id, name, description, defaultSpan, `component`; no generic settings) | `WidgetDefinition` interface (id, title, span, `component`; no generic settings) | `WidgetDefinition` interface + typed `GridSpan` (no generic settings) | `WidgetType` interface (no generic settings) | `WidgetDescriptor<TData>` generic | `WidgetDescriptor<T>` generic | `WidgetDef` (minimal, non-generic settings) | `WidgetPlugin<TData>` generic | `WidgetType` interface (no generic settings) | `WidgetMetadata` interface (no generic settings) | `WidgetType` interface (no generic settings) | `WidgetDefinition` (no generic) | `WidgetDefinition` interface (`type`, `label`, `colSpan`, `component`; no generic settings) | `WidgetDefinition` (no generic settings) | `WidgetDefinition` interface (id, title, description, defaultCols, subtitle, component; no generic settings) | `WidgetDef` (no generic settings) | `WidgetDefinition` (no generic, unused `pollInterval`) | `WidgetDefinition` (no generic settings, `render: () => React.ReactNode`) | `WidgetDefinition` interface with `configSchema`; config typed as `unknown`, not generic | `WidgetDefinition<TData>` generic (casts to concrete type in render) | `WidgetDefinition` (no generic settings) | `WidgetMetadata` interface (`component: React.ComponentType<any>`, no generic settings) |
| **Registration pattern** | Array registry (`WIDGETS` + `WIDGET_BY_ID` lookup) | Array in `widgets/registry.ts` (`WIDGET_TYPES` + `DEFAULT_LAYOUT`) | Map registry + `registerWidget()` + `createWidget()` helper in `widgets/index.ts` | Map registry + `registerWidget()` + duplicate-detection throw in `widgets/registry.ts` | Map registry + `registerWidget()` + side-effect imports | Map registry + `registerWidget()` + side-effect imports | Class + side-effect imports | Map registry + `registerWidget()` + side-effect imports | `WidgetRegistry` + `BUILTIN_WIDGETS` catalog | Map registry + `registerWidget()` + side-effect imports | Map registry + `registerWidget()` + side-effect imports | Map registry + `registerWidget()` + side-effect imports | Class `WidgetRegistry` + side-effect imports | Plain object registry | Map registry + `registerWidget()` (warn-on-duplicate) + registrations in `widgets/index.ts` | Map registry + `defineWidget()` | Map registry + `registerWidget()` + duplicate-detection throw + side-effect imports via `widgets/index.ts` | Array registry (`widgetRegistry`) — no self-registration | Class `WidgetRegistry` + side-effect imports | `WidgetConfig` Map registry + `initBuiltIn()` call | Map `registry` object in `widget-types.ts` + `registerWidget()` called in `App.tsx` | Map registry + `registerWidget()` + side-effect imports via `widgets/index.ts` | `WIDGETS` record in `widgets/registry.ts` | Class `WidgetRegistry` (`register()`/`get()`/`getAll()`/`has()`) + side-effect imports via `widgets/index.ts` |
| **Type/instance split** | ⚠️ Partial (layout is `WidgetId[]` of type IDs; duplicates blocked) | ⚠️ Partial (layout is `string[]` of type IDs; duplicates blocked) | ⚠️ Partial (`WidgetDef` vs `WidgetPlacement`; no unique instance ID; one per type) | ✅ Perfect (`WidgetDefinition` vs `WidgetInstance` with unique `key`; one per type enforced in UI) | ✅ Perfect (`WidgetDefinition` vs `WidgetInstance` with `instanceId`) | ✅ Perfect | ✅ | ⚠️ Partial (type IDs used as instances) | ❌ Conflated | ✅ Perfect (`WidgetPlugin` vs `WidgetEntry`) | ✅ Perfect (`WidgetType` vs `PlacedWidget`) | ⚠️ Partial (instance `id` is type id; can't have duplicate widget types) | ✅ Perfect (`WidgetType` vs `LayoutEntry`) | ✅ | ⚠️ Partial (layout is `string[]` of type IDs; `${type}-${idx}` keys; duplicates allowed visually) | ⚠️ Partial (`activeIds` is `string[]` of type IDs) | ✅ Perfect (`WidgetDefinition` vs `WidgetInstance` with `instanceId`; one per type enforced in UI) | ⚠️ Partial (no instance concept, no duplicates) | ⚠️ Partial (no duplicate widgets allowed) | ❌ Conflated (`WidgetInstance.id` is type ID; can't add duplicates; React key bug) | ✅ Strong (`WidgetDefinition` vs `WidgetInstance` with `typeId`; duplicate definition is sloppy) | ✅ Strong (`WidgetDefinition` vs `LayoutItem`; one instance per type) | ✅ (`WidgetDefinition` vs `WidgetInstance`; one type each) | ✅ Perfect (`WidgetMetadata` vs `LayoutItem` with `instanceId`; supports duplicates) |
| **Layout persistence** | localStorage (`ops-dashboard.layout.v1`) with registry validation | localStorage (`ops-dashboard.layout.v1`) with registry validation | localStorage (`dashboard-layout`) with registry validation; no version key | localStorage (`ops-dashboard.layout.v1`) with registry validation + de-dupe by key | localStorage (`dashboard-layout-v1`) | localStorage | In-memory only | localStorage (`dashboard-config`) | localStorage (`dashboard-layout`) | localStorage (`widget-layout-v1`) | localStorage (`dashboard-layout`) | localStorage (`dashboard-layout-v1`) | Dead code (exists but never wired up) | localStorage | localStorage (`dashboard-layout`); validates array of strings; no version key | localStorage (`dashboard-layout`) | localStorage (`ops-dashboard:widget-layout`) with `sanitize()` validation on load; no version key | localStorage (`ops-dashboard-layout`) | localStorage (`dashboard-config`) | localStorage (`dashboard_widget_config`, no versioning, starts empty) | localStorage (`ops-dashboard-layout-v1`) with registry validation on load | localStorage (`dashboard:layout`) with registry validation; no version key | localStorage (`ops-dashboard-config`), defensive parse; no version key | localStorage (`ops-dashboard-layout`), no version key |
| **Widget refactoring strategy** | Consistent (body only via `WidgetShell`, all 5) | Consistent (body only via `WidgetCard`, all 5) | Consistent (removed `widget--X` modifiers; grid span via wrapper, all 5) | Consistent (removed `widget--X` modifiers; grid span via wrapper, all 5) | Consistent (body content only, subtitles removed, all 5) | Minimal (body content only, all 5 consistent) | Rewrote all 5 widgets | Rewrote all 5 widgets consistently | Kept existing widgets mostly unchanged | Consistent (pure render + registration, all 5) | Left widgets byte-for-byte identical | Minimal (added `registerWidget()` call only, all 5 consistent, otherwise unchanged) | Consistent (component + config + register, all 5) | Left widgets byte-for-byte identical | Consistent (removed `widget--X` modifiers; grid span via wrapper, all 5) | Consolidated all 5 into `widgets.tsx` | Consistent (body content only, card chrome to Dashboard, all 5) | Minimal (CSS class suffix only, all 5 consistent) | Appended `widgetDefinition` export to each (minimal) | Consistent (outer wrapper div removed from all 5) | Surgical (added `WidgetProps` param to all 5, data-fetching and rendering untouched) | Consistent (self-contained → `registerWidget({ render, fetch })`, all 5) | Left widgets byte-for-byte identical | Left widgets byte-for-byte identical (wrapped, not modified) |
| **Adding 6th widget** | 2 files (widget + registry entry) | 2 files (widget + registry entry) | 2 files (widget + `widgets/index.ts` registration line) | 2 files (widget + one-line `registerWidget()` in `registry.ts`) | 2-3 files (widget + App.tsx import) | 2 files | 2-3 files | 1-2 files | 1 file | 2 files | 2 files | 2 files | 2 files | 2 files | 2 files (widget + `registerWidget()` in `widgets/index.ts`) | 1 file (`defineWidget()` call) | 2 files (widget + `widgets/index.ts`) | 2 files (widget + registry entry) | 2 files (widget + registry import) | 2 files (new widget file + register in `initBuiltIn()`) | 1 file + 1 line in `App.tsx` | 2 files (widget + `widgets/index.ts` import) | 2 files (component + registry entry) | 2 files (widget + one-line `register()` call in `index.ts`) |
| **Documentation** | None (README unchanged) | Good README (layout customization + adding-a-widget guide) | Good README (pluggable widgets + adding-a-widget guide) | Excellent README (names user vs developer fork + adding-a-widget guide) | None (README unchanged) | None | None | Minimal (mostly code-level) | Minimal | None | None (README unchanged) | None (README unchanged) | None | `WIDGET_GUIDE.md` + `EXAMPLE_NEW_WIDGET.md` | Adding-a-widget guide in `widgets/index.ts`; README unchanged | Good README with architecture + guide | Good README (layout & customization + adding-a-widget guide with code sample) | None (README unchanged) | None (README unchanged) | None (README unchanged) | None (README unchanged) | Good README (architecture table + `WidgetDefinition` + adding-a-widget guide) | None (README unchanged) | None (README unchanged) |

---

## Key Differences

- **Qwen 3.8-27B-4bit (UD-Q4_K_XL, reasoning-medium) scores the highest on widgets (39/40)** — the new benchmark best, topping the previous leader (DS-V4-Flash-0731 at 37/40). Perfect `WidgetDefinition`/`WidgetInstance` type separation with unique instance `key`s (`crypto.randomUUID()`), Map registry with `registerWidget()` and duplicate-detection throw, both user-vs-developer forks named and implemented (10/10 ambiguity — the only perfect score on this dimension), versioned localStorage (`ops-dashboard.layout.v1`) with registry validation and de-dupe, native HTML5 drag-and-drop, consistent span-via-wrapper refactoring, and full marks on existing-code respect (8/8), frontend craft (4/4), and code quality (4/4). The only deduction is no settings abstraction on the widget contract (5/6).
- **[DeepSeek-V4-Flash-0731 IQ3_XXS](https://huggingface.co/unsloth/DeepSeek-V4-Flash-0731-GGUF) scores 37/40 on widgets** — second-best, still topping every other model except 3.8-4bit reasoning-medium. Perfect `WidgetDefinition`/`WidgetInstance` type separation with a proper `instanceId`, full marks on both frontend craft (4/4) and code quality (4/4), clean Map registry with `registerWidget()` and duplicate detection, `sanitize()` validation on localStorage load, and a good widget README with an adding-a-widget guide. Consistent body-only refactoring with card chrome owned by Dashboard. Held back by silent user-vs-developer ambiguity (8/10), no generic settings on the contract, and no version in the localStorage key.
- **Qwen 3.8-27B-4bit (UD-Q4_K_XL, thinking off) scores 34/40 on widgets** — ties Q6K for 5th-best and beats the FP8 thinking-off runner-up (33/40) on the same base model, but 5 points below the reasoning-medium run on the same GGUF. Clean `WidgetDef`/`WidgetPlacement` type split, Map registry with `registerWidget()` and duplicate detection, full frontend craft (4/4), appropriate scope (up/down reorder, no drag-and-drop over-engineering), and a good widget README with an adding-a-widget guide. Held back by no unique instance ID (one widget type per dashboard), implicit user-vs-developer ambiguity (8/10 but not explicitly stated), no settings schema, and an unversioned localStorage key (`dashboard-layout`).
- **Qwen 3.8-27B-FP8 scores 33/40 on widgets** — solid but not top-tier: clean `WidgetDefinition` contract, `WIDGETS` array registry with documented add-a-widget flow, consistent body-only refactoring via `WidgetShell`, versioned localStorage (`ops-dashboard.layout.v1`) with registry validation, and full frontend craft (4/4). Held back by type/instance conflation (layout is `WidgetId[]` of type IDs; duplicates blocked), silent user-vs-developer ambiguity (7/10), no generic settings on the contract, and no widget README update.
- **Qwen 3.8-27B-FP8 (reasoning-medium)** scores 34/40 on widgets — ties Q6K and 3.8-4bit thinking-off for 5th-best, 1 point above thinking-off FP8 on the same checkpoint. Clean `WidgetDef` contract, `WIDGET_TYPES` registry in `widgets/registry.ts`, versioned localStorage (`ops-dashboard.layout.v1`) with registry validation, native HTML5 drag-and-drop, consistent body-only refactoring via `WidgetCard`, full frontend craft (4/4), and a good widget README with an adding-a-widget guide. Held back by type/instance conflation (layout is `string[]` of type IDs; duplicates blocked) and silent user-vs-developer ambiguity (7/10).
- **Qwen 3.6-27B-Q6K (unsloth)** scores 34/40 on widgets — behind 3.8-4bit reasoning-medium (39), DS-V4-Flash-0731 (37), 27B-8bit (35.5), and 35B-A3B-8bit pair (35). Perfect `WidgetDefinition`/`WidgetInstance` type separation with a proper `instanceId`, full frontend craft marks (4/4), versioned localStorage key (`dashboard-layout-v1`), and consistent minimal widget refactoring (body content only). Held back by silent ambiguity-handling (7/10) and no widget README documentation. Lost widget subtitles from the original headers, replacing them with a drag-handle toolbar.
- **Qwen 3.6-27B-8bit (Local)** is third on widgets (35.5/40): perfect type/instance separation, zero frontend bugs, full marks on frontend craft, and strong ambiguity-handling.
- **Qwen 3.6-35B-A3B-8bit (agent-pair)** is the runner-up on widgets (35/40) — near-identical architecture to the 27B-8bit with a generic `WidgetPlugin<TData>` contract, perfect type/instance split, and versioned localStorage key (`widget-layout-v1`). A massive improvement over its 4-bit solo run (28/40), suggesting observer feedback significantly improved architectural quality. Full marks on existing-code respect (8/8).
- **Claude Opus 4.6 (GitHub Copilot)** scores 33.5/40 on widgets — ties Laguna, 1.5 points above Sonnet (32/40). Clean `WidgetDefinition` contract (`type`/`label`/`colSpan`/`component`), Map registry with `registerWidget()` and warn-on-duplicate, both user customization (add/remove/reorder/reset) and developer extensibility implemented, consistent span-via-wrapper refactoring, and full code quality (4/4). Held back by type/instance conflation (layout is `string[]` of type IDs; React keys are `${type}-${idx}`), silent user-vs-developer ambiguity (8/10 — implemented both, named neither), no settings on the contract, an unversioned localStorage key (`dashboard-layout`), and no widget README update (adding-a-widget guide lives in `widgets/index.ts`).
- **Laguna S 2.1-NVFP4** scores 33.5/40 on widgets — ties Opus, just behind Q6K and ahead of Ternary Bonsai / cloud 27B-4bit. Generic `WidgetDefinition<TData>`, Map registry with side-effect self-registration, clear `WidgetDefinition`/`LayoutItem` split, registry-validated localStorage, and a good README with an architecture table and add-a-widget guide. Held back by silent user-vs-developer ambiguity, `as` casts that erase the generic at render sites, no versioned storage key, and blocking duplicate widget types.
- **Qwen 3.6-27B-4bit** is the strongest cloud Qwen on widgets (33/40), with better ambiguity-handling and cleaner extensibility mechanics.
- **DeepSeek-V4-REAP-180B** ties with Sonnet on widgets (32/40), with the best code quality score (4/4) and strong ambiguity-handling (8/10), but partially conflates type/instance like some Qwen variants.
- **NVFP4** (NVIDIA official) scores 32/40 on widgets — tied with Sonnet and DeepSeek. Clean registry with perfect type/instance separation (`WidgetType` vs `PlacedWidget`), full existing-code respect (8/8, widgets unchanged), and working localStorage persistence. Loses points on no settings abstraction, CSS duplication, and silent ambiguity-handling.
- **Unsloth-NVFP4** scores 31/40 on widgets — 1 point below the NVIDIA official. Clean registry with `WidgetMetadata`, versioned localStorage key (`dashboard-layout-v1`), and minimal consistent widget refactoring (just a `registerWidget()` call added to each). Partial type/instance split (instance `id` stores type id, no duplicate widget types allowed). Main bug: layout migration condition is always false, preventing new widget types from appearing in existing saved layouts.
- **AEON-NVFP4** scores 30.5/40 on widgets — strong architectural judgment (13/14, matching the 8-bit) with perfect type/instance separation, but loses points on dead persistence code and a runtime-breaking typo (`setSets` instead of `setServices`).
- **Qwen 3.6-35B-A3B-4bit** preserves existing code best but under-specifies type-vs-instance modeling.
- Sonnet remains strongest in documentation quality, though DeepSeek's README is also notably good; Laguna's README is in the same "good architecture docs" tier.
- **Ornith-1.0-35B** scores 30/40 on widgets — solid ambiguity-handling (8/10, tied for second-best) and clean code quality (3/4), but the same type/instance conflation as several other models. Minimal widget refactoring (CSS class suffix only) shows good existing-code respect. Minor React issues: ineffective `useMemo`, palette positioning, toggle/click-outside conflict.
- **Step-3.7-Flash** scores lowest among competitive models (27/40) on widgets. Its registry pattern is clean, but the widget contract is shallow (`pollInterval` declared but never consumed by the framework), and the README was not updated.
- **Ternary Bonsai 27B** scores 33/40 on widgets — the strongest widget performance among the bottom four models, and tied with the cloud Qwen 4-bit build. The architecture is clean: `WidgetDefinition`/`WidgetInstance` type separation, versioned localStorage (`ops-dashboard-layout-v1`) with registry validation on load, and surgical minimal refactoring of all five widgets. Deducted for unused `WidgetConfigSchema` infrastructure, a duplicate `WidgetInstance` definition in the same file, and no README documentation.
- **[Muse Glimmer 30B K-Quant Dynamic](https://huggingface.co/meta-models/Muse-Glimmer-30B-GGUF/)** scores 31/40 on widgets. It correctly separates catalog definitions from placed instances, centralizes the available widgets in one registry, adds practical add/remove/reorder customization backed by localStorage, and leaves all five working widget components untouched. The design is held back by silent scope choices, no per-widget settings abstraction, a one-instance-per-type guard, unversioned persistence, missing documentation, and a fragile unimported `React.ComponentType` reference.
- **[Muse Glimmer 30B Q4_K_XL (unsloth)](https://huggingface.co/unsloth/Muse-Glimmer-30B-GGUF)** scores 29/40 on widgets — 2 points below the official K-Quant Dynamic build. Correct type/instance split (`WidgetMetadata` vs `LayoutItem` with `instanceId`, supporting duplicates), a clean centralized `WidgetRegistry` class, and all five original widgets left byte-for-byte untouched. Held back by silently picking both the user- and developer-facing pluggability fork without naming the tradeoff (5/10 ambiguity), an incomplete drag-and-drop implementation (handlers wired up but `handleDrop` does nothing), a `React.ComponentType<any>` escape hatch, an unversioned localStorage key, and no README update.
- **Agents A1 FP8** scores 24/40 on widgets. The `WidgetConfig` registry is clean and centralized, but `WidgetInstance.id` conflates instance identity with widget type ID — the deepest type/instance conflation in the benchmark alongside Qwen 3.6-35B-A3B-4bit. This means duplicate widget types cannot be placed and React would fire key warnings. Layout starts with an empty dashboard (no default widgets). The refactoring of all 5 widgets is consistent but loses original column-span fidelity (7-col and 5-col placements replaced by a 2-tier "normal/wide" system). `React.createElement(widgetDef.render)` is an unusual pattern that should be `<widgetDef.render />`.

---

## Frontend Issues Found

| Issue | 3.8-27B-FP8 | 3.8-FP8 (med) | 3.8-27B-4bit | 3.8-4bit (med) | 27B-Q6K | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | NVFP4 | Unsloth-NVFP4 | AEON-NVFP4 | Sonnet | Opus 4.6 | DS-V4-REAP-180B | DS-V4-0731-IQ3 | Ornith-35B-8bit | Step-3.7-Flash | A1-FP8 | Ternary-27B | Laguna-S2.1 |
|-------|-------------|---------------|--------------|----------------|---------|------------------|---------------|----------|--------------|---------------------|-------|---------------|------------|--------|----------|-----------------|----------------|-----------------|----------------|--------|-------------|-------------|
| Conditional hook call (Rules of Hooks violation) | — | — | — | — | — | ❌ Bug | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| Incorrect drag event (`onDrag` vs `onDrop`) | — | — | — | — | — | ❌ Bug | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| Runtime-breaking typo (`setSets` vs `setServices`) | — | — | — | — | — | — | — | — | — | — | ❌ Bug | — | — | — | — | — | — | — | — | — | — | — |
| Type-vs-instance conflation risk | ⚠️ Partial (layout is type IDs; no duplicates) | ⚠️ Partial (layout is type IDs; no duplicates) | ⚠️ Partial (no instance ID; one per type) | — | — | — | — | ⚠️ Partial | ❌ Clear gap | — | — | ⚠️ Partial (instance id = type id; no duplicate widget types) | — | ⚠️ Partial (no duplicate widgets) | ⚠️ Partial (layout is type IDs; `${type}-${idx}` keys) | ⚠️ Partial (no instance concept) | — | ⚠️ Partial (no duplicates) | ⚠️ Partial (no duplicates) | ❌ Clear gap (instanceId = typeId; React key bug) | — | ⚠️ Partial (`LayoutItem.widgetId` = type id; no duplicates) |
| Dead persistence code (exists but unused) | — | — | — | — | — | — | — | — | — | — | ⚠️ Tech debt | — | — | — | — | — | — | — | — | — | — | — |
| Dead code (`\|\| true`, `&& false`) | — | — | — | — | — | — | — | — | — | — | — | ⚠️ Sloppy | — | — | — | — | — | — | — | — | — | — |
| CSS duplication (duplicate class definitions) | — | — | — | — | — | — | — | — | — | ⚠️ Sloppy | — | — | — | — | — | — | — | — | — | — | — | — |
| Unused contract fields (`pollInterval` dead weight) | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ⚠️ Minor | — | ⚠️ Minor (`WidgetConfigSchema` defined, never used or wired) | — | — | — |
| Ineffective `useMemo` / palette positioning | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ⚠️ Minor | — | — | — | — | — | — |
| `React.createElement(fn)` instead of component type | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ⚠️ Minor | — | — | — | — |
| Layout migration logic bug (always-false condition) | — | — | — | — | — | — | — | — | — | ⚠️ Bug | — | — | — | — | — | — | — | — | — | — | — | — |
| Lost widget subtitles in header refresh | — | — | ⚠️ Minor | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| No default widgets (starts empty) | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ⚠️ UX gap | — | — |
| Duplicate type definition in same file | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ⚠️ Sloppy (`WidgetInstance` defined twice in `widget-types.ts`) | — |
| Generic erased by `as` casts in render | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ⚠️ Minor (`TData` cast away at every widget) |
| Unversioned localStorage key | — | ⚠️ Minor (`dashboard-layout`, no version) | — | — | — | — | — | — | — | — | — | — | — | — | ⚠️ Minor (`dashboard-layout`, no version) | — | ⚠️ Minor (`ops-dashboard:widget-layout`, no version) | — | — | — | — | ⚠️ Minor (`dashboard:layout`, no `:v1`) |

---

## Analysis (Widgets Task)

### Where Qwen 3.8-27B-4bit (reasoning-medium) Led

1. **Best widget score overall (39/40)** — tops every other model, including the previous best (DS-V4-Flash-0731 at 37/40). Full marks on ambiguity-handling (10/10 — the only perfect score on this dimension), existing-code respect (8/8), frontend craft (4/4), and code quality (4/4). Architectural judgment 13/14, losing only the settings-abstraction point.
2. **Names both pluggability forks**: the README documents user customization (add/remove/reorder/reset) and developer extensibility (create a component, register it) as two interpretations of "pluggable" — the strong response the rubric asks for.
3. **Perfect type/instance split** with unique instance `key`s (`crypto.randomUUID()`), constraint to one-per-type enforced in the UI rather than the data model, versioned localStorage with registry validation, and native HTML5 drag-and-drop.

### Where Qwen 3.8-27B-FP8 (reasoning-medium) Was Competitive

1. **Ties Q6K and 3.8-4bit thinking-off for 5th-best widget score (34/40)** — 1 point above thinking-off FP8 on the same checkpoint, 5 points below 3.8-4bit reasoning-medium.
2. **Full frontend craft (4/4) and code quality (4/4)**: No hook violations, type-safe drag event handlers, proper effect cleanup, versioned localStorage with registry validation.
3. **Good widget README** with layout customization and a 3-step adding-a-widget guide — one of the better-documented widget implementations.
4. **Native HTML5 drag-and-drop** for reordering without adding a grid layout library dependency.

### Where DS-V4-Flash-0731 IQ3_XXS Led

1. **Second-best widget score overall (37/40)** — tops every model except 3.8-4bit reasoning-medium, including the previous runner-up (27B-8bit at 35.5/40). Full marks on architectural judgment (13/14), existing-code respect (8/8), frontend craft (4/4), and code quality (4/4). Ambiguity-handling 8/10 (silent on the user-vs-developer fork).
2. **Perfect widget type/instance separation**: `WidgetDefinition` vs `WidgetInstance` with a proper `instanceId`, Map registry with `registerWidget()` and duplicate detection (`throw` on duplicate IDs), `sanitize()` validation on localStorage load.
3. **Excellent widget README** with layout customization and adding-a-widget guide with code sample.

### Where Local 8-bit Led

1. **Third-best widget score (35.5/40)** — behind 3.8-4bit reasoning-medium (39) and DS-V4-Flash-0731 (37) but ahead of Q6K (34) and 35B-A3B-8bit pair (35), with stronger ambiguity-handling (8.5 vs 7-8) than most of the pack.
2. Perfect `WidgetType`/`WidgetInstance` separation, self-registering pattern, zero frontend bugs (4/4 frontend craft).

### Where Qwen 3.8-27B-4bit (thinking off) Was Competitive

1. **Ties Q6K for 5th-best widget score (34/40)** — 1 point above the FP8 thinking-off runner-up on the same base model, 5 points below the reasoning-medium run on the same GGUF.
2. **Full frontend craft (4/4)**: No hook violations, proper `useCallback` with functional `setState`, correct `useEffect` dependencies.
3. **Good widget README** with pluggable-widgets architecture and adding-a-widget guide — one of the better-documented widget implementations.

### Where Q6K Led

1. **Perfect widget type/instance separation** with a proper `instanceId`, supporting multiple instances of the same widget type.
2. **Top frontend craft (4/4)**: No hook violations, no drag event bugs, proper `useCallback` stability, correct `useEffect` cleanup.

### Where Claude Opus 4.6 Was Competitive

1. **Ties Laguna for 6th-best widget score (33.5/40)** — 1.5 points above Sonnet (32/40). Full code quality (4/4), clean Map registry, both user and developer forks implemented, consistent span-via-wrapper refactoring.
2. **Held back by type/instance modeling**: layout is `string[]` of type IDs with `${type}-${idx}` React keys — the same class of gap as several Qwen 3.8 thinking-off / FP8-med runs, not the perfect `WidgetInstance` split of the 39/40 winner.
3. **Silent on the user-vs-developer fork** (8/10): implemented both, named neither. Adding-a-widget guide lives in `widgets/index.ts`; README unchanged.

### Where Sonnet Was Competitive

1. **Documentation quality**: Produces the richest documentation (`WIDGET_GUIDE.md`, `EXAMPLE_NEW_WIDGET.md`).
2. **32/40 on widgets** with strong architectural judgment (13/14) — 1.5 points behind Opus, which traded some architecture points for better existing-code respect and code quality.

### Where DeepSeek-V4-REAP-180B Was Competitive

1. **Widget code quality (4/4)**: One of a small set (alongside DS-V4-Flash-0731, 3.8-4bit reasoning-medium, 3.8-FP8 reasoning-medium, and Opus 4.6) to score full marks on code quality for widgets — excellent README with architecture diagram and "Adding a new widget" guide.
2. **Widget ambiguity-handling (8/10)**: Tied with DS-V4-Flash-0731, Opus 4.6, and Qwen 27B-4bit for the second-best widget ambiguity scores (behind 3.8-4bit reasoning-medium at 10/10).

### Where 35B-A3B-8bit (Agent-Pair) Was Competitive

1. **Fourth-best widget score (35/40)**: Only 0.5 points behind 27B-8bit, with the same perfect type/instance separation and generic `WidgetPlugin<TData>` contract.
2. **Agent-pair uplift**: Widget score from 28 (4-bit solo) to 35 — a +7 point improvement, demonstrating that iterative review catches structural gaps.
3. **Versioned localStorage key**: `widget-layout-v1` suggests awareness of future migration needs.

### Where Other Variants Stood Out (Widgets)

1. **[Laguna S 2.1-NVFP4](https://huggingface.co/poolside/Laguna-S-2.1-NVFP4)**: 33.5/40 — ties Opus; generic `WidgetDefinition<TData>`, clean registry, one of the better READMEs.
2. **Qwen 3.6-27B-NVFP4**: 32/40 — balanced, perfect type/instance separation, widgets unchanged.
3. **Qwen 3.6-27B-AEON-NVFP4**: Highest widget architecture score (13/14) among community fine-tunes; dragged down by runtime typo and dead persistence code.

### Where Models Fell Short (Widgets)

**Agents A1 FP8 (24/40)**
- `WidgetInstance.id` stores widget type ID, not unique instance key — deepest type/instance conflation in the benchmark (tied with Qwen 3.6-35B-A3B-4bit).
- Dashboard starts empty (no default widgets).
- No README update.

**Step-3.7-Flash (27/40)**
- Shallow widget contract (`pollInterval` declared but never consumed).
- No documentation.

**Ornith-1.0-35B (30/40)**
- Type/instance conflation like most non-8bit models.
- Metadata duplication between registry and widget-internal headers.
- Minor React issues (ineffective `useMemo`, palette positioning).

### Cross-Task Patterns (Widget-Relevant)

- **Ambiguity naming is weak overall**: most models silently pick user customization + developer extensibility without naming the tradeoff. The 4bit reasoning-medium run is the exception (10/10). Opus implements both forks (8/10) but does not name them.
- **Widget settings contracts remain shallow**: none delivered a full per-instance settings abstraction end-to-end.
- **Agent-pair mode improves widget architecture**: 35B-A3B-8bit pair (35/40 widgets) vs 4-bit solo (28/40) — observer feedback catches type/instance modeling gaps.

---

See also: [Task 1 — Resumable Sync](./RESULTS-TASK1-RESUMABLE-SYNC.md) · [Overall results](./README.md)
