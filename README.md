# Benchmark: Twenty-Three-Model Comparison (Qwen + Sonnet + DeepSeek + Step + Ornith + A1 + Ternary Bonsai + Laguna + Muse Glimmer)

A side-by-side comparison of twenty-three AI model variants on non-trivial coding tasks designed to test **architectural judgment** and **ambiguity-handling** - not just raw correctness.

This benchmark is intentionally built around **underspecified, real-world prompts** run against existing small codebases. The point is to measure how models resolve ambiguity, choose scope, and preserve working systems under realistic constraints - not whether they can produce a syntactically correct patch.

Methodology highlights (from [BENCHMARK.md](./BENCHMARK.md)):
- Each model gets the same starter code and the same prompt text, with no extra "helpful" clarification.
- Agent runs are allowed to complete without guidance; if a model asks questions, responses are brief and non-leading.
- Scoring uses rubric dimensions beyond correctness: architectural judgment, ambiguity-handling, existing-code respect, failure-mode reasoning, and code quality.
- Results are best interpreted over multiple runs per (model, task) because agent-mode behavior introduces run-to-run variance.

## Tasks

| Task | Directory | Description | Core Challenge | Detailed results |
|------|-----------|-------------|----------------|------------------|
| **Resumable Sync** | `*/resumable-sync/` | Make a GitHub→SQLite sync script resumable after crashes | Picking the right checkpointing granularity | [RESULTS-TASK1-RESUMABLE-SYNC.md](./RESULTS-TASK1-RESUMABLE-SYNC.md) |
| **Pluggable Widgets** | `*/pluggable-widgets/` | Make a React dashboard widget system pluggable | Deciding "pluggable for whom" (users vs developers) | [RESULTS-TASK2-PLUGGABLE-WIDGETS.md](./RESULTS-TASK2-PLUGGABLE-WIDGETS.md) |

See [BENCHMARK.md](./BENCHMARK.md) for the full rubric and methodology.

## Results

### Total Scores (out of 80)

