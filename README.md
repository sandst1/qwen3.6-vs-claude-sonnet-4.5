# Benchmark: Ten-Model Comparison (Qwen + Sonnet + DeepSeek + Step + Ornith)

A side-by-side comparison of ten AI model variants on non-trivial coding tasks designed to test **architectural judgment** and **ambiguity-handling** - not just raw correctness.

This benchmark is intentionally built around **underspecified, real-world prompts** run against existing small codebases. The point is to measure how models resolve ambiguity, choose scope, and preserve working systems under realistic constraints - not whether they can produce a syntactically correct patch.

Methodology highlights (from [BENCHMARK.md](./BENCHMARK.md)):
- Each model gets the same starter code and the same prompt text, with no extra "helpful" clarification.
- Agent runs are allowed to complete without guidance; if a model asks questions, responses are brief and non-leading.
- Scoring uses rubric dimensions beyond correctness: architectural judgment, ambiguity-handling, existing-code respect, failure-mode reasoning, and code quality.
- Results are best interpreted over multiple runs per (model, task) because agent-mode behavior introduces run-to-run variance.

## Tasks

| Task | Directory | Description | Core Challenge |
|------|-----------|-------------|----------------|
| **Resumable Sync** | `*/resumable-sync/` | Make a GitHub→SQLite sync script resumable after crashes | Picking the right checkpointing granularity |
| **Pluggable Widgets** | `*/pluggable-widgets/` | Make a React dashboard widget system pluggable | Deciding "pluggable for whom" (users vs developers) |

See [BENCHMARK.md](./BENCHMARK.md) for the full rubric and methodology.

## Results

### Total Scores (out of 80)

