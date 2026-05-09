# Benchmark: Five-Model Comparison (Qwen + Sonnet)

A side-by-side comparison of five AI model variants on non-trivial coding tasks designed to test **architectural judgment** and **ambiguity-handling** - not just raw correctness.

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
| **Qwen 3.6-27B-4bit** | 26 / 40 | 33 / 40 | **59** | 73.75% |
| **Qwen 3.6-35B-A3B-4bit** | 31 / 40 | 28 / 40 | **59** | 73.75% |
| **Qwen 3.6-27B-4bit (OpenRouter)** | 26 / 40 | 28 / 40 | **54** | 67.50% |

**Winner: Qwen 3.6-27B-8bit (Local, unsloth)** at 66.5/80.  
Runner-up: **Claude Sonnet 4.5** at 65/80.  
Best cloud Qwen variants (tie): **Qwen 3.6-27B-4bit** and **Qwen 3.6-35B-A3B-4bit** at 59/80.

> **Note on the OpenRouter entry:** the run in `qwen3.6-27B-4bit-openrouter/` was originally mislabeled as "8-bit"; it is believed to be a 4-bit quantized model served via OpenRouter, based on scoring patterns and output style. The locally run unsloth 8-bit results are now tracked separately in `qwen3.6-27B-8bit/`.

---

## Task 1: Resumable Sync

### Score Breakdown

| Criterion | Max | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | Sonnet 4.5 |
|-----------|-----|------------------|---------------|----------|--------------|------------|
| Architectural judgment | 12 | 10 | 8 | 8 | 10 | 11 |
| Ambiguity-handling | 10 | 7 | 6 | 5 | 7 | 7 |
| Existing-code respect | 8 | 8 | 8 | 8 | 8 | 8 |
| Debugging / failure-mode | 6 | 3 | 2 | 3 | 3 | 4 |
| Code quality | 4 | 3 | 2 | 2 | 3 | 3 |
| **Total** | **40** | **31** | **26** | **26** | **31** | **33** |

### Architectural Approaches

| Aspect | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | Sonnet 4.5 |
|--------|------------------|---------------|----------|--------------|------------|
| **State tables** | 1 table: `sync_progress` | 1 table: `sync_progress` | 1 table: `sync_progress` | 1 table: `sync_progress` | 2 tables: `sync_state` + `pending_comments` |
| **Checkpoint granularity** | Per-page | Per-issue | Per-issue | Per-page | Per-page (+ deferred comments checkpointing) |
| **Comments handling** | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Deferred to separate pass with per-issue checkpoint |
| **Checkpoint/data transaction coupling** | Weak (separate commits) | Weak | Stronger (same commit path) | Weak (separate commits) | Medium (implicit/partially coupled) |
| **CLI reset flag** | `--reset` | None | None | None | `--reset` |
| **README update** | Yes | No | No | Yes | Yes |

**Key differences**:
- Sonnet remains the only model that explicitly addresses nested-loop resumability in architecture.
- Local 8-bit and 35B-A3B-4bit both choose per-page granularity and both score 31/40 on this task.
- Both OpenRouter 27B variants converge on per-issue checkpointing, which is workable but heavier than needed.
- Local 8-bit adds a `--reset` flag and updates the README — matching Sonnet's operational completeness.

### Strong/Weak Signals

| Signal | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | Sonnet |
|--------|-----------------|---------------|----------|----------------|--------|
| State stored in `issues.db` (not JSON) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Per-repo cursors | ✅ | ✅ | ✅ | ✅ | ✅ |
| State in same transaction as page commits | ❌ | ❌ | ✅ | ❌ | ⚠️ |
| Notes per-page-vs-per-record tradeoff | ❌ | ❌ | ❌ | ❌ | ❌ |
| Updates README | ✅ | ❌ | ❌ | ✅ | ✅ |

---

## Task 2: Pluggable Widgets

### Score Breakdown

| Criterion | Max | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | Sonnet 4.5 |
|-----------|-----|------------------|---------------|----------|--------------|------------|
| Architectural judgment | 14 | 13 | 11 | 11 | 10 | 13 |
| Ambiguity-handling | 10 | 8.5 | 5 | 8 | 5 | 6 |
| Existing-code respect | 8 | 7 | 7 | 7 | 8 | 7 |
| Frontend craft | 4 | 4 | 2 | 3 | 3 | 3 |
| Code quality | 4 | 3 | 3 | 4 | 2 | 3 |
| **Total** | **40** | **35.5** | **28** | **33** | **28** | **32** |

### Architectural Approaches