| Model | Task 1 (Sync) | Task 2 (Widgets) | **Total** | % |
|-------|---------------|------------------|-----------|---|
| **[Qwen 3.8-27B-4bit (unsloth), reasoning-medium](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF)** | 34 / 40 | 39 / 40 | **73** | 91.25% |
| **[Qwen 3.8-27B-FP8 (thinking off)](https://huggingface.co/Qwen/Qwen3.8-27B-FP8)** | 36 / 40 | 33 / 40 | **69** | 86.25% |
| **Qwen 3.6-27B-Q6K (unsloth)** | 35 / 40 | 34 / 40 | **69** | 86.25% |
| **[DeepSeek-V4-Flash-0731 IQ3_XXS](https://huggingface.co/unsloth/DeepSeek-V4-Flash-0731-GGUF)** | 32 / 40 | 37 / 40 | **69** | 86.25% |
| **[Qwen 3.8-27B-FP8 (reasoning-medium)](https://huggingface.co/Qwen/Qwen3.8-27B-FP8)** | 34 / 40 | 34 / 40 | **68** | 85.0% |
| **Qwen 3.6-27B-8bit (Local)** | 31 / 40 | 35.5 / 40 | **66.5** | 83.1% |
| **Claude Sonnet 4.5** | 33 / 40 | 32 / 40 | **65** | 81.25% |
| **[Laguna S 2.1-NVFP4](https://huggingface.co/poolside/Laguna-S-2.1-NVFP4)** | 31 / 40 | 33.5 / 40 | **64.5** | 80.6% |
| **Qwen 3.6-35B-A3B-8bit (Local, agent-pair)** | 29 / 40 | 35 / 40 | **64** | 80% |
| **[Qwen 3.6-27B-NVFP4](https://huggingface.co/nvidia/Qwen3.6-27B-NVFP4)** | 31 / 40 | 32 / 40 | **63** | 78.75% |
| **[DeepSeek-V4-Flash-REAP-180B](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B)** | 30 / 40 | 32 / 40 | **62** | 77.50% |
| **Qwen 3.6-27B-NVFP4 (unsloth)** | 30 / 40 | 31 / 40 | **61** | 76.25% |
| **[Qwen 3.8-27B-4bit (unsloth), thinking off](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF)** | 26 / 40 | 34 / 40 | **60** | 75.0% |
| **Qwen 3.6-27B-4bit** | 26 / 40 | 33 / 40 | **59** | 73.75% |
| **Qwen 3.6-35B-A3B-4bit** | 31 / 40 | 28 / 40 | **59** | 73.75% |
| **Qwen 3.6-27B-AEON-NVFP4** | 27 / 40 | 30.5 / 40 | **57.5** | 71.88% |
| **[Muse Glimmer 30B Q4_K_XL (unsloth)](https://huggingface.co/unsloth/Muse-Glimmer-30B-GGUF)** | 28 / 40 | 29 / 40 | **57** | 71.25% |
| **[Muse Glimmer 30B K-Quant Dynamic](https://huggingface.co/meta-models/Muse-Glimmer-30B-GGUF/)** | 25 / 40 | 31 / 40 | **56** | 70.0% |
| **Qwen 3.6-27B-4bit (OpenRouter)** | 26 / 40 | 28 / 40 | **54** | 67.50% |
| **[Ornith-1.0-35B-8bit](https://huggingface.co/deepreinforce-ai/Ornith-1.0-35B-GGUF)** | 21 / 40 | 30 / 40 | **51** | 63.75% |
| **[Ternary Bonsai 27B](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-gguf)** | 17.5 / 40 | 33 / 40 | **50.5** | 63.1% |
| **Agents A1 FP8** | 24 / 40 | 24 / 40 | **48** | 60.00% |
| **[Step-3.7-Flash IQ4_XS](https://huggingface.co/stepfun-ai/Step-3.7-Flash-GGUF)** | 19 / 40 | 27 / 40 | **46** | 57.50% |

**Sole winner at 73/80:** [Qwen 3.8-27B-4bit (unsloth), reasoning-medium](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF) — Unsloth Dynamic V3.0 `UD-Q4_K_XL` GGUF (~17.9 GB) of Qwen 3.8-27B, run locally via llama.cpp with thinking mode on and `reasoning_effort="medium"`. Widgets (39/40) are the highest in the entire benchmark, topping the previous best (37/40 by DS-V4-Flash-0731): perfect `WidgetDefinition`/`WidgetInstance` split with unique instance keys, Map registry with duplicate detection, both user-vs-developer forks named and implemented, versioned localStorage, native drag-and-drop, and full marks on existing-code respect, frontend craft, and code quality. Sync (34/40) ties FP8 reasoning-medium: per-page `sync_state` with `get_sync_state()`/`set_sync_state()`, implicit atomic page+cursor commits, `--full` flag, and a clear README. Incremental sync via GitHub's `since` is scope creep but is distinguished from crash recovery (unlike the thinking-off 4bit run, which passed an issue ID to `since` and scored 26/40).  
**Three runners-up at 69/80:** [Qwen 3.8-27B-FP8](https://huggingface.co/Qwen/Qwen3.8-27B-FP8), Qwen 3.6-27B-Q6K (unsloth), and [DeepSeek-V4-Flash-0731 IQ3_XXS](https://huggingface.co/unsloth/DeepSeek-V4-Flash-0731-GGUF) — complementary strengths. Qwen 3.8-27B-FP8 still has the highest sync score (36/40) with atomic page+checkpoint transactions and full code quality; DS-V4-Flash-0731 has the second-highest widget score (37/40); Q6K pairs strong widgets (34/40) with a unique `max_commented_issue_id` high-water mark on sync (35/40). Qwen 3.8-27B-FP8 was run locally from the official FP8 checkpoint with thinking-mode disabled.  
Fifth: **[Qwen 3.8-27B-FP8 (reasoning-medium)](https://huggingface.co/Qwen/Qwen3.8-27B-FP8)** at 68/80 — same FP8 checkpoint with thinking mode on and `reasoning_effort="medium"`. Sync (34/40) loses 2 points to scope creep (incremental sync via `cutoff` timestamp conflated with crash recovery); widgets (34/40) gain 1 point over thinking-off via a good README and native drag-and-drop.  
Sixth: **Qwen 3.6-27B-8bit (Local, unsloth)** at 66.5/80.  
Seventh: **Claude Sonnet 4.5** at 65/80.  
Eighth: **[Laguna S 2.1-NVFP4](https://huggingface.co/poolside/Laguna-S-2.1-NVFP4)** at 64.5/80 — Poolside's 117.6B MoE (8.5B activated) in NVFP4, run with recommended sampling (`temperature 0.7`, `top_p 0.95`) and thinking disabled.  
Ninth: **Qwen 3.6-35B-A3B-8bit (Local, agent-pair)** at 64/80 — the same 35B-A3B architecture in FP8 quantization, run with agent-pair observer feedback.  
Tenth: **[Qwen 3.6-27B-NVFP4](https://huggingface.co/nvidia/Qwen3.6-27B-NVFP4)** at 63/80 — NVIDIA's official FP4 quantization of Qwen 3.6-27B, run locally via vLLM.  
Eleventh: **[DeepSeek-V4-Flash-REAP-180B](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B)** at 62/80 — a REAP-pruned 180B MoE running on a single DGX Spark.  
Twelfth: **Qwen 3.6-27B-NVFP4 (unsloth)** at 61/80 — the same NVFP4 quantization of Qwen 3.6-27B run locally via unsloth rather than vLLM, scoring 2 points below the NVIDIA official build.  
Thirteenth: **[Qwen 3.8-27B-4bit (unsloth), thinking off](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF)** at 60/80 — same `UD-Q4_K_XL` GGUF as the winner, but with thinking-mode disabled. Widgets (34/40) still tie Q6K; sync (26/40) drops 8 points from the reasoning-medium run due to a critical `since` bug (passes issue ID to GitHub's timestamp parameter).  
Best cloud Qwen variants (tie): **Qwen 3.6-27B-4bit** and **Qwen 3.6-35B-A3B-4bit** at 59/80.  
**[Muse Glimmer 30B Q4_K_XL (unsloth)](https://huggingface.co/unsloth/Muse-Glimmer-30B-GGUF)** at 57/80 — Unsloth's Dynamic 2.0 `UD-Q4_K_XL` GGUF (~15.9 GB) of Meta's 29.6B Muse Glimmer. Slightly above the official K-Quant Dynamic build (56/80): stronger sync (28 vs 25) from per-issue checkpointing, slightly weaker widgets (29 vs 31).  
**[Muse Glimmer 30B K-Quant Dynamic](https://huggingface.co/meta-models/Muse-Glimmer-30B-GGUF/)** at 56/80 — Meta's 29.6B dense agentic model, run locally from `muse-glimmer-30B-kquant-dynamic.gguf`. Strong widget structure (31/40) but a lightly reasoned, undocumented sync implementation (25/40) place it 18th.  
**[Ornith-1.0-35B-8bit](https://huggingface.co/deepreinforce-ai/Ornith-1.0-35B-GGUF)** at 51/80 — a 35B MoE model marketed for agentic coding, run locally via llama.cpp at Q8_0 quantization.  
**[Ternary Bonsai 27B](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-gguf)** at 50.5/80 — a 1.71 bits/weight ternary model (~7.2 GB, llama.cpp Q2_0); strong widget architecture but `since`-based sync conflation and a blocking import bug place it 21st.  
**Agents A1 FP8** at 48/80 — per-issue checkpointing (not per-page) on the sync task and type/instance conflation on widgets place it 22nd.  
Last: **[Step-3.7-Flash IQ4_XS](https://huggingface.co/stepfun-ai/Step-3.7-Flash-GGUF)** at 46/80.

Per-task score breakdowns, architectural comparisons, and task-specific analysis live in the detailed results files:
- **[Task 1: Resumable Sync](./RESULTS-TASK1-RESUMABLE-SYNC.md)** — checkpoint granularity, transaction coupling, comment-loop handling
- **[Task 2: Pluggable Widgets](./RESULTS-TASK2-PLUGGABLE-WIDGETS.md)** — widget contracts, registry patterns, type/instance modeling, frontend issues

> **Note on Qwen 3.8-27B-4bit (unsloth), reasoning-medium:** Same [unsloth/Qwen3.8-27B-GGUF](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF) `Qwen3.8-27B-UD-Q4_K_XL.gguf` quant (~17.9 GB) as the thinking-off 4bit run, but with thinking mode on and `reasoning_effort="medium"`. Sole winner at 73/80 (1st of 23) — 13 points above thinking-off 4bit (60/80) and 4 points above the previous 69/80 pack. Widgets (39/40) are the benchmark best: perfect `WidgetDefinition`/`WidgetInstance` split with unique `key`s (`crypto.randomUUID()`), Map registry with `registerWidget()` and duplicate-detection throw, both user-vs-developer forks named and implemented in the README, versioned localStorage (`ops-dashboard.layout.v1`) with registry validation, native HTML5 drag-and-drop, consistent span-via-wrapper refactoring, and full marks on existing-code respect (8/8), frontend craft (4/4), and code quality (4/4). The only deduction is no settings abstraction on the widget contract (5/6). Sync (34/40) ties FP8 reasoning-medium: per-page `sync_state` with `get_sync_state()`/`set_sync_state()`, implicit atomic page+cursor commits, `--full` flag, and a comprehensive README. Incremental sync via GitHub's `since` is scope creep, but unlike thinking-off 4bit it uses a real ISO timestamp watermark and documents incremental refresh as separate from crash recovery.

> **Note on Qwen 3.8-27B-4bit (unsloth), thinking off:** Same [unsloth/Qwen3.8-27B-GGUF](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF) `Qwen3.8-27B-UD-Q4_K_XL.gguf` quant, run locally via llama.cpp with thinking-mode disabled. It scores 60/80 (13th of 23) — 13 points below the reasoning-medium run on the same file. The split is stark: widgets (34/40) still tie Q6K with a clean `WidgetDef`/`WidgetPlacement` type split, Map registry with duplicate detection, full frontend craft (4/4), and a good widget README; sync (26/40) has the right per-page `sync_progress` structure and excellent README documentation but is undermined by passing an integer issue ID to GitHub's `since` parameter (which expects an ISO 8601 timestamp) and writing checkpoints in a separate transaction from page data.

> **Note on Qwen 3.8-27B-FP8:** This is [Qwen 3.8-27B-FP8](https://huggingface.co/Qwen/Qwen3.8-27B-FP8), the official FP8 checkpoint of Qwen 3.8-27B, run locally with thinking-mode disabled. It scores 69/80 — tied for second with Q6K and DS-V4-Flash-0731. Sync (36/40) is the highest in the entire benchmark: per-page checkpointing with `get_sync_state()`/`set_sync_state()` helpers, page data and progress marker committed atomically in a single `conn.commit()`, WAL mode with `PRAGMA wal_checkpoint(TRUNCATE)` on shutdown, and a clear README "Resumability" section. Full marks on existing-code respect (8/8) and code quality (4/4). Loses points on not naming the per-page-vs-per-record tradeoff and no schema versioning for `sync_state`. Widgets (33/40) are solid: clean `WidgetDefinition` contract, `WIDGETS` array registry with documented add-a-widget flow, consistent body-only refactoring via `WidgetShell`, versioned localStorage key (`ops-dashboard.layout.v1`) with registry validation, and full frontend craft (4/4). Held back by type/instance conflation (layout is `WidgetId[]` of type IDs; duplicates blocked), silent user-vs-developer ambiguity (7/10), no generic settings on the contract, and no widget README update.

> **Note on Qwen 3.8-27B-FP8 (reasoning-medium):** Same [Qwen 3.8-27B-FP8](https://huggingface.co/Qwen/Qwen3.8-27B-FP8) checkpoint, run locally with thinking mode enabled and `reasoning_effort="medium"` (vs thinking disabled for the 69/80 runner-up). Scores 68/80 (5th of 23) — 1 point below thinking-off. Sync (34/40) is still strong: per-page checkpointing via `get_checkpoint()`/`save_checkpoint()`, atomic page+checkpoint transactions, WAL mode, comprehensive `test_sync.py` (9 cases), `--status`/`--force` CLI flags, and README update. Loses 2 points vs thinking-off due to scope creep: adds incremental sync via `cutoff` timestamp (`sync_issues_incremental`) conflating crash recovery with incremental refresh — the same class of mistake Step-3.7-Flash made with GitHub's `since` parameter, though implemented correctly here. Widgets (34/40) improve 1 point over thinking-off: clean `WidgetDef` contract, `WIDGET_TYPES` registry, versioned localStorage (`ops-dashboard.layout.v1`) with registry validation, native HTML5 drag-and-drop, consistent body-only refactoring via `WidgetCard`, full frontend craft (4/4), and a good widget README with an adding-a-widget guide. Still held back by type/instance conflation (layout is `string[]` of type IDs; duplicates blocked) and silent user-vs-developer ambiguity (7/10).

> **Note on Laguna S 2.1-NVFP4:** This is [Poolside's Laguna S 2.1-NVFP4](https://huggingface.co/poolside/Laguna-S-2.1-NVFP4), a 117.6B-parameter Mixture-of-Experts model (8.5B activated per token) quantized to NVFP4 (~71 GB), designed for agentic coding and long-horizon work. Run with the recommended sampling parameters (`temperature 0.7`, `top_p 0.95`) and thinking disabled. Scores 64.5/80 — 8th overall, narrowly above the 35B-A3B agent-pair run (64/80). Sync (31/40) uses per-issue checkpointing in SQLite with atomic issue+comments+checkpoint commits and SIGINT/SIGTERM graceful shutdown; held back by a dead `last_comment_id` column and silent granularity choice. Widgets (33.5/40) are strong: generic `WidgetDefinition<TData>`, Map registry with side-effect self-registration, clear type/instance split, good README documentation, and consistent widget refactoring — deducted for silent user-vs-developer ambiguity, `as` casts that erase the generic, and no versioned localStorage key.

> **Note on DeepSeek-V4-Flash-0731 IQ3_XXS:** This is [DeepSeek-V4-Flash-0731](https://huggingface.co/unsloth/DeepSeek-V4-Flash-0731-GGUF), the official release of DeepSeek-V4-Flash (284B parameters), in IQ3_XXS quantization (~104 GB) via llama.cpp. Tied for second at 69/80 with Qwen 3.8-FP8 and Q6K. Its widget score (37/40) was the benchmark best until 3.8-4bit reasoning-medium (39/40); it still tops every other model including the previous runner-up (35.5/40 by Qwen 27B-8bit). Sync (32/40) uses per-page checkpointing with three focused helpers (`get_bookmark`, `save_bookmark`, `clear_bookmark`) and implicitly atomic transactions (page data + bookmark committed together in a single `conn.commit()`); bookmark is auto-cleared on completion so normal runs are full syncs. Both READMEs updated with clear documentation. Widgets (37/40) are near-flawless: clean `WidgetDefinition` interface, Map registry with `registerWidget()` and duplicate detection, perfect `WidgetDefinition`/`WidgetInstance` type separation with a proper `instanceId`, consistent body-only widget refactoring with card chrome owned by Dashboard, `sanitize()` validation on localStorage load, and 4/4 on both frontend craft and code quality. Held back only by silent ambiguity-handling on both tasks, no generic settings on the widget contract, and no version in the localStorage key.

> **Note on Qwen 3.6-27B-Q6K (unsloth):** This is Qwen 3.6-27B in GGUF Q6_K quantization (~22 GB), run locally via the [unsloth](https://github.com/unslothai/unsloth) inference framework. It scores 69/80 — tied for second, with strong sync (35/40) and widgets (34/40). Strengths: per-page checkpointing with a `max_commented_issue_id` high-water mark for efficient comment skip-on-resume (unique in the benchmark), perfect type/instance separation in widgets (`WidgetDefinition` vs `WidgetInstance` with a proper `instanceId`), and 4/4 frontend craft. Minor weaknesses: checkpoint written in a separate transaction from the page data commit (not atomic), silent ambiguity-handling on both tasks, no widget README documentation.

> **Note on why Q6K outscores the 8-bit unsloth run:** Q6_K quantization preserves slightly less precision than Q8_0/FP8, so a performance jump despite lower bit-depth is counterintuitive. The most likely explanation is a **chat template update**: the 8-bit run predates recent Unsloth updates to the Qwen3 chat template (thinking-mode delimiter handling, system prompt formatting, EOS token routing). A stale or mismatched chat template can silently degrade generation quality — corrupting how the model processes the system prompt, formats reasoning steps, and terminates responses — in ways that dwarf the ~2-bit quantization gap. A secondary possibility is run-to-run variance: agent-mode benchmarks have meaningful noise, and a single higher run at Q6K vs a single lower run at Q8_0 doesn't prove a systematic ranking. A controlled re-run of the 8-bit model with the current Unsloth template would resolve this.

> **Note on Qwen 3.6-35B-A3B-8bit (agent-pair):** This is the same Qwen 3.6-35B-A3B model in FP8 (8-bit) quantization, run locally with **agent-pair** mode — a pair-programming setup where an observer model reviews the coder's work in real-time and provides feedback. Both coder and observer are the same model (`Qwen3.6-35B-A3B-FP8`). The 8-bit quantization + observer feedback boosts the total from 59/80 (4-bit solo) to 64/80, primarily through a dramatically improved widget score (35 vs 28). The sync score drops slightly (29 vs 31) due to dead code and a commit ordering issue the observer flagged but was not fully addressed.

> **Note on the OpenRouter entry:** the run in `qwen3.6-27B-4bit-openrouter/` was originally mislabeled as "8-bit"; it is believed to be a 4-bit quantized model served via OpenRouter, based on scoring patterns and output style. The locally run unsloth 8-bit results are now tracked separately in `qwen3.6-27B-8bit/`.

> **Note on DeepSeek-V4-Flash-REAP-180B:** This is a [REAP-pruned](https://github.com/CerebrasResearch/reap) derivative of [DeepSeek-V4-Flash](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash), compressed from 641B to ~180B parameters via router-weighted expert activation pruning. It runs on a single NVIDIA DGX Spark. See the [model card](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B) for details. Not to be confused with DS-V4-Flash-0731, the official full 284B release which places 2nd (tied).

> **Note on Qwen 3.6-27B-NVFP4:** This is [NVIDIA's official FP4 quantization](https://huggingface.co/nvidia/Qwen3.6-27B-NVFP4) of Qwen 3.6-27B, quantized with NVIDIA Model Optimizer and served via vLLM. It scores 63/80 — significantly above the community AEON-NVFP4 (57.5/80) and above the GGUF 4-bit quant (59/80), suggesting NVIDIA's NVFP4 format preserves more model quality than llama.cpp's Q4 quantization. Both tasks score 31-32/40 with correct architectural choices (per-page checkpointing, clean registry with type/instance separation) and full existing-code respect. Main weaknesses: transaction ordering bug on sync, CSS duplication on widgets, and silent ambiguity-handling throughout.

> **Note on Qwen 3.6-27B-NVFP4 (unsloth):** This is Qwen 3.6-27B in NVFP4 quantization run locally via the [unsloth](https://github.com/unslothai/unsloth) inference framework, as opposed to the NVIDIA official NVFP4 served via vLLM. It scores 61/80 — 2 points below the NVIDIA official build (63/80). Both use the same NVFP4 quantization format; the narrow gap (30 + 31 vs 31 + 32) is likely marginal per-run variance rather than a systematic inference-stack difference. Key weaknesses: transaction ordering bug on sync (checkpoint written after `conn.commit()`, not atomic), layout migration logic bug on widgets (always-false condition prevents new widget types from auto-appearing in existing layouts), and no documentation on either task.

> **Note on Qwen 3.6-27B-AEON-NVFP4:** This is "Qwen3.6-27B-AEON-Ultimate-Uncensored" — a community fine-tune of Qwen 3.6-27B — run locally in NVIDIA FP4 quantization. It scores 57.5/80, below the standard Qwen 3.6-27B-4bit (59/80), suggesting the uncensored fine-tune and aggressive FP4 quantization slightly degrade architectural reasoning compared to a vanilla 4-bit quant. Its widget implementation has a runtime-breaking typo and dead persistence code, but the core architecture (registry + type/instance split) is sound.

> **Note on Muse Glimmer 30B Q4_K_XL (unsloth):** This is [Unsloth's Muse Glimmer 30B GGUF](https://huggingface.co/unsloth/Muse-Glimmer-30B-GGUF), specifically the Dynamic 2.0 `UD-Q4_K_XL` quant (~15.9 GB). It scores 57/80 (17th of 23): 28/40 on sync and 29/40 on widgets — 1 point above the official Meta K-Quant Dynamic build. Sync uses per-issue checkpointing in a `sync_state` table (`last_page`, `last_issue_id`, `last_created_at`, `completed`) with full existing-code respect (8/8), but over-engineers granularity (rubric prefers per-page) and leaves the design undocumented. Widgets deliver a clean `WidgetMetadata`/`LayoutItem` type-vs-instance split with a class registry and untouched original widgets, held back by silent user-vs-developer ambiguity (5/10), incomplete drag-and-drop scaffolding, `React.ComponentType<any>`, an unversioned localStorage key, and no README update.

> **Note on Muse Glimmer 30B K-Quant Dynamic:** This is [Meta's Muse Glimmer 30B GGUF release](https://huggingface.co/meta-models/Muse-Glimmer-30B-GGUF/), using the `muse-glimmer-30B-kquant-dynamic.gguf` file. It scores 56/80 (18th of 23): 25/40 on sync and 31/40 on widgets. The sync task picks the right per-page, per-repository SQLite checkpoint but writes it in a separate transaction after the page data, leaves the comment subloop unaddressed, and documents none of the design or reset behavior. Widgets are stronger: a central `WidgetDefinition` registry, correct `WidgetInstance`/type separation, simple localStorage-backed customization, and untouched existing widget components. Deductions come from silent ambiguity handling, an unversioned storage key, a one-instance-per-type constraint, missing README documentation, and a fragile `React.ComponentType` type reference without an explicit import.

> **Note on Ornith-1.0-35B-8bit:** This is [DeepReinforce's Ornith-1.0-35B](https://huggingface.co/deepreinforce-ai/Ornith-1.0-35B-GGUF), a 35B-parameter sparse MoE (architecture: `qwen35moe`) specifically post-trained for agentic coding via RL, run locally via llama.cpp at Q8_0 quantization (36.9 GB). Despite strong benchmark results on agentic coding benchmarks like Terminal-Bench 2.1 and SWE-Bench, it places 20th of 23 on this benchmark — a transaction ordering bug and comment-fetch scope regression on the sync task (21/40) and type/instance conflation on widgets (30/40) indicate that benchmark-optimized agentic coding skills don't automatically transfer to architectural judgment under ambiguity.

> **Note on Ternary Bonsai 27B:** This is [prism-ml/Ternary-Bonsai-27B-gguf](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-gguf), a 1.71 bits/weight ternary GGUF (Q2_0_g128) derived from Qwen3.6-27B. It scores 50.5/80 (21st of 23), placing between Ornith (51/80) and A1 FP8 (48/80). The split remains stark: weak on sync (17.5/40), but competitive on widgets (33/40).

> **Note on Step-3.7-Flash IQ4_XS:** This is [StepFun's Step-3.7-Flash](https://huggingface.co/stepfun-ai/Step-3.7-Flash-GGUF), a 198B-parameter sparse MoE (activating ~11B per token) in IQ4_XS quantization (105 GB), run locally via llama.cpp. Despite being the largest model by total parameters in this benchmark, it scores last — the `since`-based conflation on the sync task (19/40) and shallow widget contract (27/40) suggest the small active parameter count (~11B) limits architectural reasoning depth.

> **Note on Agents A1 FP8:** Scores 48/80 (22nd of 23), placing between Ternary Bonsai 27B (50.5/80) and Step (46/80). On the sync task (24/40), the model chose per-issue checkpointing — tracking `last_issue_id` and re-fetching all pages on resume rather than resuming at the right page — and included a vestigial `comments_fetched` field that is written but never read. On the widgets task (24/40), the registry pattern is clean but `WidgetInstance.id` conflates instance identity with widget type ID, meaning duplicate widget types cannot be placed on the dashboard and React key warnings would fire if attempted. Neither README was updated. Main weaknesses relative to the benchmark pack: wrong checkpoint granularity on sync, and the deepest type/instance conflation on widgets (alongside Qwen 3.6-35B-A3B-4bit).

---

## Qualitative Summary

| Dimension | 3.8-27B-FP8 | 3.8-FP8 (med) | 3.8-27B-4bit | 3.8-4bit (med) | 27B-Q6K | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | NVFP4 | Unsloth-NVFP4 | AEON-NVFP4 | Sonnet 4.5 | DS-V4-REAP-180B | DS-V4-0731-IQ3 | Ornith-35B-8bit | Step-3.7-Flash | A1-FP8 | Ternary-27B | Laguna-S2.1 |
|-----------|-------------|---------------|--------------|----------------|---------|------------------|---------------|----------|--------------|---------------------|-------|------------|------------|-----------------|-----------------|----------------|-----------------|----------------|--------|-------------|-------------|
| Engineering execution | Strong on both; best sync score (36/40) | Strong on both (34+34); sync scope creep, widgets +1 vs thinking-off | Strong widgets (34/40); sync undermined by `since` bug (26/40) | Strongest overall (73/80); best widget score (39/40); sync ties FP8-med (34/40) | Strong on both | Strong on both | Solid baseline | Strong on widgets | Strong on sync | Strong on widgets, solid on sync | Strong on both | Solid on both; transaction bug and migration logic bug | Solid architecture, sloppy edges | Most balanced | Solid on both | Strong on both; 2nd-best widget score (37/40); implicit atomic txns | Decent on widgets, weak on sync | Weak on sync, decent on widgets | Weak on sync (wrong granularity), weak on widgets (type/instance bug) | Weak on sync (since-conflation + import bug); strong on widgets | Strong on both; ties sync leaders, near-top widgets |
| Architectural ambition | Higher/clean | Higher/clean; sync adds unrequested incremental path | Higher/clean on widgets; sync structure right but API semantics wrong | Higher/clean; implements both user+dev pluggability; sync adds incremental path (distinguished) | Higher/clean | Higher/clean | Higher/invasive | Higher/invasive but cleaner | Moderate/conservative | Higher/clean | Higher/clean | Higher/clean but unfinished | Conservative/comprehensive | Moderate/clean | Higher/clean | Moderate/clean | Moderate/shallow | Moderate/incomplete | Sync wrong; widgets higher/clean | Higher/invasive (since-conflation + JSON checkpoint) | Higher/clean (per-issue sync; generic widget contract) |
| Reasoning transparency | Mostly silent | Mostly silent (thinking on, medium effort) | Mostly silent | Mostly silent (thinking on, medium effort) | Mostly silent | Silent | Mostly silent | Mostly silent | Mostly silent | Mostly silent | Mostly silent | Silent | Slightly better | Mostly silent | Mostly silent | Silent | Silent | Silent | Silent | Mostly silent | Mostly silent |
| Edge-case handling | Atomic page+state txn; WAL checkpoint; type/instance partial on widgets; no UI bugs | Atomic page+checkpoint txn; `needs_comment_sync()` optimization; incremental sync scope creep; no UI bugs | `since` ID/timestamp conflation; separate txn for checkpoint; no UI bugs | Implicit atomic page+cursor commit; incremental `since` distinguished from crash recovery; perfect type/instance; versioned storage; no UI bugs | High-water mark for comments (novel); no UI bugs; txn not atomic | Missed comments subloop; no UI bugs | Missed nested loop + UI bugs | Better frontend discipline | Better sync failure boundaries | Missed comments subloop; dead start_page param; no UI bugs | Missed comments subloop; txn ordering bug; no UI bugs | Missed comments subloop; txn ordering bug; layout migration logic bug | Missed comments subloop; runtime typo | Best nested-loop handling | Missed comments subloop; good defensive error handling | Missed comments subloop; implicit atomic txns; bookmark auto-clear; sanitize() validation; no UI bugs | Txn ordering bug; comment-fetch scope regression; minor UI issues | Conflated sync concerns; broke sort order | Per-issue instead of per-page; vestigial comments_fetched; type/instance conflation; empty default dashboard | Sync: since-conflation + tomllib import bug; widgets: good localStorage migration with registry validation | Atomic issue+comments+checkpoint; SIGINT/SIGTERM; dead last_comment_id; no duplicate widgets |
| Documentation | Updated sync README; widget README unchanged | Updated both READMEs (sync resumability + widget adding guide) | Updated both READMEs (sync resumability + widget adding guide) | Updated both READMEs (sync resumability + widget user/dev guide) | Updated sync README; widget README unchanged | Updated sync README | Skipped | Minimal | Updated sync README | Skipped | Skipped | Skipped | Skipped | Strongest overall | No sync README; excellent widget README | Updated both READMEs (sync resumability + widget adding guide) | Skipped | Skipped | Skipped | Updated sync README; widget README unchanged | Updated both READMEs (sync resumability + widget architecture guide) |
| Bug/sloppiness profile | Type/instance partial conflation on widgets; silent ambiguity | Incremental sync conflates concerns; type/instance partial conflation; silent ambiguity | `since` bug (sync); no instance IDs (widgets); unversioned storage key | Incremental sync is scope creep (but distinguished); no settings on widget contract; page upserts not in explicit BEGIN/COMMIT | Checkpoint in separate txn (minor); lost widget subtitles | None | 2 frontend bugs | Minor hook/pattern risks | Instance-model gaps | Dead code paths (total_pages, start_page) | Txn ordering bug; CSS duplication | Txn ordering bug; layout migration logic bug (always-false condition) | Runtime typo; dead persistence code | Minor dead-code sloppiness | Type/instance partial conflation | Unversioned localStorage key; implicit txn semantics not documented | Txn bug + scope regression on sync; type/instance partial on widgets | Sort-order regression; unused contract fields | Per-issue checkpoint (inefficient); dead comments_fetched; type/instance conflation; empty-dashboard UX regression | Blocking tomllib import bug (sync); duplicate WidgetInstance definition; unused WidgetConfigSchema | Dead last_comment_id column; generic erased by casts; unversioned storage key |
| **Would merge PR?** | Yes | Yes, with feedback (split incremental sync; note granularity choice) | Sync: No (`since` bug); Widgets: Yes (with minor notes) | Yes (sync: note granularity + explicit txn; widgets: yes) | Yes | Yes | Maybe (fixes needed) | Yes, with minor notes | Yes, with minor notes | Sync: Yes (with fixes); Widgets: Yes | Yes, with minor notes | Yes, with fixes (transaction bug on sync; migration bug on widgets) | Yes, with fixes needed | Yes | Yes, with minor notes | Yes | Sync: No; Widgets: Yes (with notes) | Sync: No; Widgets: Yes (with fixes) | Sync: Reluctantly yes (significant rework needed); Widgets: No (type/instance bug) | Sync: No (import bug + wrong approach); Widgets: Yes (with minor notes) | Yes, with minor notes (drop dead column; version storage key) |

---

## Directory Structure

```
A-vs-B/
├── BENCHMARK.md                         # Full rubric and methodology
├── README.md                            # This file — overall results
├── RESULTS-TASK1-RESUMABLE-SYNC.md        # Task 1 detailed breakdown
├── RESULTS-TASK2-PLUGGABLE-WIDGETS.md   # Task 2 detailed breakdown
├── original/                            # Starting codebases
│   ├── resumable-sync/
│   └── pluggable-widgets/
├── qwen3.8-27B-8bit/                    # Qwen 3.8-27B-FP8 — #2 (69/80); best sync score (36/40); thinking off
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.8-27B-8bit-reasoning-medium/   # Qwen 3.8-27B-FP8 — #5 (68/80); reasoning_effort=medium
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.8-27B-4bit/                    # Qwen 3.8-27B UD-Q4_K_XL (unsloth) — 60/80 (13th); thinking off
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.8-27B-4bit-reasoning-medium/   # Qwen 3.8-27B UD-Q4_K_XL (unsloth) — #1 (73/80); reasoning_effort=medium
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-27B-8bit/                    # Qwen 3.6-27B 8-bit local (unsloth) — 66.5/80 (6th)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-27B-4bit-openrouter/         # Qwen 27B via OpenRouter (was mislabeled as 8-bit)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-27B-4bit/                    # Qwen 27B 4-bit implementations
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-35B-A3B-4bit/                # Qwen 35B-A3B 4-bit implementations
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── agent-pair-qwen3.6-35B-A3B-8bit/      # Qwen 35B-A3B FP8 (agent-pair mode)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── nvidia-qwen3.6-27b-nvfp4/            # NVIDIA official Qwen3.6-27B-NVFP4
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-27b-aeon-ultimate-uncensored-nvfp4/  # AEON fine-tune, NVIDIA FP4
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── claude-sonnet-4.5/                   # Sonnet's implementations
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── deepseek-4-flash-reap-180b/           # DeepSeek-V4-Flash-REAP-180B (pruned 180B MoE)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── ornith-1.0-35b-8bit/                  # Ornith-1.0-35B Q8_0 (35B MoE, agentic coding RL)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── step-3.7-flash-IQ4_XS/               # Step-3.7-Flash IQ4_XS (198B MoE, ~11B active)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── agents-a1-fp8/                       # Agents A1 FP8 — per-issue checkpoint, type/instance conflation
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── unsloth-qwen3.6-27b-nvfp4/            # Qwen 3.6-27B NVFP4 via unsloth — txn bug, migration logic bug
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── deepseek-v4-flash-0731-iq3_xxs/       # DeepSeek-V4-Flash-0731 IQ3_XXS — #2 (69/80); 2nd-best widget score
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── unsloth-qwen3.6-27b-q6_k/             # Qwen 3.6-27B Q6_K via unsloth — #2 (69/80); 35/40 sync
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── ternary-bonsai-27b/                  # Ternary Bonsai 27B Q2_0 (llama.cpp) — 50.5/80 (21st)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── laguna-s2.1-nvfp4/                   # Laguna S 2.1-NVFP4 (Poolside) — 64.5/80 (8th); thinking off
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── muse-glimmer-30b/                    # Muse Glimmer 30B K-Quant Dynamic — 56/80 (18th)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
└── unsloth-muse-glimmer-30B-Q4_K_XL/    # Muse Glimmer 30B Q4_K_XL (unsloth) — 57/80 (17th)
    ├── resumable-sync/
    ├── pluggable-widgets/
    ├── review-resumable-sync.md
    └── review-pluggable-widgets.md
```

---

## Bottom Line

**[Qwen 3.8-27B-4bit (unsloth), reasoning-medium](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF) wins outright at 73/80.** [Qwen 3.8-27B-FP8](https://huggingface.co/Qwen/Qwen3.8-27B-FP8), Qwen 3.6-27B-Q6K (unsloth), and [DeepSeek-V4-Flash-0731 IQ3_XXS](https://huggingface.co/unsloth/DeepSeek-V4-Flash-0731-GGUF) tie for second (69/80). [Qwen 3.8-27B-FP8 (reasoning-medium)](https://huggingface.co/Qwen/Qwen3.8-27B-FP8) places 5th at 68/80 — same FP8 checkpoint with `reasoning_effort="medium"`: sync loses 2 points to incremental-sync scope creep, widgets gain 1 point via README and drag-and-drop. [Qwen 3.8-27B-4bit (unsloth), thinking off](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF) places 13th at 60/80 — same GGUF file as the winner, but thinking disabled: widgets hold up (34/40, tying Q6K) while sync drops 8 points from the reasoning-medium run due to a `since` API bug. [Muse Glimmer 30B Q4_K_XL (unsloth)](https://huggingface.co/unsloth/Muse-Glimmer-30B-GGUF) places 17th at 57/80, narrowly ahead of the official K-Quant Dynamic build (56/80, 18th).

| Rank | Model | Total |
|------|-------|-------|
| 1 | [Qwen 3.8-27B-4bit (unsloth), reasoning-medium](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF) | 73/80 |
| 2 (tie) | [Qwen 3.8-27B-FP8](https://huggingface.co/Qwen/Qwen3.8-27B-FP8) | 69/80 |
| 2 (tie) | Qwen 3.6-27B-Q6K (unsloth) | 69/80 |
| 2 (tie) | [DeepSeek-V4-Flash-0731 IQ3_XXS](https://huggingface.co/unsloth/DeepSeek-V4-Flash-0731-GGUF) | 69/80 |
| 5 | [Qwen 3.8-27B-FP8 (reasoning-medium)](https://huggingface.co/Qwen/Qwen3.8-27B-FP8) | 68/80 |
| 6 | Qwen 3.6-27B-8bit (Local) | 66.5/80 |
| 7 | Claude Sonnet 4.5 | 65/80 |
| 8 | [Laguna S 2.1-NVFP4](https://huggingface.co/poolside/Laguna-S-2.1-NVFP4) | 64.5/80 |
| 9 | Qwen 3.6-35B-A3B-8bit (Local, agent-pair) | 64/80 |
| 10 | [Qwen 3.6-27B-NVFP4](https://huggingface.co/nvidia/Qwen3.6-27B-NVFP4) | 63/80 |
| 11 | [DeepSeek-V4-Flash-REAP-180B](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B) | 62/80 |
| 12 | Qwen 3.6-27B-NVFP4 (unsloth) | 61/80 |
| 13 | [Qwen 3.8-27B-4bit (unsloth), thinking off](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF) | 60/80 |
| 14 (tie) | Qwen 3.6-27B-4bit | 59/80 |
| 14 (tie) | Qwen 3.6-35B-A3B-4bit | 59/80 |
| 16 | Qwen 3.6-27B-AEON-NVFP4 | 57.5/80 |
| 17 | [Muse Glimmer 30B Q4_K_XL (unsloth)](https://huggingface.co/unsloth/Muse-Glimmer-30B-GGUF) | 57/80 |
| 18 | [Muse Glimmer 30B K-Quant Dynamic](https://huggingface.co/meta-models/Muse-Glimmer-30B-GGUF/) | 56/80 |
| 19 | Qwen 3.6-27B-4bit (OpenRouter) | 54/80 |
| 20 | [Ornith-1.0-35B-8bit](https://huggingface.co/deepreinforce-ai/Ornith-1.0-35B-GGUF) | 51/80 |
| 21 | [Ternary Bonsai 27B](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-gguf) | 50.5/80 |
| 22 | Agents A1 FP8 | 48/80 |
| 23 | [Step-3.7-Flash IQ4_XS](https://huggingface.co/stepfun-ai/Step-3.7-Flash-GGUF) | 46/80 |

**Headline patterns:**
- **Sole winner at 73/80:** Qwen 3.8-27B-4bit (unsloth) with `reasoning_effort="medium"` — best widgets in the benchmark (39/40) and a clean 34/40 sync. Same GGUF file as the thinking-off 4bit run, +13 points from turning thinking on.
- **Three runners-up at 69/80** with complementary strengths: Qwen 3.8-FP8 (best sync, 36/40), DS-V4-Flash-0731 (2nd-best widgets, 37/40), Q6K (unique comment high-water mark + strong widgets).
- **Qwen 3.8-27B-FP8** still holds the sync best (36/40) with atomic page+checkpoint transactions and full code quality; widgets are solid (33/40) but held back by type/instance conflation.
- **Thinking-on is not uniformly helpful:** on the FP8 checkpoint, `reasoning_effort="medium"` costs 1 point overall (68 vs 69) via incremental-sync scope creep; on the 4bit GGUF it is the difference between 13th (60) and 1st (73), largely by avoiding the thinking-off `since` API bug and by naming both widget pluggability forks.
- **Locally run unsloth 8-bit** (66.5/80) still outperforms all cloud/API variants, driven by near-perfect widgets (35.5/40).
- **Ambiguity-resolution remains the hardest bar** across all twenty-three models — most implementations pick a path and code it without clearly naming tradeoffs. The 4bit reasoning-medium run is the exception on widgets (10/10).

For per-task architectural comparisons and failure-mode analysis, see [Task 1 results](./RESULTS-TASK1-RESUMABLE-SYNC.md) and [Task 2 results](./RESULTS-TASK2-PLUGGABLE-WIDGETS.md).
