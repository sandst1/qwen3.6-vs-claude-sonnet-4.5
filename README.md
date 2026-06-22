# Benchmark: Six-Model Comparison (Qwen + Sonnet + DeepSeek)

A side-by-side comparison of six AI model variants on non-trivial coding tasks designed to test **architectural judgment** and **ambiguity-handling** - not just raw correctness.

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
| **[DeepSeek-V4-Flash-REAP-180B](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B)** | 30 / 40 | 32 / 40 | **62** | 77.50% |
| **Qwen 3.6-27B-4bit** | 26 / 40 | 33 / 40 | **59** | 73.75% |
| **Qwen 3.6-35B-A3B-4bit** | 31 / 40 | 28 / 40 | **59** | 73.75% |
| **Qwen 3.6-27B-4bit (OpenRouter)** | 26 / 40 | 28 / 40 | **54** | 67.50% |

**Winner: Qwen 3.6-27B-8bit (Local, unsloth)** at 66.5/80.  
Runner-up: **Claude Sonnet 4.5** at 65/80.  
Third: **[DeepSeek-V4-Flash-REAP-180B](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B)** at 62/80 — a REAP-pruned 180B MoE running on a single DGX Spark.  
Best cloud Qwen variants (tie): **Qwen 3.6-27B-4bit** and **Qwen 3.6-35B-A3B-4bit** at 59/80.

> **Note on the OpenRouter entry:** the run in `qwen3.6-27B-4bit-openrouter/` was originally mislabeled as "8-bit"; it is believed to be a 4-bit quantized model served via OpenRouter, based on scoring patterns and output style. The locally run unsloth 8-bit results are now tracked separately in `qwen3.6-27B-8bit/`.

