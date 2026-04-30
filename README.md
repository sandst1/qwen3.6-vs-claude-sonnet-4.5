# Benchmark: Four-Model Comparison (Qwen + Sonnet)

A side-by-side comparison of four AI model variants on non-trivial coding tasks designed to test **architectural judgment** and **ambiguity-handling** - not just raw correctness.

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
| **Qwen 3.6-27B-8bit** | 26 / 40 | 28 / 40 | **54** | 67.50% |
| **Qwen 3.6-27B-4bit** | 26 / 40 | 33 / 40 | **59** | 73.75% |
| **Qwen 3.6-35B-A3B-4bit** | 31 / 40 | 28 / 40 | **59** | 73.75% |
| **Claude Sonnet 4.5** | 33 / 40 | 32 / 40 | **65** | 81.25% |

**Winner: Claude Sonnet 4.5**.  
Best Qwen variants (tie): **Qwen 3.6-27B-4bit** and **Qwen 3.6-35B-A3B-4bit** at 59/80.

---

## Task 1: Resumable Sync

### Score Breakdown

| Criterion | Max | Qwen 3.6-27B-8bit | Qwen 3.6-27B-4bit | Qwen 3.6-35B-A3B-4bit | Sonnet 4.5 |
|-----------|-----|-------------------|-------------------|------------------------|------------|
| Architectural judgment | 12 | 8 | 8 | 10 | 11 |
| Ambiguity-handling | 10 | 6 | 5 | 7 | 7 |
| Existing-code respect | 8 | 8 | 8 | 8 | 8 |
| Debugging / failure-mode | 6 | 2 | 3 | 3 | 4 |
| Code quality | 4 | 2 | 2 | 3 | 3 |
| **Total** | **40** | **26** | **26** | **31** | **33** |

### Architectural Approaches

| Aspect | Qwen 3.6-27B-8bit | Qwen 3.6-27B-4bit | Qwen 3.6-35B-A3B-4bit | Claude Sonnet 4.5 |
|--------|-------------------|-------------------|------------------------|-------------------|
| **State tables** | 1 table: `sync_progress` | 1 table: `sync_progress` | 1 table: `sync_progress` | 2 tables: `sync_state` + `pending_comments` |
| **Checkpoint granularity** | Per-issue | Per-issue | Per-page | Per-page (+ deferred comments checkpointing) |
| **Comments handling** | Inline fetch during page loop (no inner checkpoint) | Inline fetch during page loop (no inner checkpoint) | Inline fetch during page loop (no inner checkpoint) | Deferred to separate pass with per-issue checkpoint |
| **Checkpoint/data transaction coupling** | Weak | Stronger (same commit path) | Weak (separate commits) | Medium (implicit/partially coupled) |
| **CLI reset flag** | None | None | None | `--reset` to clear state |
| **README update** | No | No | Yes | Yes |

**Key differences**:
- Sonnet remains the only model that explicitly addresses nested-loop resumability in architecture.
- Qwen 3.6-35B-A3B-4bit is the strongest Qwen on sync, mainly by choosing per-page granularity.
- Both 27B variants converge on per-issue checkpointing, which is workable but heavier than needed.

### Strong/Weak Signals

| Signal | 27B-8bit | 27B-4bit | 35B-A3B-4bit | Sonnet |
|--------|-----------|-----------|----------------|--------|
| State stored in `issues.db` (not JSON) | ✅ | ✅ | ✅ | ✅ |
| Per-repo cursors | ✅ | ✅ | ✅ | ✅ |
| State in same transaction as page commits | ❌ | ✅ | ❌ | ⚠️ |
| Notes per-page-vs-per-record tradeoff | ❌ | ❌ | ❌ | ❌ |
| Updates README | ❌ | ❌ | ✅ | ✅ |

---

## Task 2: Pluggable Widgets

### Score Breakdown

| Criterion | Max | Qwen 3.6-27B-8bit | Qwen 3.6-27B-4bit | Qwen 3.6-35B-A3B-4bit | Sonnet 4.5 |
|-----------|-----|-------------------|-------------------|------------------------|------------|
| Architectural judgment | 14 | 11 | 11 | 10 | 13 |
| Ambiguity-handling | 10 | 5 | 8 | 5 | 6 |
| Existing-code respect | 8 | 7 | 7 | 8 | 7 |
| Frontend craft | 4 | 2 | 3 | 3 | 3 |
| Code quality | 4 | 3 | 4 | 2 | 3 |
| **Total** | **40** | **28** | **33** | **28** | **32** |

### Architectural Approaches

| Aspect | Qwen 3.6-27B-8bit | Qwen 3.6-27B-4bit | Qwen 3.6-35B-A3B-4bit | Claude Sonnet 4.5 |
|--------|-------------------|-------------------|------------------------|-------------------|
| **Widget contract** | `WidgetDescriptor<TData>` generic | `WidgetDescriptor<T>` generic | `WidgetDef` (minimal, non-generic settings) | `WidgetDefinition` (no generic) |
| **Registration pattern** | Class + side-effect imports | Map registry + `registerWidget()` + side-effect imports | `WidgetRegistry` + `BUILTIN_WIDGETS` catalog | Plain object registry |
| **Type/instance split** | ✅ | ⚠️ Partial (type IDs used as instances) | ❌ Conflated | ✅ |
| **Layout persistence** | In-memory only | localStorage (`dashboard-config`) | localStorage (`dashboard-layout`) | localStorage |
| **Widget refactoring strategy** | Rewrote all 5 widgets | Rewrote all 5 widgets consistently | Kept existing widgets mostly unchanged | Left widgets byte-for-byte identical |
| **Adding 6th widget** | 2-3 files | 1-2 files | 1 file | 2 files |
| **Documentation** | None | Minimal (mostly code-level) | Minimal | `WIDGET_GUIDE.md` + `EXAMPLE_NEW_WIDGET.md` |

