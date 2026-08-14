# Qwen 3.8 27B — Parameter Overview

Qwen 3.8 27B is the strongest model in this benchmark — but only in one of the four settings. The interesting result is not “4-bit vs 8-bit” or “thinking on vs off.” It is the interaction.

The four runs are a 2×2: Unsloth `UD-Q4_K_XL` GGUF vs official FP8, each with thinking off and with thinking on + `reasoning_effort=medium`. Same starter code, same underspecified prompts, same rubric (architectural judgment, ambiguity-handling, existing-code respect, failure-mode reasoning, quality).

| Setting | Sync | Widgets | Total | Rank (of 23) |
|---|---|---|---|---|
| 4-bit, thinking off | 26 | 34 | **60** | 13th |
| 4-bit, medium | 34 | 39 | **73** | **1st** |
| 8-bit (FP8), thinking off | 36 | 33 | **69** | 2nd (tie) |
| 8-bit (FP8), medium | 34 | 34 | **68** | 5th |

Thinking is not uniformly helpful. On the 4-bit GGUF it is the difference between 13th and 1st (+13). On FP8 it costs a point (69 → 68). Bits and thinking trade off: more precision without thinking wins sync; less precision with thinking wins widgets — and the overall table.

Source: [README.md](./README.md), [Task 1: Resumable Sync](./RESULTS-TASK1-RESUMABLE-SYNC.md), [Task 2: Pluggable Widgets](./RESULTS-TASK2-PLUGGABLE-WIDGETS.md).

---

## Sync (crash-resume a GitHub→SQLite script)

The trap is checkpoint granularity, plus not conflating crash recovery with incremental refresh.

FP8 with thinking off is the best sync run in the whole field (36/40): per-page `sync_state`, page data and cursor in one `commit()`, WAL, clean README. It stays in scope.

Turn thinking on at FP8 and it drops to 34. The architecture is still right — atomic page+checkpoint, WAL, `--status`/`--force`, a real test file — but medium effort invents a second feature: incremental sync via a `cutoff` timestamp. Implemented correctly, still the wrong problem. The rubric treats that as conflating crash recovery with incremental refresh (the same class of mistake as Step-3.7-Flash’s `since` path). Ambiguity-handling falls 8 → 6.

4-bit with thinking off is the weak cell (26/40). Structure is fine (per-page `sync_progress`, helpers, `--reset`, good README). The failure is semantic: it passes an integer issue ID to GitHub’s `since`, which wants an ISO-8601 timestamp. Checkpoint also lands in a separate transaction. That one API slip is most of the 10-point gap vs FP8 thinking-off.

4-bit + medium recovers to 34 and ties FP8+medium. Same incremental-`since` temptation, but it uses a real ISO watermark (`last_run_at` + 24h overlap) and the README separates crash resume from incremental refresh. Still scope creep; not a broken API call. Implicit atomic page+cursor commit, no explicit `BEGIN`/`COMMIT`.

So on sync, extra thinking at high precision expands the problem. Extra thinking at 4-bit mostly prevents a precision-sensitive API bug.

---

## Widgets (make a React dashboard “pluggable”)

The trap is “pluggable for whom” — end users vs developers — and not conflating widget type with widget instance.

4-bit + medium is the best widget run in the field (39/40), two points above DeepSeek-V4-Flash-0731. Perfect `WidgetDefinition` / `WidgetInstance` split with unique `key`s, Map registry + duplicate throw, versioned `ops-dashboard.layout.v1`, native drag-and-drop, full marks on existing-code respect / frontend craft / quality. The only 10/10 on ambiguity: the README names both forks and implements both. Deduction is no settings abstraction on the contract.

The other three Qwen 3.8 widget runs cluster at 33–34. Thinking-off 4-bit (34) already has a clean `WidgetDef`/`WidgetPlacement` split, Map registry, and a good README — but no unique instance IDs, unversioned storage, and the user/dev fork is implicit (8/10). FP8 thinking-off (33) is solid (`WidgetShell`, versioned storage, 4/4 frontend) but layout is `WidgetId[]` of type IDs, duplicates blocked, silent on the fork, no README update. FP8 + medium gains one point (README + drag-and-drop) and still has the type/instance conflation and 7/10 ambiguity.

Thinking at 4-bit is what unlocks naming the fork and modeling instances. The same thinking budget at FP8 does not produce that leap — it adds polish on top of the same type-ID layout.

---

## Why it probably went this way

1. **Thinking is a verifier at 4-bit and a scope expander at 8-bit.** The `since` bug is “looks right if you don’t check the API.” A reasoning pass can catch “this parameter is a timestamp.” FP8 thinking-off already had the right sync architecture in weights; medium effort then searched for a *more complete* design and shipped incremental sync. Higher fidelity + more search → more unrequested features, not fewer bugs.

2. **4-bit hurts exact API / type semantics more than high-level shape.** All four runs pick per-page checkpointing and a registry. The 4-bit thinking-off collapse is not “wrong architecture”; it is one wrong type flowing into GitHub. That is the kind of local fact quantization is most likely to scramble, and the kind of check thinking is most likely to restore.

3. **Ambiguity-handling is the dimension thinking actually moves — in both directions.** 4-bit sync ambiguity 3 → 7; 4-bit widgets 8 → 10. FP8 sync ambiguity 8 → 6, because thinking named a second interpretation and then built it. Most of the field silently picks a path. Medium effort makes the model *talk* about alternatives; it does not guarantee it will stay inside the prompt.

4. **Widgets reward explicit tradeoff-naming more than raw precision.** FP8 thinking-off already writes clean React. It still treats layout as a list of type IDs and never says “pluggable for users vs developers.” The 4-bit medium run is the only one that treats that as the problem. That is a planning/framing win, not a bits win — which is why a smaller quant with thinking can beat a cleaner quant without it on this task.

5. **Do not overfit a 2×2 of single agent runs.** The methodology flags run-to-run variance. Stacks also differ: 4-bit is Unsloth GGUF on llama.cpp; FP8 is the official checkpoint. Chat template, sampling, and one unlucky `since` call can move the table. The *pattern* (thinking rescues 4-bit, slightly hurts FP8 via scope creep) is consistent across both tasks; the exact 73 vs 69 gap might shrink on a re-run.

---

## Takeaway

Qwen 3.8 27B already has the architectural priors this benchmark is measuring. Quantization and thinking change whether those priors get *checked* or *elaborated*. If you are on 4-bit, turn thinking on at medium — that is the difference between a mergeable pair of PRs and a broken GitHub filter. If you are on FP8, thinking-off is the tighter, more in-scope coder; medium adds tests, flags, and drag-and-drop, and also a second product you did not ask for. For this kind of underspecified coding work, `reasoning_effort=medium` is not “more quality.” It is a different error profile: fewer silent semantic bugs, more well-implemented extras.
