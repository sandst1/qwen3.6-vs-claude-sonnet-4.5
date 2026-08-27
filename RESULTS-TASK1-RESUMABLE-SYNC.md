# Task 1: Resumable Sync — Detailed Results

Make a GitHub→SQLite sync script **resumable after crashes**. Core challenge: picking the right checkpointing granularity.

Starter code: `original/resumable-sync/` · Rubric: [BENCHMARK.md](./BENCHMARK.md) · Overall results: [README.md](./README.md)

---

## Score Breakdown

| Criterion | Max | 3.8-27B-FP8 | 3.8-FP8 (med) | 3.8-27B-4bit | 3.8-4bit (med) | 27B-Q6K | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | NVFP4 | Unsloth-NVFP4 | AEON-NVFP4 | Sonnet 4.5 | Opus 4.6 | DS-V4-REAP-180B | DS-V4-0731-IQ3 | Ornith-35B-8bit | Step-3.7-Flash | A1-FP8 | Ternary-27B | Laguna-S2.1 | Muse Glimmer-30B | Unsloth-Muse-Q4 | Flash-Next Q3 |
|-----------|-----|-------------|---------------|--------------|----------------|---------|------------------|---------------|----------|--------------|---------------------|-------|------------|------------|------------|----------|-----------------|----------------|-----------------|----------------|--------|-------------|-------------|-----------------|-----------------|---------------|
| Architectural judgment | 12 | 11 | 11 | 10 | 11 | 11 | 10 | 8 | 8 | 10 | 10 | 10 | 10 | 9 | 11 | 10 | 10 | 10 | 7 | 7 | 6 | 5 | 9 | 7 | 8 | 10 |
| Ambiguity-handling | 10 | 8 | 6 | 3 | 7 | 8 | 7 | 6 | 5 | 7 | 7 | 7 | 7 | 5 | 7 | 7 | 7 | 7 | 5 | 2 | 5 | 4 | 7 | 6 | 6 | 7 |
| Existing-code respect | 8 | 8 | 8 | 7 | 8 | 8 | 8 | 8 | 8 | 8 | 7 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 6 | 6 | 7.5 | 4 | 8 | 8 | 8 | 8 |
| Debugging / failure-mode | 6 | 5 | 5 | 4 | 4 | 4 | 3 | 2 | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 5 | 3 | 4 | 2 | 3 | 3.5 | 2.5 | 4 | 3 | 4 | 3 |
| Code quality | 4 | 4 | 4 | 2 | 4 | 4 | 3 | 2 | 2 | 3 | 2 | 3 | 2 | 2 | 3 | 3 | 2 | 3 | 1 | 1 | 2 | 2 | 3 | 1 | 2 | 3 |
| **Total** | **40** | **36** | **34** | **26** | **34** | **35** | **31** | **26** | **26** | **31** | **29** | **31** | **30** | **27** | **33** | **33** | **30** | **32** | **21** | **19** | **24** | **17.5** | **31** | **25** | **28** | **31** |

**Leaderboard (sync only):** Qwen 3.8-27B-FP8 (36) · Q6K (35) · Qwen 3.8-FP8 reasoning-medium / 3.8-4bit reasoning-medium (34 tie) · Sonnet / Opus 4.6 (33 tie) · DS-V4-0731 (32) · Flash-Next UD-Q3_K_XL / local 8-bit / NVFP4 / 35B-A3B-4bit / Laguna (31 tie)

---

## Architectural Approaches