| Aspect | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | Sonnet 4.5 |
|--------|------------------|---------------|----------|--------------|------------|
| **Widget contract** | `WidgetType` interface (no generic settings) | `WidgetDescriptor<TData>` generic | `WidgetDescriptor<T>` generic | `WidgetDef` (minimal, non-generic settings) | `WidgetDefinition` (no generic) |
| **Registration pattern** | Map registry + `registerWidget()` + side-effect imports | Class + side-effect imports | Map registry + `registerWidget()` + side-effect imports | `WidgetRegistry` + `BUILTIN_WIDGETS` catalog | Plain object registry |
| **Type/instance split** | ✅ Perfect | ✅ | ⚠️ Partial (type IDs used as instances) | ❌ Conflated | ✅ |
| **Layout persistence** | localStorage | In-memory only | localStorage (`dashboard-config`) | localStorage (`dashboard-layout`) | localStorage |
| **Widget refactoring strategy** | Minimal (body content only, all 5 consistent) | Rewrote all 5 widgets | Rewrote all 5 widgets consistently | Kept existing widgets mostly unchanged | Left widgets byte-for-byte identical |
| **Adding 6th widget** | 2 files | 2-3 files | 1-2 files | 1 file | 2 files |
| **Documentation** | None | None | Minimal (mostly code-level) | Minimal | `WIDGET_GUIDE.md` + `EXAMPLE_NEW_WIDGET.md` |

**Key differences**:
- **Qwen 3.6-27B-8bit (Local)** is the strongest on widgets overall: perfect type/instance separation, zero frontend bugs, full marks on frontend craft, and strong ambiguity-handling.
- **Qwen 3.6-27B-4bit** is the strongest cloud Qwen on widgets (33/40), with better ambiguity-handling and cleaner extensibility mechanics.
- **Qwen 3.6-35B-A3B-4bit** preserves existing code best but under-specifies type-vs-instance modeling.
- Sonnet remains strongest in documentation quality.

### Frontend Issues Found

| Issue | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | Sonnet |
|-------|-----------------|---------------|----------|----------------|--------|
| Conditional hook call (Rules of Hooks violation) | — | ❌ Bug | — | — | — |
| Incorrect drag event (`onDrag` vs `onDrop`) | — | ❌ Bug | — | — | — |
| Type-vs-instance conflation risk | — | — | ⚠️ Partial | ❌ Clear gap | — |
| Dead code (`\|\| true`, `&& false`) | — | — | — | — | ⚠️ Sloppy |

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

| Dimension | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | Sonnet 4.5 |
|-----------|------------------|---------------|----------|--------------|------------|
| Engineering execution | Strong on both | Solid baseline | Strong on widgets | Strong on sync | Most balanced |
| Architectural ambition | Higher/clean | Higher/invasive | Higher/invasive but cleaner | Moderate/conservative | Conservative/comprehensive |
| Reasoning transparency | Mostly silent | Silent | Mostly silent | Mostly silent | Slightly better |
| Edge-case handling | Missed comments subloop; no UI bugs | Missed nested loop + UI bugs | Better frontend discipline | Better sync failure boundaries | Best nested-loop handling |
| Documentation | Updated sync README | Skipped | Minimal | Updated sync README | Strongest overall |
| Bug/sloppiness profile | None | 2 frontend bugs | Minor hook/pattern risks | Instance-model gaps | Minor dead-code sloppiness |
| **Would merge PR?** | Yes | Maybe (fixes needed) | Yes, with minor notes | Yes, with minor notes | Yes |

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
└── claude-sonnet-4.5/            # Sonnet's implementations
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
3. **Qwen 3.6-27B-4bit** - 59/80 (tie)
3. **Qwen 3.6-35B-A3B-4bit** - 59/80 (tie)
5. **Qwen 3.6-27B-4bit (OpenRouter)** - 54/80

Most important patterns:
- The locally run unsloth 8-bit model outperforms all cloud/API variants — including Claude Sonnet 4.5 — driven by a near-perfect widget score (35.5/40) and solid sync performance (31/40).
- The two cloud 4-bit Qwen variants tie on total score, but for different reasons:
  - **27B-4bit** wins on widgets (higher ambiguity-handling + cleaner extensibility flow).
  - **35B-A3B-4bit** wins on sync (better checkpoint granularity and safer architecture).
- The previously reported "Qwen 3.6-27B-8bit" entry was likely a 4-bit OpenRouter quantization; see the `qwen3.6-27B-4bit-openrouter/` directory.

Across all five models, explicit ambiguity-resolution remains the hardest benchmark bar; most implementations still pick a path and code it without clearly naming tradeoffs.
