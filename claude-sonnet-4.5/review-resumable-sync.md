# Review: B/resumable-sync

## Summary

B adds resumability via two new SQLite tables (`sync_state`, `pending_comments`) in the same `issues.db`. Issue pages are checkpointed after each page commit, and comment fetching is deferred to a separate pass tracked per-issue with per-page granularity. A `--reset` CLI flag allows clearing state. The README is updated with resumability docs. Existing retry/rate-limit logic and code style are preserved faithfully.

---

## Scores

### Architectural judgment — 11 / 12

| Criterion | Score | Notes |
| --- | --- | --- |
| Picks the right granularity | **4/4** | Per-page checkpointing — the natural fit. Implemented cleanly via `current_page` in `sync_state`. |
| Centralizes the checkpoint logic | **3/4** | State lives in `sync_state` and `pending_comments` tables with dedicated helper functions (`get_sync_state`, `init_sync_state`, `update_sync_state`, `mark_sync_completed`, etc.). The logic is clearly organized but spread across ~8 standalone functions rather than a single class or module. Readable, but not quite "one obvious place." |
| Handles the comments-per-issue subloop | **4/4** | Strong design. Instead of fetching comments inline during page processing (the original approach), B defers them into a `pending_comments` table and processes them in a separate pass. Each pending issue tracks its own `current_page` for comment pagination. On resume, pending comments are processed before continuing with issue pages. Both loops are independently resumable. |

### Ambiguity-handling — 7 / 10

| Criterion | Score | Notes |
| --- | --- | --- |
| Names the ambiguity | **1/4** | The model never surfaces the per-page vs. per-record tradeoff. It picks per-page (correctly) but doesn't explain *why* — no written reasoning about granularity options. The README describes the mechanism but not the design decision. |
| Doesn't conflate concerns | **3/3** | Stays tightly focused on crash recovery / resumability. No `since`-based incremental sync, no extra CLI flags beyond `--reset`, no scope creep into retry policy changes. |
| Reasonable defaults | **3/3** | State in SQLite (same DB, single source of truth), checkpoint per page, `--reset` for fresh start. All sensible. |

### Existing-code respect — 8 / 8

| Criterion | Score | Notes |
| --- | --- | --- |
| Reuses the SQLite connection / DB | **3/3** | State goes into `issues.db` via new tables. No `state.json`. Transactionally consistent with data writes. |
| Matches the existing style | **2/2** | Same logging idioms (`logger.info/warning`), same import organization, same snake_case naming. `argparse` is a natural addition. |
| Doesn't break what works | **3/3** | `request_with_retry` is preserved verbatim. Rate-limit handling, `IF NOT EXISTS` schema pattern, `upsert_issue`, `upsert_comment` — all untouched. The PR/skip filter, the `created asc` sort, the backoff logic: all intact. |

### Debugging / failure-mode reasoning — 4 / 6

| Criterion | Score | Notes |
| --- | --- | --- |
| Considers the partial-page crash case | **2/3** | The implementation *does* handle this correctly in practice: issue upserts and `add_pending_comment_fetch` calls accumulate in Python's sqlite3 implicit transaction, which is committed atomically by `update_sync_state` → `conn.commit()`. So the page data and the checkpoint are all-or-nothing. However, this is an artifact of sqlite3 module behavior, not an explicit design choice — there's no `BEGIN`/`COMMIT` block, no comment explaining the transactional intent, and no written reasoning about the partial-page scenario. |
| Considers schema drift | **2/3** | New tables use `IF NOT EXISTS`, consistent with the existing pattern. But there's no state-version field, no migration logic, and no discussion of what happens if the `sync_state` schema evolves. A later refactor (e.g., adding columns to `sync_state`) would silently leave old rows with missing data. |

### Code quality — 3 / 4

Good clarity and naming throughout. Docstrings on all new functions. README updated with clear usage instructions. Minor nits: `import json` is still buried inside `upsert_issue` (inherited from original, not cleaned up), and the file grew from ~180 to ~440 lines without any structural decomposition (everything in one module). No inline documentation of the transactional guarantees, which are the most subtle part of the design.

---

## Total: 33 / 40

## Strong signals present

- Writes resume state in a transaction with the page commits (implicitly via sqlite3 module behavior)
- Stores state in `issues.db` itself (`sync_state` table, not `state.json`)
- Tracks per-repo cursors (each repo has its own `sync_state` row)
- Adds resume info to the README
- Does not conflate `since` with crash recovery

## Weak signals present

- Does not name or discuss the per-page vs. per-record tradeoff
- Transactional correctness is incidental rather than explicit
- No discussion of failure modes in code or docs

## Notable design choices

**Deferred comment fetching:** Rather than fetching comments inline during page processing (as the original does), B collects issues needing comments into `pending_comments` and processes them in a separate pass. This is arguably better than the original's approach for resumability — a crash during comment fetching for a single large issue doesn't block the outer page loop. On resume, the issue pages can continue from where they left off and pending comments are picked up independently.

**Completed-state handling:** Once issue sync is marked `completed`, re-running skips straight to pending comments. This correctly handles the case where we crash after finishing issue pages but before all comments are fetched. However, it also means re-running the script *after a full sync* is a no-op (no way to pick up updated issues without `--reset`). This is fine for the stated task (resumability, not incremental sync), but worth noting.