| Aspect | 3.8-27B-FP8 | 3.8-FP8 (med) | 3.8-27B-4bit | 3.8-4bit (med) | 27B-Q6K | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | NVFP4 | Unsloth-NVFP4 | AEON-NVFP4 | Sonnet 4.5 | Opus 4.6 | DS-V4-REAP-180B | DS-V4-0731-IQ3 | Ornith-35B-8bit | Step-3.7-Flash | A1-FP8 | Ternary-27B | Laguna-S2.1 | Muse Glimmer-30B | Unsloth-Muse-Q4 |
|--------|-------------|---------------|--------------|----------------|---------|------------------|---------------|----------|--------------|---------------------|-------|------------|------------|------------|----------|-----------------|----------------|-----------------|----------------|--------|-------------|-------------|-----------------|-----------------|
| **State tables** | 1 table: `sync_state` | 1 table: `sync_state` (with `cutoff`) | 1 table: `sync_progress` | 1 table: `sync_state` (with `last_run_at` watermark) | 1 table: `sync_checkpoints` | 1 table: `sync_progress` | 1 table: `sync_progress` | 1 table: `sync_progress` | 1 table: `sync_progress` | 1 table: `sync_state` | 1 table: `sync_state` | 1 table: `checkpoints` | 1 table: `sync_state` | 2 tables: `sync_state` + `pending_comments` | 1 table: `sync_state` (`last_completed_page`, `started_at`) | 1 table: `sync_checkpoints` | 1 table: `sync_state` | 1 table: `sync_state` | 1 table: `sync_state` | 1 table: `sync_progress` | JSON file (`.checkpoints.json`) — not in SQLite | 1 table: `sync_checkpoint` | 1 table: `sync_state` | 1 table: `sync_state` |
| **Checkpoint granularity** | Per-page | Per-page | Per-page (`max_id` after each page commit) | Per-page (`last_page` after each page) | Per-page + `max_commented_issue_id` high-water mark | Per-page | Per-issue | Per-issue | Per-page | Per-page | Per-page | Per-page (with "back up one page" safety margin) | Per-page | Per-page (+ deferred comments checkpointing) | Per-page (`last_completed_page`; bookmark cleared on completion) | Per-page | Per-page (`last_page`; bookmark cleared on completion) | `since`-based (timestamp) | Per-issue (`last_issue_id`, re-fetches pages on resume) | `since`-based (timestamp); 1-second buffer hedge | Per-issue (`last_issue_number`; skips ≤ checkpoint on resume) | Per-page | Per-page | Per-issue (`last_issue_id` + `last_created_at`; mid-page resume) |
| **Comments handling** | Inline fetch for newly-added issues only on resume; page-level atomic commit covers inner loop | `needs_comment_sync()` skips redundant fetches; inline fetch; no inner checkpoint | Inline fetch inside page loop; page-level commit covers inner loop but not documented | Inline fetch inside page loop; page-level commit covers inner loop but not documented | High-water mark (`max_commented_issue_id`) — skips already-fetched comments on resume | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, dead `start_page` param (always 1) | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Deferred to separate pass with per-issue checkpoint | Inline fetch inside page transaction; no inner checkpoint (not argued) | Inline fetch, no inner checkpoint (error-caught) | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint (scope bug) | Inline fetch, try/except per issue | `comments_fetched` field written but never read; effectively no comment checkpoint | Inline fetch; `conn.commit()` at end of `fetch_comments_for_issue()`; no inner checkpoint | Inline fetch; docstring argues upsert idempotency; dead `last_comment_id` column never used | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint |
| **Checkpoint/data transaction coupling** | Strong (page data + `set_sync_state` in same `conn.commit()`) | Strong (page data + `save_checkpoint` in same `conn.commit()`) | Weak (page data commit then separate `mark_repo_progress` commit) | Implicit atomic (`set_sync_state` commits pending page upserts + cursor together) | Weak (separate commits) | Weak (separate commits) | Weak | Stronger (same commit path) | Weak (separate commits) | Weak (separate commits) | Weak (checkpoint after commit) | Weak (checkpoint written after commit, not atomic) | Weak (separate commits) | Medium (implicit/partially coupled) | Strong (`save_sync_progress` before `conn.commit()`; same txn) | Weak (separate commits) | Implicit atomic (page data + bookmark in same sqlite3 implicit txn; single `conn.commit()`) | Weak (progress saved after commit; last-repo never committed) | Weak (state lags one issue) | Weak (separate commits: page data first, progress second) | None (checkpoint in separate JSON file; no transactional coupling to DB) | Strong (issue + comments + checkpoint committed together via `save_checkpoint`) | Weak (checkpoint committed separately after data) | Partial (per-issue commits; state updated alongside each issue, not a page-level transaction) |
| **CLI reset flag** | None | `--force` + `--status` | `--reset` | `--full` | `--reset` | `--reset` | None | None | None | None | `--full` | None | `--fresh` | `--reset` | `--full` | None | None (bookmark auto-clears on completion) | None | None | `--force` | None (README documents SQL `DELETE` to force re-sync) | None | None | None |
| **README update** | Yes | Yes | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No | No | Yes | No (docstring only) | No | Yes | No | No | Yes | Yes | No | No | No |

---

## Key Differences

