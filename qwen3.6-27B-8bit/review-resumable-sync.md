## Assessment: A/resumable-sync

### Diff summary

The implementation adds three things to the original `sync.py`:

1. A `sync_progress` table (repo → last_synced_page) in `init_db`
2. Three helper functions: `checkpoint_progress`, `clear_progress`, `get_last_synced_page`
3. Modified `sync_issues` to resume from `get_last_synced_page(conn, repo) + 1` and checkpoint after each page

The `import json` was also moved from inside `upsert_issue` to the module top level. Config, README, and all other files are untouched.

---

### Architectural judgment — 8 / 12

**Picks the right granularity (3/4):** Correctly picks per-page. This is the natural fit — per-record would be over-engineered, per-run too coarse. However, the model never *explains* why it chose per-page; it just implements it. Partial credit for the right choice without the reasoning.

**Centralizes the checkpoint logic (4/4):** Clean separation. The `sync_progress` table is the single source of truth, and all access goes through three small, well-named helper functions (`checkpoint_progress`, `clear_progress`, `get_last_synced_page`). Easy to find, easy to reason about.

**Handles the comments-per-issue subloop (1/4):** The inner comment-fetching loop has no checkpoint. If the process crashes mid-comment-fetch on a popular issue, all progress on that page is lost and the entire page is re-fetched on resume. Since upserts are idempotent this is *safe*, but the model never acknowledges the tradeoff or argues why the inner loop doesn't need its own checkpoint. The rubric asks for either a checkpoint or an explicit argument — this provides neither.

### Ambiguity-handling — 6 / 10

**Names the ambiguity (0/4):** The model silently picks per-page and codes it. No written rationale, no comment, no README note discussing per-page vs per-record. This is the "just picks and codes" weak signal from the rubric.

**Doesn't conflate concerns (3/3):** Stays cleanly scoped. No `since` parameter, no incremental sync, no CLI flags. The implementation is purely about crash-recovery resumability, which is exactly what was asked for.

**Reasonable defaults (3/3):** State goes into `issues.db` (same DB — one source of truth). Cursors are per-repo (handles the two-repo config correctly). Progress is cleared after a full sync completes so stale state doesn't accumulate.

### Existing-code respect — 8 / 8

**Reuses the SQLite connection / DB (3/3):** State lives in the same `issues.db` as the data, in a dedicated `sync_progress` table. No separate JSON file.

**Matches the existing style (2/2):** Same logging idioms (`logger.info`), same naming conventions (snake_case, verb-noun function names), same import organization. The `import json` move to module scope is actually a small improvement over the original's inline import.

**Doesn't break what works (3/3):** Retry logic, rate-limit handling, `IF NOT EXISTS` schema creation, PR filtering, upsert logic — all preserved byte-for-byte.

### Debugging / failure-mode reasoning — 2 / 6

**Considers the partial-page crash case (1/3):** The implementation *accidentally* gets partial-page safety right: Python's `sqlite3` module uses implicit transactions, so all inserts within a page are uncommitted until `conn.commit()`. A mid-page crash rolls them back. However, the checkpoint write is a *separate* commit:

```python
conn.commit()                          # commits page data
checkpoint_progress(conn, repo, page)  # does its own INSERT + commit
```

If the process dies between these two lines, the data is committed but the checkpoint isn't — causing a harmless-but-wasteful re-fetch on resume. The strong-signal pattern from the rubric is writing the checkpoint *in the same transaction* as the page data. The model doesn't discuss any of this.

**Considers schema drift (1/3):** The new table uses `CREATE TABLE IF NOT EXISTS`, which is consistent with the existing pattern. But there's no state-version field and no discussion of what happens if the `sync_progress` schema changes later.

### Code quality — 2 / 4

The code itself is clean: good function names, docstrings on the new helpers, consistent formatting. But the README is **unchanged** — there's no mention of the resume mechanism, how to check progress, or how to force a fresh sync. The rubric's strong/weak table flags "Adds the resume info to the README" as strong and "Silent diff" as weak. This is a silent diff.

---

### Scorecard

| Category | Max | Score |
|---|---|---|
| Architectural judgment | 12 | 8 |
| Ambiguity-handling | 10 | 6 |
| Existing-code respect | 8 | 8 |
| Debugging / failure-mode reasoning | 6 | 2 |
| Code quality | 4 | 2 |
| **Total** | **40** | **26** |

### Strong / weak signal tally

| Signal | Present? |
|---|---|
| Resume state in same transaction as page commits | No — separate commits |
| State stored in `issues.db` | Yes |
| Notes per-page-vs-per-record tradeoff in writing | No |
| Per-repo cursors | Yes |
| Adds resume info to README | No |
| Asks the right question (e.g. partial-page rollback) | No |

### Bottom line

A competent, well-scoped implementation that gets the core mechanism right (per-page, per-repo, in the same DB) and doesn't break existing functionality. The main gaps are all about *reasoning* rather than *code*: the model never surfaces the granularity tradeoff, never discusses the comment subloop, never considers the two-commit atomicity gap, and doesn't update the README. Solid engineering, thin engineering judgment.
