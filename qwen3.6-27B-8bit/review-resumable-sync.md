# Review: amodel — Resumable Sync

## Summary

The model implemented per-page checkpointing via a `sync_progress` table in the same SQLite database. The approach is sound and addresses the user's core complaint (restarting from scratch is painful). The implementation is clean, respects the existing code style, and adds appropriate documentation. Main weaknesses: silent design decision (no explicit tradeoff discussion), the inner comments loop isn't checkpointed, and progress isn't saved transactionally with page commits.

---

## Rubric Scores

### Architectural judgment — 10/12 pts

| Criterion | Score | Notes |
|-----------|-------|-------|
| Picks the right granularity | **4/4** | Per-page checkpointing is the natural fit here, and the model chose it. `sync_progress` stores `last_page` per repo. |
| Centralizes the checkpoint logic | **4/4** | Clean separation: `save_progress()`, `load_progress()`, `clear_progress()` functions + dedicated `sync_progress` table. One obvious place for all state. |
| Handles the comments-per-issue subloop | **2/4** | The inner comments loop is **not** checkpointed. If a crash happens mid-comment-fetch on an issue with many comments, progress is lost. The model doesn't acknowledge this or argue why it's acceptable (comments are small, upserts are idempotent, etc.). |

### Ambiguity-handling — 7/10 pts

| Criterion | Score | Notes |
|-----------|-------|-------|
| Names the ambiguity | **1/4** | Silent pick. No discussion of per-page vs per-record tradeoff in the code, commit message, or README. Just implemented per-page without explaining why. |
| Doesn't conflate concerns | **3/3** | Stayed focused on resumability. Did not scope-creep into incremental sync via `since`, additional retry logic, or unasked-for CLI features. |
| Reasonable defaults | **3/3** | State stored in same DB (transactional with data), per-page granularity matches existing commit pattern, added sensible `--reset` flag for force-restart scenarios. |

### Existing-code respect — 8/8 pts

| Criterion | Score | Notes |
|-----------|-------|-------|
| Reuses the SQLite connection / DB | **3/3** | ✓ `sync_progress` table lives in `issues.db`, not a separate JSON file. One source of truth. |
| Matches the existing style | **2/2** | Same logging idioms, same import organization, same naming conventions. New functions (`save_progress`, etc.) fit naturally. |
| Doesn't break what works | **3/3** | Retry logic preserved, rate-limit handling preserved, schema migration pattern (`IF NOT EXISTS`) used consistently for new table. |

### Debugging / failure-mode reasoning — 3/6 pts

| Criterion | Score | Notes |
|-----------|-------|-------|
| Considers the partial-page crash case | **1/3** | **Weak.** Progress is saved *after* the page commit, not in the same transaction. Sequence: `conn.commit()` (line 247) then `save_progress()` (line 248) which does its own commit. If crash occurs between them, the page data is saved but progress isn't, causing a harmless re-fetch on resume — but not ideal. Should be one transaction. |
| Considers schema drift | **2/3** | Uses `IF NOT EXISTS` consistently for the new table. No explicit version field in `sync_progress`, but the schema is simple enough that this is likely fine for now. |

### Code quality — 3/4 pts

- Clear naming: `sync_progress`, `save_progress`, `load_progress`, `clear_progress`.
- Docstrings added where helpful (`sync_issues` updated to mention resumption).
- README updated with "Resumable sync" section explaining usage and `--reset` flag.
- Could use a brief inline comment explaining the checkpoint logic in `sync_issues`.

---

## Total: 31/40

---

## Tells Assessment

| Strong signal | Present? |
|---------------|----------|
| Writes resume state in a transaction with the page commits | ❌ No — separate commits |
| Stores state in `issues.db` itself (e.g., `sync_state` table) | ✅ Yes |
| Notes the per-page-vs-per-record tradeoff in writing | ❌ No — silent pick |
| Tracks per-repo cursors (config has 2 repos) | ✅ Yes — `repo TEXT PRIMARY KEY` |
| Adds the resume info to the README | ✅ Yes |
| Uses GitHub's `since` *only* if it explicitly explains it as orthogonal | N/A — didn't use `since` |
| If asks a question, asks the *right* one | N/A — didn't ask |

---

## Qualitative Notes

**What went well:**
- Picked the right granularity (per-page) without over-engineering.
- Put state in the same DB — the "one source of truth" approach.
- Respected the existing codebase style and didn't rewrite working code gratuitously.
- Added a `--reset` flag, which is practical for operators.
- Updated the README with clear usage instructions.

**Where it stumbled:**
- Did not articulate the design tradeoff. A strong response would say "I chose per-page checkpointing because pages already align with DB commits, and per-record would add complexity for marginal gain."
- The progress save isn't transactional with the page commit. This is a subtle bug that could cause confusion (though not data loss, due to upserts).
- Didn't address the nested loop (comments) at all — a crash during a large comment fetch loses that progress.

**Would I merge this PR?**
Yes, with a suggestion to wrap the page commit + progress save in a single transaction. The core design is sound and addresses the user's actual problem.