| Model | Task 1 (Sync) | Task 2 (Widgets) | **Total** | % |
|-------|---------------|------------------|-----------|---|
| **Qwen 3.6-27B-8bit (Local)** | 31 / 40 | 35.5 / 40 | **66.5** | 83.1% |
| **Claude Sonnet 4.5** | 33 / 40 | 32 / 40 | **65** | 81.25% |
| **Qwen 3.6-35B-A3B-8bit (Local, agent-pair)** | 29 / 40 | 35 / 40 | **64** | 80% |
| **[DeepSeek-V4-Flash-REAP-180B](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B)** | 30 / 40 | 32 / 40 | **62** | 77.50% |
| **Qwen 3.6-27B-4bit** | 26 / 40 | 33 / 40 | **59** | 73.75% |
| **Qwen 3.6-35B-A3B-4bit** | 31 / 40 | 28 / 40 | **59** | 73.75% |
| **Qwen 3.6-27B-AEON-NVFP4** | 27 / 40 | 30.5 / 40 | **57.5** | 71.88% |
| **Qwen 3.6-27B-4bit (OpenRouter)** | 26 / 40 | 28 / 40 | **54** | 67.50% |
| **[Ornith-1.0-35B-8bit](https://huggingface.co/deepreinforce-ai/Ornith-1.0-35B-GGUF)** | 21 / 40 | 30 / 40 | **51** | 63.75% |
| **[Step-3.7-Flash IQ4_XS](https://huggingface.co/stepfun-ai/Step-3.7-Flash-GGUF)** | 19 / 40 | 27 / 40 | **46** | 57.50% |

**Winner: Qwen 3.6-27B-8bit (Local, unsloth)** at 66.5/80.  
Runner-up: **Claude Sonnet 4.5** at 65/80.  
Third: **Qwen 3.6-35B-A3B-8bit (Local, agent-pair)** at 64/80 — the same 35B-A3B architecture in FP8 quantization, run with agent-pair observer feedback.  
Fourth: **[DeepSeek-V4-Flash-REAP-180B](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B)** at 62/80 — a REAP-pruned 180B MoE running on a single DGX Spark.  
Best cloud Qwen variants (tie): **Qwen 3.6-27B-4bit** and **Qwen 3.6-35B-A3B-4bit** at 59/80.  
**[Ornith-1.0-35B-8bit](https://huggingface.co/deepreinforce-ai/Ornith-1.0-35B-GGUF)** at 51/80 — a 35B MoE model marketed for agentic coding, run locally via llama.cpp at Q8_0 quantization.

> **Note on Qwen 3.6-35B-A3B-8bit (agent-pair):** This is the same Qwen 3.6-35B-A3B model in FP8 (8-bit) quantization, run locally with **agent-pair** mode — a pair-programming setup where an observer model reviews the coder's work in real-time and provides feedback. Both coder and observer are the same model (`Qwen3.6-35B-A3B-FP8`). The 8-bit quantization + observer feedback boosts the total from 59/80 (4-bit solo) to 64/80, primarily through a dramatically improved widget score (35 vs 28). The sync score drops slightly (29 vs 31) due to dead code and a commit ordering issue the observer flagged but was not fully addressed.

> **Note on the OpenRouter entry:** the run in `qwen3.6-27B-4bit-openrouter/` was originally mislabeled as "8-bit"; it is believed to be a 4-bit quantized model served via OpenRouter, based on scoring patterns and output style. The locally run unsloth 8-bit results are now tracked separately in `qwen3.6-27B-8bit/`.

> **Note on DeepSeek-V4-Flash-REAP-180B:** This is a [REAP-pruned](https://github.com/CerebrasResearch/reap) derivative of [DeepSeek-V4-Flash](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash), compressed from 641B to ~180B parameters via router-weighted expert activation pruning. It runs on a single NVIDIA DGX Spark. See the [model card](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B) for details.

> **Note on Qwen 3.6-27B-AEON-NVFP4:** This is "Qwen3.6-27B-AEON-Ultimate-Uncensored" — a community fine-tune of Qwen 3.6-27B — run locally in NVIDIA FP4 quantization. It scores 57.5/80, below the standard Qwen 3.6-27B-4bit (59/80), suggesting the uncensored fine-tune and aggressive FP4 quantization slightly degrade architectural reasoning compared to a vanilla 4-bit quant. Its widget implementation has a runtime-breaking typo and dead persistence code, but the core architecture (registry + type/instance split) is sound.

> **Note on Ornith-1.0-35B-8bit:** This is [DeepReinforce's Ornith-1.0-35B](https://huggingface.co/deepreinforce-ai/Ornith-1.0-35B-GGUF), a 35B-parameter sparse MoE (architecture: `qwen35moe`) specifically post-trained for agentic coding via RL, run locally via llama.cpp at Q8_0 quantization (36.9 GB). Despite strong benchmark results on agentic coding benchmarks like Terminal-Bench 2.1 and SWE-Bench, it places 9th of 10 on this benchmark — a transaction ordering bug and comment-fetch scope regression on the sync task (21/40) and type/instance conflation on widgets (30/40) indicate that benchmark-optimized agentic coding skills don't automatically transfer to architectural judgment under ambiguity.

> **Note on Step-3.7-Flash IQ4_XS:** This is [StepFun's Step-3.7-Flash](https://huggingface.co/stepfun-ai/Step-3.7-Flash-GGUF), a 198B-parameter sparse MoE (activating ~11B per token) in IQ4_XS quantization (105 GB), run locally via llama.cpp. Despite being the largest model by total parameters in this benchmark, it scores last — the `since`-based conflation on the sync task (19/40) and shallow widget contract (27/40) suggest the small active parameter count (~11B) limits architectural reasoning depth.

---

## Task 1: Resumable Sync

### Score Breakdown

| Criterion | Max | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | AEON-NVFP4 | Sonnet 4.5 | DS-V4-REAP-180B | Ornith-35B-8bit | Step-3.7-Flash |
|-----------|-----|------------------|---------------|----------|--------------|---------------------|------------|------------|-----------------|-----------------|----------------|
| Architectural judgment | 12 | 10 | 8 | 8 | 10 | 10 | 9 | 11 | 10 | 7 | 7 |
| Ambiguity-handling | 10 | 7 | 6 | 5 | 7 | 7 | 5 | 7 | 7 | 5 | 2 |
| Existing-code respect | 8 | 8 | 8 | 8 | 8 | 7 | 8 | 8 | 8 | 6 | 6 |
| Debugging / failure-mode | 6 | 3 | 2 | 3 | 3 | 3 | 3 | 4 | 3 | 2 | 3 |
| Code quality | 4 | 3 | 2 | 2 | 3 | 2 | 2 | 3 | 2 | 1 | 1 |
| **Total** | **40** | **31** | **26** | **26** | **31** | **29** | **27** | **33** | **30** | **21** | **19** |

### Architectural Approaches

| Aspect | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | AEON-NVFP4 | Sonnet 4.5 | DS-V4-REAP-180B | Ornith-35B-8bit | Step-3.7-Flash |
|--------|------------------|---------------|----------|--------------|---------------------|------------|------------|-----------------|-----------------|----------------|
| **State tables** | 1 table: `sync_progress` | 1 table: `sync_progress` | 1 table: `sync_progress` | 1 table: `sync_progress` | 1 table: `sync_state` | 1 table: `sync_state` | 2 tables: `sync_state` + `pending_comments` | 1 table: `sync_checkpoints` | 1 table: `sync_state` | 1 table: `sync_state` |
| **Checkpoint granularity** | Per-page | Per-issue | Per-issue | Per-page | Per-page | Per-page | Per-page (+ deferred comments checkpointing) | Per-page | Per-page | `since`-based (timestamp) |
| **Comments handling** | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, dead `start_page` param (always 1) | Inline fetch, no inner checkpoint | Deferred to separate pass with per-issue checkpoint | Inline fetch, no inner checkpoint (error-caught) | Inline fetch, no inner checkpoint (scope bug) | Inline fetch, try/except per issue |
| **Checkpoint/data transaction coupling** | Weak (separate commits) | Weak | Stronger (same commit path) | Weak (separate commits) | Weak (separate commits) | Weak (separate commits) | Medium (implicit/partially coupled) | Weak (separate commits) | Weak (progress saved after commit; last-repo never committed) | Weak (state lags one issue) |
| **CLI reset flag** | `--reset` | None | None | None | None | `--fresh` | `--reset` | None | None | None |
| **README update** | Yes | No | No | Yes | No | No | Yes | No | No | No |

**Key differences**:
- Sonnet remains the only model that explicitly addresses nested-loop resumability in architecture.
- Local 8-bit and 35B-A3B-4bit both choose per-page granularity and both score 31/40 on this task.
- **35B-A3B-8bit (agent-pair)** also picks per-page granularity (29/40) — correct architecture but loses points on dead code (`total_pages` miscalculation, unused `start_page` parameter in `sync_comment_pages`) and no documentation. The observer feedback identified issues, but not all were addressed in the final version.
- DeepSeek-V4-REAP-180B also picks per-page granularity (scoring 30/40), matching the right answer but losing points on documentation and transaction coupling.
- **AEON-NVFP4** picks per-page granularity (correct) and scores 27/40 — solid existing-code respect (8/8) but loses points on documentation (README unchanged) and silent ambiguity-handling.
- Both OpenRouter 27B variants converge on per-issue checkpointing, which is workable but heavier than needed.
- Local 8-bit adds a `--reset` flag and updates the README — matching Sonnet's operational completeness. AEON-NVFP4 adds `--fresh` but doesn't update docs.
- **Ornith-1.0-35B picks per-page granularity** (matching the stronger models) but undermines it with a transaction ordering bug — `save_progress` is called *after* `conn.commit()`, leaving the checkpoint in a separate implicit transaction. For the last repo, the progress is never durably stored. It also introduced a comment-fetch scope regression (comments fetched for PRs too, not just issues).
- **Step-3.7-Flash is the only model to conflate resumability with incremental sync** — using GitHub's `since` parameter rather than page-based checkpointing. The rubric explicitly flags this as a different feature ("incremental refresh, not crash recovery"). It also changed the sort order from `created` to `updated`, breaking the pagination stability the original code deliberately maintained.

### Strong/Weak Signals

| Signal | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | AEON-NVFP4 | Sonnet | DS-V4-REAP-180B | Ornith-35B-8bit | Step-3.7-Flash |
||--------|-----------------|---------------|----------|----------------|---------------------|------------|--------|-----------------|-----------------|----------------|
|| State stored in `issues.db` (not JSON) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
|| Per-repo cursors | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
|| State in same transaction as page commits | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ |
|| Notes per-page-vs-per-record tradeoff | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
|| Updates README | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Uses `since` (conflates with resumability) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ ⚠️ conflated |

---

## Task 2: Pluggable Widgets

### Score Breakdown

| Criterion | Max | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | AEON-NVFP4 | Sonnet 4.5 | DS-V4-REAP-180B | Ornith-35B-8bit | Step-3.7-Flash |
|-----------|-----|------------------|---------------|----------|--------------|---------------------|------------|------------|-----------------|-----------------|----------------|
| Architectural judgment | 14 | 13 | 11 | 11 | 10 | 13 | 13 | 13 | 10 | 9 | 9 |
| Ambiguity-handling | 10 | 8.5 | 5 | 8 | 5 | 7 | 7 | 6 | 8 | 8 | 6 |
| Existing-code respect | 8 | 7 | 7 | 7 | 8 | 8 | 5.5 | 7 | 7 | 7 | 7 |
| Frontend craft | 4 | 4 | 2 | 3 | 3 | 3.5 | 2 | 3 | 3 | 3 | 3 |
| Code quality | 4 | 3 | 3 | 4 | 2 | 3.5 | 3 | 3 | 4 | 3 | 2 |
| **Total** | **40** | **35.5** | **28** | **33** | **28** | **35** | **30.5** | **32** | **32** | **30** | **27** |

### Architectural Approaches

| Aspect | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | AEON-NVFP4 | Sonnet 4.5 | DS-V4-REAP-180B | Ornith-35B-8bit | Step-3.7-Flash |
|--------|------------------|---------------|----------|--------------|---------------------|------------|------------|-----------------|-----------------|----------------|
| **Widget contract** | `WidgetType` interface (no generic settings) | `WidgetDescriptor<TData>` generic | `WidgetDescriptor<T>` generic | `WidgetDef` (minimal, non-generic settings) | `WidgetPlugin<TData>` generic | `WidgetType` interface (no generic settings) | `WidgetDefinition` (no generic) | `WidgetDefinition` (no generic settings) | `WidgetDef` (no generic settings) | `WidgetDefinition` (no generic, unused `pollInterval`) |
| **Registration pattern** | Map registry + `registerWidget()` + side-effect imports | Class + side-effect imports | Map registry + `registerWidget()` + side-effect imports | `WidgetRegistry` + `BUILTIN_WIDGETS` catalog | Map registry + `registerWidget()` + side-effect imports | Class `WidgetRegistry` + side-effect imports | Plain object registry | Map registry + `defineWidget()` | Array registry (`widgetRegistry`) — no self-registration | Class `WidgetRegistry` + side-effect imports |
| **Type/instance split** | ✅ Perfect | ✅ | ⚠️ Partial (type IDs used as instances) | ❌ Conflated | ✅ Perfect (`WidgetPlugin` vs `WidgetEntry`) | ✅ Perfect (`WidgetType` vs `LayoutEntry`) | ✅ | ⚠️ Partial (`activeIds` is `string[]` of type IDs) | ⚠️ Partial (no instance concept, no duplicates) | ⚠️ Partial (no duplicate widgets allowed) |
| **Layout persistence** | localStorage | In-memory only | localStorage (`dashboard-config`) | localStorage (`dashboard-layout`) | localStorage (`widget-layout-v1`) | Dead code (exists but never wired up) | localStorage | localStorage (`dashboard-layout`) | localStorage (`ops-dashboard-layout`) | localStorage (`dashboard-config`) |
| **Widget refactoring strategy** | Minimal (body content only, all 5 consistent) | Rewrote all 5 widgets | Rewrote all 5 widgets consistently | Kept existing widgets mostly unchanged | Consistent (pure render + registration, all 5) | Consistent (component + config + register, all 5) | Left widgets byte-for-byte identical | Consolidated all 5 into `widgets.tsx` | Minimal (CSS class suffix only, all 5 consistent) | Appended `widgetDefinition` export to each (minimal) |
| **Adding 6th widget** | 2 files | 2-3 files | 1-2 files | 1 file | 2 files | 2 files | 2 files | 1 file (`defineWidget()` call) | 2 files (widget + registry entry) | 2 files (widget + registry import) |
| **Documentation** | None | None | Minimal (mostly code-level) | Minimal | None | None | `WIDGET_GUIDE.md` + `EXAMPLE_NEW_WIDGET.md` | Good README with architecture + guide | None (README unchanged) | None (README unchanged) |

**Key differences**:
- **Qwen 3.6-27B-8bit (Local)** is the strongest on widgets overall (35.5/40): perfect type/instance separation, zero frontend bugs, full marks on frontend craft, and strong ambiguity-handling.
- **Qwen 3.6-35B-A3B-8bit (agent-pair)** is the runner-up on widgets (35/40) — near-identical architecture to the 27B-8bit with a generic `WidgetPlugin<TData>` contract, perfect type/instance split, and versioned localStorage key (`widget-layout-v1`). A massive improvement over its 4-bit solo run (28/40), suggesting observer feedback significantly improved architectural quality. Full marks on existing-code respect (8/8).
- **Qwen 3.6-27B-4bit** is the strongest cloud Qwen on widgets (33/40), with better ambiguity-handling and cleaner extensibility mechanics.
- **DeepSeek-V4-REAP-180B** ties with Sonnet on widgets (32/40), with the best code quality score (4/4) and strong ambiguity-handling (8/10), but partially conflates type/instance like some Qwen variants.
- **AEON-NVFP4** scores 30.5/40 on widgets — strong architectural judgment (13/14, matching the 8-bit) with perfect type/instance separation, but loses points on dead persistence code and a runtime-breaking typo (`setSets` instead of `setServices`).
- **Qwen 3.6-35B-A3B-4bit** preserves existing code best but under-specifies type-vs-instance modeling.
- Sonnet remains strongest in documentation quality, though DeepSeek's README is also notably good.
- **Ornith-1.0-35B** scores 30/40 on widgets — solid ambiguity-handling (8/10, tied for second-best) and clean code quality (3/4), but the same type/instance conflation as several other models. Minimal widget refactoring (CSS class suffix only) shows good existing-code respect. Minor React issues: ineffective `useMemo`, palette positioning, toggle/click-outside conflict.
- **Step-3.7-Flash** scores lowest (27/40) on widgets. Its registry pattern is clean, but the widget contract is shallow (`pollInterval` declared but never consumed by the framework), and the README was not updated.

### Frontend Issues Found

| Issue | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | AEON-NVFP4 | Sonnet | DS-V4-REAP-180B | Ornith-35B-8bit | Step-3.7-Flash |
|-------|-----------------|---------------|----------|----------------|---------------------|------------|--------|-----------------|-----------------|----------------|
| Conditional hook call (Rules of Hooks violation) | — | ❌ Bug | — | — | — | — | — | — | — | — |
| Incorrect drag event (`onDrag` vs `onDrop`) | — | ❌ Bug | — | — | — | — | — | — | — | — |
| Runtime-breaking typo (`setSets` vs `setServices`) | — | — | — | — | — | ❌ Bug | — | — | — | — |
| Type-vs-instance conflation risk | — | — | ⚠️ Partial | ❌ Clear gap | — | — | — | ⚠️ Partial (no duplicate widgets) | ⚠️ Partial (no instance concept) | ⚠️ Partial (no duplicates) |
| Dead persistence code (exists but unused) | — | — | — | — | — | ⚠️ Tech debt | — | — | — | — |
| Dead code (`\|\| true`, `&& false`) | — | — | — | — | — | — | ⚠️ Sloppy | — | — | — |
| Unused contract fields (`pollInterval` dead weight) | — | — | — | — | — | — | — | — | — | ⚠️ Minor |
| Ineffective `useMemo` / palette positioning | — | — | — | — | — | — | — | — | ⚠️ Minor | — |

---

## Analysis by Criterion

### Where Local 8-bit Won

1. **Best aggregate score (66.5/80)**: The only model that scores top-tier on both tasks simultaneously.
2. **Widget architecture**: Perfect `WidgetType`/`WidgetInstance` separation, self-registering pattern, zero frontend bugs (4/4 frontend craft).
3. **Per-page checkpointing + operational completeness**: Matches 35B-A3B-4bit on sync architecture while also adding `--reset` and README documentation.
4. **No frontend bugs**: Only model with clean frontend craft — no hook violations, no drag event errors.

### Where Sonnet Was Competitive

1. **Best sync score (33/40)**: Sonnet is still the strongest on the sync task specifically.
2. **Nested-loop resumability**: Sonnet remains the only implementation that explicitly handles the comments subloop with dedicated architecture.
3. **Documentation quality**: Sonnet produces the richest documentation (`WIDGET_GUIDE.md`, `EXAMPLE_NEW_WIDGET.md`).
4. **Consistency**: Strong in both tasks; no large architectural misses.

### Where DeepSeek Was Competitive

1. **Third overall (62/80)**: Slots in between Sonnet (65) and the Qwen 4-bit variants (59), despite being a pruned model running on a single DGX Spark.
2. **Widget code quality (4/4)**: Only model to score full marks on code quality for widgets — excellent README with architecture diagram and "Adding a new widget" guide.
3. **Widget ambiguity-handling (8/10)**: Tied with Qwen 27B-4bit for the second-best ambiguity score on widgets; silently addressed both user and developer extensibility.
4. **Existing-code style match**: The sync implementation reads like it was written by the original author — matching logging idioms, naming, and function patterns precisely.
5. **Defensive error handling**: Added try/except around individual issue and comment processing in the sync task — a pragmatic robustness improvement not strictly asked for.

### Where 35B-A3B-8bit (Agent-Pair) Was Competitive

1. **Second-best widget score (35/40)**: Only 0.5 points behind 27B-8bit, with the same perfect type/instance separation and generic `WidgetPlugin<TData>` contract.
2. **Agent-pair uplift**: The observer feedback pushed the widget score from 28 (4-bit solo) to 35 — a +7 point improvement on the same architecture, demonstrating that iterative review catches structural gaps that a solo run misses.
3. **Full marks on existing-code respect (8/8 widgets)**: Consistent refactoring of all 5 widgets into pure render functions with registration calls, matching the design language.
4. **Versioned localStorage key**: The `widget-layout-v1` key suggests awareness of future migration needs — a small but telling detail.

### Where Each Other Variant Stood Out

1. **Qwen 3.6-27B-4bit (OpenRouter)**: Weaker overall, but used a generic widget descriptor (`WidgetDescriptor<TData>`).
2. **Qwen 3.6-27B-4bit**: Strongest cloud Qwen on widgets (33/40), with cleaner extensibility and good ambiguity-handling.
3. **Qwen 3.6-35B-A3B-4bit**: Strongest cloud Qwen on sync (31/40), choosing per-page checkpointing and keeping changes surgical.
4. **Qwen 3.6-27B-AEON-NVFP4**: Highest widget architecture score (13/14, tied with 8-bit and 35B-A3B-8bit pair) among community fine-tunes; perfect type/instance separation. Dragged down by dead persistence code, a runtime typo, and lack of documentation.
5. **Shared Qwen strengths**: All variants keep state in SQLite and preserve existing code paths well.

### Where Ornith-1.0-35B Fell Short

1. **Transaction ordering bug undermines the sync checkpoint** — `save_progress` is called *after* `conn.commit()`, so the checkpoint lives in a separate implicit transaction. For the last repo in config, `mark_completed` is never durably committed (`conn.close()` rolls it back).
2. **Comment-fetch scope regression** — refactoring moved the comment-fetch `if` block outside the `upsert_issue` guard, causing comments to be fetched for PRs too. Produces orphaned comment records and wastes API calls.
3. **Misleading docstring** — `save_progress` claims "Called inside the same txn" but this is factually false after the ordering change.
4. **Widget score (30/40) is decent** — strong ambiguity-handling (8/10) and good code quality (3/4), but the same type/instance conflation as most non-Qwen-8bit models, and metadata duplication between the registry and widget-internal headers.
5. **No documentation on either task** — README unchanged for both sync and widgets, no design rationale anywhere.

### Where Step-3.7-Flash Fell Short

1. **Conflated resumability with incremental sync** (only model to do so) — the `since`-based approach doesn't solve crash recovery well.
2. **Broke existing invariants** — changed sort order from `created` to `updated`, undermining pagination stability the original code deliberately maintained.
3. **No documentation at all** — README unchanged on both tasks, no design rationale anywhere.
4. **Shallow widget contract** — `pollInterval` declared but never consumed; no settings abstraction.

### Where All Failed

- **Ambiguity naming is still weak overall**: all models tended to silently pick a branch rather than explicitly framing the tradeoff.
- **Clarifying questions were rare**: none consistently asked high-value, scope-shaping questions.
- **Transactional reasoning is often implicit**: explicit partial-failure discussion is limited in most runs.
- **Widget settings contracts remain shallow**: none delivered a full per-instance settings abstraction end-to-end.
- **Benchmark-optimized agentic coding ≠ architectural judgment**: Ornith-1.0-35B, specifically RL-trained for agentic coding and claiming state-of-the-art on Terminal-Bench 2.1 and SWE-Bench, places 9th of 10 here (51/80). Its transaction ordering bug and comment-fetch regression on the sync task suggest that SWE-Bench-style patch generation doesn't test the same skills as underspecified, ambiguity-heavy design tasks.
- **Step-3.7-Flash underperformance suggests total parameter count ≠ coding skill**: with 198B total but only ~11B active per token, it scored below all 27B dense models (including the AEON fine-tune at NVFP4), reinforcing that active compute matters more than parameter catalog size for architectural reasoning.
- **Agent-pair mode improves execution quality**: The 35B-A3B-8bit agent-pair run (64/80) outperforms the same model's 4-bit solo run (59/80) by +5 points — observer feedback catches structural issues that a solo coding pass misses, particularly on type/instance modeling and widget architecture.

---

## Qualitative Summary

| Dimension | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | AEON-NVFP4 | Sonnet 4.5 | DS-V4-REAP-180B | Ornith-35B-8bit | Step-3.7-Flash |
|-----------|------------------|---------------|----------|--------------|---------------------|------------|------------|-----------------|-----------------|----------------|
| Engineering execution | Strong on both | Solid baseline | Strong on widgets | Strong on sync | Strong on widgets, solid on sync | Solid architecture, sloppy edges | Most balanced | Solid on both | Decent on widgets, weak on sync | Weak on sync, decent on widgets |
| Architectural ambition | Higher/clean | Higher/invasive | Higher/invasive but cleaner | Moderate/conservative | Higher/clean | Higher/clean but unfinished | Conservative/comprehensive | Moderate/clean | Moderate/clean | Moderate/shallow |
| Reasoning transparency | Mostly silent | Silent | Mostly silent | Mostly silent | Mostly silent | Silent | Slightly better | Mostly silent | Silent | Silent |
| Edge-case handling | Missed comments subloop; no UI bugs | Missed nested loop + UI bugs | Better frontend discipline | Better sync failure boundaries | Missed comments subloop; dead start_page param; no UI bugs | Missed comments subloop; runtime typo | Best nested-loop handling | Missed comments subloop; good defensive error handling | Txn ordering bug; comment-fetch scope regression; minor UI issues | Conflated sync concerns; broke sort order |
| Documentation | Updated sync README | Skipped | Minimal | Updated sync README | Skipped | Skipped | Strongest overall | No sync README; excellent widget README | Skipped | Skipped |
| Bug/sloppiness profile | None | 2 frontend bugs | Minor hook/pattern risks | Instance-model gaps | Dead code paths (total_pages, start_page) | Runtime typo; dead persistence code | Minor dead-code sloppiness | Type/instance partial conflation | Txn bug + scope regression on sync; type/instance partial on widgets | Sort-order regression; unused contract fields |
| **Would merge PR?** | Yes | Maybe (fixes needed) | Yes, with minor notes | Yes, with minor notes | Sync: Yes (with fixes); Widgets: Yes | Yes, with fixes needed | Yes | Yes, with minor notes | Sync: No; Widgets: Yes (with notes) | Sync: No; Widgets: Yes (with fixes) |

---

## Directory Structure

```
A-vs-B/
├── BENCHMARK.md                  # Full rubric and methodology
├── README.md                     # This file
├── original/                     # Starting codebases
│   ├── resumable-sync/
│   └── pluggable-widgets/
├── qwen3.6-27B-8bit/             # Qwen 27B 8-bit local (unsloth) — highest score
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-27B-4bit-openrouter/  # Qwen 27B via OpenRouter (was mislabeled as 8-bit)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-27B-4bit/             # Qwen 27B 4-bit implementations
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-35B-A3B-4bit/         # Qwen 35B-A3B 4-bit implementations
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── agent-pair-qwen3.6-35B-A3B-8bit/  # Qwen 35B-A3B FP8 (agent-pair mode)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-27b-aeon-ultimate-uncensored-nvfp4/  # AEON fine-tune, NVIDIA FP4
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── claude-sonnet-4.5/            # Sonnet's implementations
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── deepseek-4-flash-reap-180b/   # DeepSeek-V4-Flash-REAP-180B (pruned 180B MoE)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── ornith-1.0-35b-8bit/           # Ornith-1.0-35B Q8_0 (35B MoE, agentic coding RL)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
└── step-3.7-flash-IQ4_XS/        # Step-3.7-Flash IQ4_XS (198B MoE, ~11B active)
    ├── resumable-sync/
    ├── pluggable-widgets/
    ├── review-resumable-sync.md
    └── review-pluggable-widgets.md
```

---

## Bottom Line

**Qwen 3.6-27B-8bit (Local, unsloth) wins overall (66.5/80).**

Ranking:
1. **Qwen 3.6-27B-8bit (Local)** - 66.5/80
2. **Claude Sonnet 4.5** - 65/80
3. **Qwen 3.6-35B-A3B-8bit (Local, agent-pair)** - 64/80
4. **[DeepSeek-V4-Flash-REAP-180B](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B)** - 62/80
5. **Qwen 3.6-27B-4bit** - 59/80 (tie)
5. **Qwen 3.6-35B-A3B-4bit** - 59/80 (tie)
7. **Qwen 3.6-27B-AEON-NVFP4** - 57.5/80
8. **Qwen 3.6-27B-4bit (OpenRouter)** - 54/80
9. **[Ornith-1.0-35B-8bit](https://huggingface.co/deepreinforce-ai/Ornith-1.0-35B-GGUF)** - 51/80
10. **[Step-3.7-Flash IQ4_XS](https://huggingface.co/stepfun-ai/Step-3.7-Flash-GGUF)** - 46/80

Most important patterns:
- The locally run unsloth 8-bit model outperforms all cloud/API variants — including Claude Sonnet 4.5 — driven by a near-perfect widget score (35.5/40) and solid sync performance (31/40).
- **Qwen 3.6-35B-A3B-8bit (agent-pair)** places third (64/80), up from 59/80 for the same architecture at 4-bit without observer feedback. The improvement is almost entirely on widgets (+7 points), where observer feedback helped achieve perfect type/instance separation and a generic `WidgetPlugin<TData>` contract. The sync score dropped slightly (29 vs 31) due to dead code the observer flagged but was not fully cleaned up.
- **DeepSeek-V4-Flash-REAP-180B** places fourth despite being a REAP-pruned 180B MoE model running on a single DGX Spark. It ties Sonnet on widgets (32/40) with the best code quality score there, and nearly matches the per-page checkpoint leaders on sync (30/40). Its main gaps are documentation on the sync side and type/instance modeling on widgets.
- The two cloud 4-bit Qwen variants tie on total score, but for different reasons:
  - **27B-4bit** wins on widgets (higher ambiguity-handling + cleaner extensibility flow).
  - **35B-A3B-4bit** wins on sync (better checkpoint granularity and safer architecture).
- **Qwen 3.6-27B-AEON-NVFP4** (57.5/80) demonstrates that uncensored fine-tunes + aggressive FP4 quantization slightly degrade coding performance vs. a vanilla 4-bit quant. Its widget architecture is excellent (13/14) with perfect type/instance separation, but execution flaws (runtime typo, dead code) and missing documentation pull the overall score below the standard 27B-4bit.
- **Ornith-1.0-35B-8bit** places 9th (51/80) despite being specifically RL-trained for agentic coding and claiming state-of-the-art results on Terminal-Bench 2.1, SWE-Bench, and NL2Repo. The sync task (21/40) is its main weakness — correct per-page granularity choice is undermined by a transaction ordering bug (`save_progress` after `conn.commit()`) and a comment-fetch scope regression. The widget task (30/40) is more competitive, with strong ambiguity-handling (8/10) and clean code quality, but the same type/instance conflation seen in most models. This gap between SWE-Bench-style performance and architectural-judgment benchmarks suggests these evaluate different skills.
- **Step-3.7-Flash IQ4_XS** scores last (46/80) despite being the largest model by total parameters (198B). Its ~11B active parameter count per token appears insufficient for the architectural reasoning these tasks demand. The sync task is particularly weak (19/40) — it's the only model that conflated crash-recovery resumability with incremental sync via GitHub's `since` parameter, and it broke the existing sort-order invariant. The widget task (27/40) is more respectable, with a clean registry pattern, but the contract is shallow and undocumented.
- The previously reported "Qwen 3.6-27B-8bit" entry was likely a 4-bit OpenRouter quantization; see the `qwen3.6-27B-4bit-openrouter/` directory.

Across all ten models, explicit ambiguity-resolution remains the hardest benchmark bar; most implementations still pick a path and code it without clearly naming tradeoffs.