> **Note on DeepSeek-V4-Flash-REAP-180B:** This is a [REAP-pruned](https://github.com/CerebrasResearch/reap) derivative of [DeepSeek-V4-Flash](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash), compressed from 641B to ~180B parameters via router-weighted expert activation pruning. It runs on a single NVIDIA DGX Spark. See the [model card](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B) for details.

---

## Task 1: Resumable Sync

### Score Breakdown

| Criterion | Max | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | Sonnet 4.5 | DS-V4-REAP-180B |
|-----------|-----|------------------|---------------|----------|--------------|------------|-----------------|
| Architectural judgment | 12 | 10 | 8 | 8 | 10 | 11 | 10 |
| Ambiguity-handling | 10 | 7 | 6 | 5 | 7 | 7 | 7 |
| Existing-code respect | 8 | 8 | 8 | 8 | 8 | 8 | 8 |
| Debugging / failure-mode | 6 | 3 | 2 | 3 | 3 | 4 | 3 |
| Code quality | 4 | 3 | 2 | 2 | 3 | 3 | 2 |
| **Total** | **40** | **31** | **26** | **26** | **31** | **33** | **30** |

### Architectural Approaches

| Aspect | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | Sonnet 4.5 | DS-V4-REAP-180B |
|--------|------------------|---------------|----------|--------------|------------|-----------------|
| **State tables** | 1 table: `sync_progress` | 1 table: `sync_progress` | 1 table: `sync_progress` | 1 table: `sync_progress` | 2 tables: `sync_state` + `pending_comments` | 1 table: `sync_checkpoints` |
| **Checkpoint granularity** | Per-page | Per-issue | Per-issue | Per-page | Per-page (+ deferred comments checkpointing) | Per-page |
| **Comments handling** | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Deferred to separate pass with per-issue checkpoint | Inline fetch, no inner checkpoint (error-caught) |
| **Checkpoint/data transaction coupling** | Weak (separate commits) | Weak | Stronger (same commit path) | Weak (separate commits) | Medium (implicit/partially coupled) | Weak (separate commits) |
| **CLI reset flag** | `--reset` | None | None | None | `--reset` | None |
| **README update** | Yes | No | No | Yes | Yes | No |

**Key differences**:
- Sonnet remains the only model that explicitly addresses nested-loop resumability in architecture.
- Local 8-bit and 35B-A3B-4bit both choose per-page granularity and both score 31/40 on this task.
- DeepSeek-V4-REAP-180B also picks per-page granularity (scoring 30/40), matching the right answer but losing points on documentation and transaction coupling.
- Both OpenRouter 27B variants converge on per-issue checkpointing, which is workable but heavier than needed.
- Local 8-bit adds a `--reset` flag and updates the README — matching Sonnet's operational completeness.

### Strong/Weak Signals

| Signal | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | Sonnet | DS-V4-REAP-180B |
|--------|-----------------|---------------|----------|----------------|--------|-----------------|
| State stored in `issues.db` (not JSON) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Per-repo cursors | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| State in same transaction as page commits | ❌ | ❌ | ✅ | ❌ | ⚠️ | ❌ |
| Notes per-page-vs-per-record tradeoff | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Updates README | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |

---

## Task 2: Pluggable Widgets

### Score Breakdown

| Criterion | Max | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | Sonnet 4.5 | DS-V4-REAP-180B |
|-----------|-----|------------------|---------------|----------|--------------|------------|-----------------|
| Architectural judgment | 14 | 13 | 11 | 11 | 10 | 13 | 10 |
| Ambiguity-handling | 10 | 8.5 | 5 | 8 | 5 | 6 | 8 |
| Existing-code respect | 8 | 7 | 7 | 7 | 8 | 7 | 7 |
| Frontend craft | 4 | 4 | 2 | 3 | 3 | 3 | 3 |
| Code quality | 4 | 3 | 3 | 4 | 2 | 3 | 4 |
| **Total** | **40** | **35.5** | **28** | **33** | **28** | **32** | **32** |

### Architectural Approaches

| Aspect | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | Sonnet 4.5 | DS-V4-REAP-180B |
|--------|------------------|---------------|----------|--------------|------------|-----------------|
| **Widget contract** | `WidgetType` interface (no generic settings) | `WidgetDescriptor<TData>` generic | `WidgetDescriptor<T>` generic | `WidgetDef` (minimal, non-generic settings) | `WidgetDefinition` (no generic) | `WidgetDefinition` (no generic settings) |
| **Registration pattern** | Map registry + `registerWidget()` + side-effect imports | Class + side-effect imports | Map registry + `registerWidget()` + side-effect imports | `WidgetRegistry` + `BUILTIN_WIDGETS` catalog | Plain object registry | Map registry + `defineWidget()` |
| **Type/instance split** | ✅ Perfect | ✅ | ⚠️ Partial (type IDs used as instances) | ❌ Conflated | ✅ | ⚠️ Partial (`activeIds` is `string[]` of type IDs) |
| **Layout persistence** | localStorage | In-memory only | localStorage (`dashboard-config`) | localStorage (`dashboard-layout`) | localStorage | localStorage (`dashboard-layout`) |
| **Widget refactoring strategy** | Minimal (body content only, all 5 consistent) | Rewrote all 5 widgets | Rewrote all 5 widgets consistently | Kept existing widgets mostly unchanged | Left widgets byte-for-byte identical | Consolidated all 5 into `widgets.tsx` |
| **Adding 6th widget** | 2 files | 2-3 files | 1-2 files | 1 file | 2 files | 1 file (`defineWidget()` call) |
| **Documentation** | None | None | Minimal (mostly code-level) | Minimal | `WIDGET_GUIDE.md` + `EXAMPLE_NEW_WIDGET.md` | Good README with architecture + guide |

**Key differences**:
- **Qwen 3.6-27B-8bit (Local)** is the strongest on widgets overall: perfect type/instance separation, zero frontend bugs, full marks on frontend craft, and strong ambiguity-handling.
- **Qwen 3.6-27B-4bit** is the strongest cloud Qwen on widgets (33/40), with better ambiguity-handling and cleaner extensibility mechanics.
- **DeepSeek-V4-REAP-180B** ties with Sonnet on widgets (32/40), with the best code quality score (4/4) and strong ambiguity-handling (8/10), but partially conflates type/instance like some Qwen variants.
- **Qwen 3.6-35B-A3B-4bit** preserves existing code best but under-specifies type-vs-instance modeling.
- Sonnet remains strongest in documentation quality, though DeepSeek's README is also notably good.

### Frontend Issues Found

| Issue | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | Sonnet | DS-V4-REAP-180B |
|-------|-----------------|---------------|----------|----------------|--------|-----------------|
| Conditional hook call (Rules of Hooks violation) | — | ❌ Bug | — | — | — | — |
| Incorrect drag event (`onDrag` vs `onDrop`) | — | ❌ Bug | — | — | — | — |
| Type-vs-instance conflation risk | — | — | ⚠️ Partial | ❌ Clear gap | — | ⚠️ Partial (no duplicate widgets) |
| Dead code (`\|\| true`, `&& false`) | — | — | — | — | ⚠️ Sloppy | — |

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

### Where Each Other Variant Stood Out

1. **Qwen 3.6-27B-4bit (OpenRouter)**: Weaker overall, but used a generic widget descriptor (`WidgetDescriptor<TData>`).
2. **Qwen 3.6-27B-4bit**: Strongest cloud Qwen on widgets (33/40), with cleaner extensibility and good ambiguity-handling.
3. **Qwen 3.6-35B-A3B-4bit**: Strongest cloud Qwen on sync (31/40), choosing per-page checkpointing and keeping changes surgical.
4. **Shared Qwen strengths**: All variants keep state in SQLite and preserve existing code paths well.

### Where All Failed

- **Ambiguity naming is still weak overall**: all models tended to silently pick a branch rather than explicitly framing the tradeoff.
- **Clarifying questions were rare**: none consistently asked high-value, scope-shaping questions.
- **Transactional reasoning is often implicit**: explicit partial-failure discussion is limited in most runs.
- **Widget settings contracts remain shallow**: none delivered a full per-instance settings abstraction end-to-end.

---

## Qualitative Summary

| Dimension | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | Sonnet 4.5 | DS-V4-REAP-180B |
|-----------|------------------|---------------|----------|--------------|------------|-----------------|
| Engineering execution | Strong on both | Solid baseline | Strong on widgets | Strong on sync | Most balanced | Solid on both |
| Architectural ambition | Higher/clean | Higher/invasive | Higher/invasive but cleaner | Moderate/conservative | Conservative/comprehensive | Moderate/clean |
| Reasoning transparency | Mostly silent | Silent | Mostly silent | Mostly silent | Slightly better | Mostly silent |
| Edge-case handling | Missed comments subloop; no UI bugs | Missed nested loop + UI bugs | Better frontend discipline | Better sync failure boundaries | Best nested-loop handling | Missed comments subloop; good defensive error handling |
| Documentation | Updated sync README | Skipped | Minimal | Updated sync README | Strongest overall | No sync README; excellent widget README |
| Bug/sloppiness profile | None | 2 frontend bugs | Minor hook/pattern risks | Instance-model gaps | Minor dead-code sloppiness | Type/instance partial conflation |
| **Would merge PR?** | Yes | Maybe (fixes needed) | Yes, with minor notes | Yes, with minor notes | Yes | Yes, with minor notes |

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
├── claude-sonnet-4.5/            # Sonnet's implementations
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
└── deepseek-4-flash-reap-180b/   # DeepSeek-V4-Flash-REAP-180B (pruned 180B MoE)
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
3. **[DeepSeek-V4-Flash-REAP-180B](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B)** - 62/80
4. **Qwen 3.6-27B-4bit** - 59/80 (tie)
4. **Qwen 3.6-35B-A3B-4bit** - 59/80 (tie)
6. **Qwen 3.6-27B-4bit (OpenRouter)** - 54/80

Most important patterns:
- The locally run unsloth 8-bit model outperforms all cloud/API variants — including Claude Sonnet 4.5 — driven by a near-perfect widget score (35.5/40) and solid sync performance (31/40).
- **DeepSeek-V4-Flash-REAP-180B** places third despite being a REAP-pruned 180B MoE model running on a single DGX Spark. It ties Sonnet on widgets (32/40) with the best code quality score there, and nearly matches the per-page checkpoint leaders on sync (30/40). Its main gaps are documentation on the sync side and type/instance modeling on widgets.
- The two cloud 4-bit Qwen variants tie on total score, but for different reasons:
  - **27B-4bit** wins on widgets (higher ambiguity-handling + cleaner extensibility flow).
  - **35B-A3B-4bit** wins on sync (better checkpoint granularity and safer architecture).
- The previously reported "Qwen 3.6-27B-8bit" entry was likely a 4-bit OpenRouter quantization; see the `qwen3.6-27B-4bit-openrouter/` directory.

Across all six models, explicit ambiguity-resolution remains the hardest benchmark bar; most implementations still pick a path and code it without clearly naming tradeoffs.