**Key differences**:
- **Qwen 3.6-27B-4bit** is strongest on widgets due to better ambiguity-handling and cleaner extensibility mechanics.
- **Qwen 3.6-35B-A3B-4bit** preserves existing code best but under-specifies type-vs-instance modeling.
- Sonnet remains strongest in balanced execution and documentation quality.

### Frontend Issues Found

| Issue | 27B-8bit | 27B-4bit | 35B-A3B-4bit | Sonnet |
|-------|-----------|-----------|----------------|--------|
| Conditional hook call (Rules of Hooks violation) | ❌ Bug | — | — | — |
| Incorrect drag event (`onDrag` vs `onDrop`) | ❌ Bug | — | — | — |
| Type-vs-instance conflation risk | — | ⚠️ Partial | ❌ Clear gap | — |
| Dead code (`\|\| true`, `&& false`) | — | — | — | ⚠️ Sloppy |

---

## Analysis by Criterion

### Where Sonnet Won

1. **Best aggregate score (65/80)**: Sonnet is the only model that is top-tier on both tasks, not just one.
2. **Nested-loop resumability**: Sonnet is the only implementation that explicitly handles the comments subloop with dedicated architecture.
3. **Consistency under ambiguity**: Even when not explicit enough, Sonnet avoids large architectural misses.
4. **Documentation quality**: Sonnet updates docs more reliably than the Qwen variants.

### Where Each Qwen Variant Stood Out

1. **Qwen 3.6-27B-8bit**: Solid baseline implementation style with compact logic, but weaker failure-mode and frontend reliability.
2. **Qwen 3.6-27B-4bit**: Strongest widget architecture among Qwen variants (33/40 on Task 2), with better ambiguity-handling.
3. **Qwen 3.6-35B-A3B-4bit**: Strongest sync architecture among Qwen variants (31/40 on Task 1), choosing per-page checkpointing and keeping changes surgical.
4. **Shared Qwen strengths**: all three variants keep state in SQLite and preserve existing code paths well.

### Where Both Failed

- **Ambiguity naming is still weak overall**: all models tended to silently pick a branch rather than explicitly framing the tradeoff.
- **Clarifying questions were rare**: none consistently asked high-value, scope-shaping questions.
- **Transactional reasoning is often implicit**: explicit partial-failure discussion is limited in most runs.
- **Widget settings contracts remain shallow**: none delivered a full per-instance settings abstraction end-to-end.

---

## Qualitative Summary

| Dimension | Qwen 3.6-27B-8bit | Qwen 3.6-27B-4bit | Qwen 3.6-35B-A3B-4bit | Claude Sonnet 4.5 |
|-----------|-------------------|-------------------|------------------------|-------------------|
| Engineering execution | Solid baseline | Strong on widgets | Strong on sync | Most balanced |
| Architectural ambition | Higher/invasive | Higher/invasive but cleaner | Moderate/conservative | Conservative/comprehensive |
| Reasoning transparency | Silent | Mostly silent | Mostly silent | Slightly better |
| Edge-case handling | Missed nested loop + UI bugs | Better frontend discipline | Better sync failure boundaries | Best nested-loop handling |
| Documentation | Skipped | Minimal | Updated sync README | Strongest overall |
| Bug/sloppiness profile | 2 frontend bugs | Minor hook/pattern risks | Instance-model gaps | Minor dead-code sloppiness |
| **Would merge PR?** | Maybe (fixes needed) | Yes, with minor notes | Yes, with minor notes | Yes |

---

## Directory Structure

```
A-vs-B/
├── BENCHMARK.md              # Full rubric and methodology
├── README.md                 # This file
├── original/                 # Starting codebases
│   ├── resumable-sync/
│   └── pluggable-widgets/
├── qwen3.6-27B-8bit/         # Qwen 27B 8-bit implementations
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-27B-4bit/         # Qwen 27B 4-bit implementations
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-35B-A3B-4bit/     # Qwen 35B-A3B 4-bit implementations
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
└── claude-sonnet-4.5/        # Sonnet's implementations
    ├── resumable-sync/
    ├── pluggable-widgets/
    ├── review-resumable-sync.md
    └── review-pluggable-widgets.md
```

---

## Bottom Line

**Claude Sonnet 4.5 wins overall (65/80).**

Ranking:
1. **Claude Sonnet 4.5** - 65/80
2. **Qwen 3.6-27B-4bit** - 59/80 (tie)
2. **Qwen 3.6-35B-A3B-4bit** - 59/80 (tie)
4. **Qwen 3.6-27B-8bit** - 54/80

Most important pattern:
- The two 4-bit Qwen variants tie on total score, but for different reasons:
  - **27B-4bit** wins on widgets (higher ambiguity-handling + cleaner extensibility flow).
  - **35B-A3B-4bit** wins on sync (better checkpoint granularity and safer architecture).

Across all four models, explicit ambiguity-resolution remains the hardest benchmark bar; most implementations still pick a path and code it without clearly naming tradeoffs.