- **Qwen3.8-Flash-Next UD-Q3_K_XL (unsloth) scores 31/40 on sync** — correct, focused per-page checkpoints stored per repository in `sync_state`. `checkpoint()` writes the next-page cursor before the same `conn.commit()` that persists page data, so a crash cannot advance the cursor ahead of the data. The implementation stays within crash-recovery scope and documents idempotent page retries. It loses points for silently choosing the per-page granularity, leaving the comments subloop rationale implicit, and omitting state-schema versioning.
- **Qwen 3.8-27B-FP8 scores the highest on sync (36/40)** — the benchmark best, topping Q6K (35/40) and every other model (including the 73/80 overall winner). Correct per-page checkpoint granularity with `get_sync_state()`/`set_sync_state()` helpers, strong transactional coupling (page data and progress marker committed atomically in a single `conn.commit()`), WAL mode with `PRAGMA wal_checkpoint(TRUNCATE)` on shutdown, full marks on existing-code respect (8/8) and code quality (4/4), and a clear README "Resumability" section. Loses points on not naming the per-page-vs-per-record tradeoff and no schema versioning for `sync_state`.
- **Qwen 3.8-27B-FP8 (reasoning-medium)** scores 34/40 on sync — 2 points below the thinking-off runner-up on the same FP8 checkpoint, tying 3.8-4bit reasoning-medium. Same per-page checkpointing via `get_checkpoint()`/`save_checkpoint()`, atomic page+checkpoint transactions, WAL mode, comprehensive `test_sync.py` (9 cases), `--status`/`--force` CLI flags, and README update. Loses points on scope creep: adds incremental sync via `cutoff` timestamp (`sync_issues_incremental`) conflating crash recovery with incremental refresh — the same class of mistake Step-3.7-Flash made with GitHub's `since` parameter, though implemented correctly here. Also silent on the per-page-vs-per-record tradeoff.
- **Qwen 3.8-27B-4bit (UD-Q4_K_XL, reasoning-medium)** scores 34/40 on sync — ties FP8 reasoning-medium and is 8 points above the thinking-off 4bit run on the same GGUF. Correct per-page `sync_state` with `get_sync_state()`/`set_sync_state()`, implicit atomic page+cursor commits (`set_sync_state` commits pending upserts), `--full` flag, and a comprehensive README that distinguishes crash-recovery resume from incremental refresh. Incremental sync via GitHub's `since` is still scope creep, but unlike thinking-off 4bit it uses a real ISO timestamp watermark (`last_run_at`) plus a 24h overlap window. Silent on the per-page-vs-per-record tradeoff; page upserts are not wrapped in an explicit `BEGIN`/`COMMIT`.
- **Qwen 3.8-27B-4bit (UD-Q4_K_XL, thinking off)** scores 26/40 on sync — 10 points below the FP8 runner-up and 8 points below the reasoning-medium run on the same GGUF. Picks the right per-page `sync_progress` structure with centralized helpers (`mark_repo_progress`/`load_repo_progress`/`reset_repo_progress`), `--reset` flag, and excellent README documentation. Undermined by a critical `since` bug: passes an integer issue ID to GitHub's `since` parameter (which expects an ISO 8601 timestamp), conflating ID-based checkpointing with timestamp-based filtering. Checkpoint also written in a separate transaction from page data.
- **Q6K scores 35/40 on sync** — correct per-page granularity, full marks on existing-code respect (8/8) and code quality (4/4), and a unique `max_commented_issue_id` high-water mark to efficiently skip already-fetched comments on resume. Updates the README. Minor deduction on transaction atomicity (checkpoint in separate commit from data) and not explicitly naming the per-page vs per-record tradeoff.
- **DeepSeek-V4-Flash-0731 IQ3_XXS scores 32/40 on sync** — correct per-page granularity with centralized bookmark helpers (`get_bookmark`/`save_bookmark`/`clear_bookmark`). Implicit but correct atomic transactions (page data + bookmark in single `conn.commit()`), auto-clears bookmark on completion so normal runs are full syncs, and updates the README with a clear "Resumable" section. Full marks on existing-code respect (8/8). Loses points on not naming the granularity tradeoff and not checkpointing the inner comment loop.
- **Claude Opus 4.6 (GitHub Copilot)** scores 33/40 on sync — ties Sonnet for 5th-best. Correct per-page `sync_state` with three focused helpers (`get_resume_page`/`save_sync_progress`/`clear_sync_state()`), strong transactional coupling (`save_sync_progress` before `conn.commit()`), `--full` flag, and no incremental-sync scope creep. Full marks on existing-code respect (8/8) and strong failure-mode reasoning (5/6 — better than Sonnet's 4/6). Loses points on silent granularity choice (1/4 for naming the ambiguity), no README update (docstring only), and not arguing why the comments subloop needs no inner checkpoint.
- Sonnet remains the only model that explicitly addresses nested-loop resumability in architecture, but Q6K's high-water mark is a practical middle ground that handles the same problem for most real-world repos. Opus matches Sonnet's total (33/40) with a simpler, more tightly transactional per-page design and no deferred-comment pass.
- Local 8-bit and 35B-A3B-4bit both choose per-page granularity and both score 31/40 on this task.
- **Laguna S 2.1-NVFP4** also scores 31/40 on sync — ties the local 8-bit / NVFP4 / 35B-A3B-4bit pack. Picks per-issue checkpointing (same family as the cloud 27B-4bit variants and A1, but cleaner): issue + comments + checkpoint commit together atomically, SIGINT/SIGTERM graceful shutdown, and a clear README. Loses points on silent granularity choice and a dead `last_comment_id` column that is never read.
- **35B-A3B-8bit (agent-pair)** also picks per-page granularity (29/40) — correct architecture but loses points on dead code (`total_pages` miscalculation, unused `start_page` parameter in `sync_comment_pages`) and no documentation. The observer feedback identified issues, but not all were addressed in the final version.
- **NVFP4** (NVIDIA's official Qwen 3.6-27B-NVFP4) picks per-page granularity (correct) and scores 31/40 — matching the local 8-bit. Full marks on existing-code respect (8/8), strong ambiguity-handling (7/10), and a `--full` flag for fresh starts. Loses points on transaction ordering (checkpoint written after commit) and no README update.
- **Unsloth-NVFP4** also picks per-page granularity (scoring 30/40) — 1 point below the NVIDIA official, with the same transaction ordering weakness. Adds a "back up one page" safety margin on resume (sensible) but no CLI reset flag and no README update. Code quality is 2/4 vs 3/4 for the NVIDIA build, accounting for the full gap.
- DeepSeek-V4-REAP-180B also picks per-page granularity (scoring 30/40), matching the right answer but losing points on documentation and transaction coupling.
- **AEON-NVFP4** picks per-page granularity (correct) and scores 27/40 — solid existing-code respect (8/8) but loses points on documentation (README unchanged) and silent ambiguity-handling.
- **[Muse Glimmer 30B K-Quant Dynamic](https://huggingface.co/meta-models/Muse-Glimmer-30B-GGUF/)** scores 25/40 on sync. Its per-page `sync_state` checkpoint, stored per repository in `issues.db`, is the right basic design and preserves the existing code perfectly. It loses ground because the checkpoint is committed separately after page data, comment-loop crashes are not addressed, and the mechanism is undocumented.
- **[Muse Glimmer 30B Q4_K_XL (unsloth)](https://huggingface.co/unsloth/Muse-Glimmer-30B-GGUF)** scores 28/40 on sync — 3 points above the official K-Quant Dynamic build. It centralizes state in a single `sync_state` table (`get_sync_state()` / `upsert_sync_state()`) with full existing-code respect (8/8) and correct per-repo tracking, but over-engineers the granularity: it checkpoints after every individual issue (with 20 lines of mid-page resume logic) rather than the simpler, sufficient per-page approach the rubric calls for. Silent on design rationale (no README update, no comments) and the inner comments loop is still uncheckpointed.
- Both OpenRouter 27B variants converge on per-issue checkpointing, which is workable but heavier than needed.
- Local 8-bit adds a `--reset` flag and updates the README — matching Sonnet's operational completeness. AEON-NVFP4 adds `--fresh` but doesn't update docs.
- **Ornith-1.0-35B picks per-page granularity** (matching the stronger models) but undermines it with a transaction ordering bug — `save_progress` is called *after* `conn.commit()`, leaving the checkpoint in a separate implicit transaction. For the last repo, the progress is never durably stored. It also introduced a comment-fetch scope regression (comments fetched for PRs too, not just issues).
- **Step-3.7-Flash is the only model to conflate resumability with incremental sync** — using GitHub's `since` parameter rather than page-based checkpointing. The rubric explicitly flags this as a different feature ("incremental refresh, not crash recovery"). It also changed the sort order from `created` to `updated`, breaking the pagination stability the original code deliberately maintained.
- **Ternary Bonsai 27B shares the `since`-conflation with Step** (17.5/40) — the only other model to use `since` as the primary resumability mechanism. It compounds the mistake by storing checkpoint state in a separate `.checkpoints.json` file rather than SQLite (losing the transactional coupling), and has a blocking `tomllib` import bug that would prevent the script from running at all. It does update the README and track per-repo cursors. The result is the lowest sync score in the benchmark.

---

## Strong/Weak Signals

| Signal | 3.8-27B-FP8 | 3.8-FP8 (med) | 3.8-27B-4bit | 3.8-4bit (med) | 27B-Q6K | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | NVFP4 | Unsloth-NVFP4 | AEON-NVFP4 | Sonnet | Opus 4.6 | DS-V4-REAP-180B | DS-V4-0731-IQ3 | Ornith-35B-8bit | Step-3.7-Flash | A1-FP8 | Ternary-27B | Laguna-S2.1 |
|--------|-------------|---------------|--------------|----------------|---------|------------------|---------------|----------|--------------|---------------------|-------|------------|------------|--------|----------|-----------------|----------------|-----------------|----------------|--------|-------------|-------------|
| State stored in `issues.db` (not JSON) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Per-repo cursors | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| State in same transaction as page commits | ✅ | ✅ | ❌ | ⚠️ implicit | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ | ❌ | ✅ (implicit) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Notes per-page-vs-per-record tradeoff | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Updates README | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Uses `since` (conflates with resumability) | ❌ | ⚠️ conflated (incremental sync via `cutoff` timestamp) | ❌ ⚠️ conflated (ID passed to timestamp param) | ⚠️ incremental via `since`, distinguished from crash recovery | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ conflated | ❌ | ⚠️ conflated (since + JSON file) | ❌ |

---

## Analysis (Sync Task)

### Where Qwen 3.8-27B-4bit (reasoning-medium) Was Competitive

1. **34/40 on sync** — ties FP8 reasoning-medium for 3rd-best, behind only thinking-off FP8 (36) and Q6K (35). Same per-page `sync_state` helpers as the FP8 thinking-off run (`get_sync_state()` / `set_sync_state()`).
2. **8-point jump vs thinking-off 4bit** (26 → 34) on the same GGUF: uses a real ISO timestamp watermark for incremental sync instead of passing an issue ID to GitHub's `since` parameter, and commits the page cursor together with pending upserts.
3. **README distinguishes crash recovery from incremental refresh** — still scope creep, but documented as two features rather than conflated into one broken `since` call.

### Where Qwen3.8-Flash-Next UD-Q3_K_XL Was Competitive

1. **31/40 on sync** — ties the local 8-bit, NVIDIA NVFP4, 35B-A3B-4bit, and Laguna implementations with a correct per-page checkpoint in the same SQLite database.
2. **Strong transaction coupling** — page data and the cursor are committed together, avoiding the separate-transaction weakness common to several 31-point runs.
3. **Focused scope and operational documentation** — no incremental-sync conflation, with a README that explains restart behavior and safe idempotent retries.

### Where Qwen 3.8-27B-FP8 (reasoning-medium) Was Competitive

1. **34/40 on sync** — ties 3.8-4bit reasoning-medium for 3rd-best, behind only thinking-off FP8 (36) and Q6K (35). Same atomic page+checkpoint transaction pattern, WAL mode, and comprehensive test coverage as the FP8 thinking-off runner-up.
2. **Better operational ergonomics than thinking-off**: adds `--status` and `--force` CLI flags, SIGTERM handler, and enhanced retry logic (429 handling, `Retry-After` header).
3. **`needs_comment_sync()` optimization**: skips redundant comment fetches when an issue's `updated_at` hasn't changed — a practical middle ground without a full inner checkpoint loop.

### Where Qwen 3.8-27B-FP8 Led

1. **Best sync score overall (36/40)** — tops every other model including Q6K (35/40), Sonnet (33/40), and DS-V4-Flash-0731 (32/40). Correct per-page checkpoint granularity with `get_sync_state()`/`set_sync_state()` helpers, strong transactional coupling (page data and progress marker committed atomically in a single `conn.commit()`), WAL mode with `PRAGMA wal_checkpoint(TRUNCATE)` on shutdown, full marks on existing-code respect (8/8) and code quality (4/4), and a clear README "Resumability" section.
2. **Strong transactional coupling**: One of a small set of models to commit checkpoint and page data in the same transaction (alongside 3.8-4bit reasoning-medium, Opus 4.6, Laguna, DS-V4-0731, and Qwen 27B-4bit) — unlike Q6K, which writes the checkpoint in a separate commit.

### Where Q6K Led

1. **35/40 on sync** with a unique `max_commented_issue_id` high-water mark that allows efficient skip-on-resume for comments without a full inner checkpoint loop — a practical middle ground Qwen 3.8 does not implement.
2. Correct per-page granularity, `--reset` flag, README update, full marks on existing-code respect (8/8) and code quality (4/4). Minor deduction on transaction atomicity.

### Where Claude Opus 4.6 Was Competitive

1. **Ties Sonnet for 5th-best on sync (33/40)** — behind FP8 (36), Q6K (35), and the two reasoning-medium 3.8 runs (34). Correct per-page granularity, atomic page+cursor commits, `--full` flag, no `since` creep.
2. **Stronger failure-mode reasoning than Sonnet** (5/6 vs 4/6): `save_sync_progress()` is called before `conn.commit()`, so a mid-page crash rolls back both data and cursor.
3. **Under-communicates**: silently picked per-page (1/4 for naming the ambiguity) and left the README unchanged.

### Where Sonnet Was Competitive

1. **Ties Opus 4.6 for 5th-best on sync (33/40)** after Qwen 3.8 and Q6K.
2. **Nested-loop resumability**: The only implementation that explicitly handles the comments subloop with dedicated architecture (`pending_comments` table + deferred comment pass).

### Where DeepSeek-V4-REAP-180B Was Competitive

1. **30/40 on sync** — nearly matches per-page checkpoint leaders; picks correct per-page granularity.
2. **Existing-code style match**: Reads like it was written by the original author.
3. **Defensive error handling**: try/except around individual issue and comment processing.

### Where Other Variants Stood Out (Sync)

1. **[Laguna S 2.1-NVFP4](https://huggingface.co/poolside/Laguna-S-2.1-NVFP4)**: 31/40 — ties per-page leaders despite per-issue granularity; strongest transaction coupling in the pack (issue + comments + checkpoint committed together) plus SIGINT/SIGTERM handling.
2. **Qwen 3.6-27B-NVFP4**: 31/40 — balanced, correct per-page checkpointing; transaction ordering bug is the main weakness.
3. **Qwen 3.6-35B-A3B-4bit**: Strongest cloud Qwen on sync (31/40), choosing per-page checkpointing and keeping changes surgical.

### Where Models Fell Short (Sync)

**Qwen 3.8-27B-4bit (UD-Q4_K_XL, thinking off) (26/40)**
- Correct per-page `sync_progress` structure with centralized helpers and excellent README.
- Critical `since` bug: passes integer issue ID to GitHub's timestamp parameter.
- Checkpoint written in separate transaction from page data.

**Ornith-1.0-35B (21/40)**
- Transaction ordering bug: `save_progress` after `conn.commit()`; last repo's progress never durably stored.
- Comment-fetch scope regression: comments fetched for PRs too.
- Misleading docstring claiming checkpoint is "inside the same txn."

**Step-3.7-Flash (19/40)**
- Conflated resumability with incremental sync via GitHub's `since` parameter.
- Changed sort order from `created` to `updated`, breaking pagination stability.
- No documentation.

**Agents A1 FP8 (24/40)**
- Per-issue checkpointing instead of per-page — re-fetches all prior pages on resume.
- Vestigial `comments_fetched` field written but never read.
- No README update.

**Ternary Bonsai 27B (17.5/40)**
- `since`-based conflation (with Step, the only two models to do this).
- Checkpoint state in separate JSON file, not SQLite.
- Blocking `tomllib` import bug.

### Cross-Task Patterns (Sync-Relevant)

- **Ambiguity naming is weak overall**: most models silently pick per-page checkpointing without naming alternatives.
- **Transactional reasoning is often implicit**: explicit partial-failure discussion is limited.
- **Benchmark-optimized agentic coding ≠ architectural judgment**: Ornith places 21st of 24 overall; transaction ordering bug and comment-fetch regression on sync are primary weaknesses.

---

See also: [Task 2 — Pluggable Widgets](./RESULTS-TASK2-PLUGGABLE-WIDGETS.md) · [Overall results](./README.md)
