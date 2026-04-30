# Review: qwen3.6-27B-4bit — Resumable Sync

## Summary

The implementation adds resumability via a `sync_progress` table in the existing SQLite database, tracking per-repo progress with page number, last issue ID, and status. It checkpoints after every individual issue rather than per-page, which is over-engineered for this use case. The README was not updated.

**Total Score: 26/40**

---

## Architectural judgment — 8/12

### Picks the right granularity — 2/4

The implementation chose **per-issue checkpointing**, not per-page:

```python
# Checkpoint after each issue so we can resume mid-page
last_issue_id = issue["id"]
save_progress(conn, repo, page, last_issue_id, "in_progress")
conn.commit()
```

Per-page is the natural fit here—pages are already the unit of API fetches and DB commits in the original code, and upserts are idempotent so re-processing a partial page is safe. Per-issue checkpointing adds unnecessary overhead (a commit after every single issue) for marginal gain. On a repo with 5,000 issues, this means 5,000 commits instead of ~50.

### Centralizes the checkpoint logic — 4/4

State lives in one clear place: a `sync_progress` table with dedicated accessor functions:
- `get_progress(conn, repo)` — reads checkpoint
- `save_progress(conn, repo, ...)` — writes checkpoint  
- `clear_progress(conn)` — resets on successful completion

Clean separation.

### Handles the comments-per-issue subloop — 2/4

The inner comment-fetching loop has **no checkpointing**. If the sync crashes mid-comment-fetch for a large issue, all comment progress for that issue is lost and must be refetched.

The implementation doesn't explicitly argue why this is acceptable (comments are idempotently upserted, comment pages are smaller, etc.). A strong answer would either checkpoint both loops or document the tradeoff.

---

## Ambiguity-handling — 5/10

### Names the ambiguity — 0/4

The model **silently picked per-issue granularity** without surfacing the per-page vs per-record tradeoff. No explanation in code comments, commit message, or README about why this granularity was chosen. This is the clearest weak signal in the implementation.

### Doesn't conflate concerns — 3/3

Stays focused on crash recovery. Doesn't scope-creep into:
- Incremental sync via GitHub's `since` parameter
- CLI flags for reset/force
- Other features not requested

### Reasonable defaults — 2/3

Good:
- State stored in the same SQLite database (single source of truth)
- Per-repo tracking (handles multiple repos in config)
- Clears checkpoints after successful full sync (allows fresh syncs to pick up updates)

Questionable:
- Checkpoint frequency (every issue) is high overhead
- The "clear on success" behavior means re-running after success re-syncs everything—this is defensible but surprising to users not reading the code

---

## Existing-code respect — 8/8

### Reuses the SQLite connection / DB — 3/3

The `sync_progress` table lives in `issues.db`. State is transactional with data writes. Exactly right.

### Matches the existing style — 2/2

- Same logging idioms (`logger.info`, `logger.warning`)
- Same import organization
- Same naming conventions (snake_case functions)
- Inline `import json` preserved in `upsert_issue()` (matching original quirk)

### Doesn't break what works — 3/3

- Retry logic preserved unchanged
- Rate-limit handling preserved
- Schema migration pattern (`IF NOT EXISTS`) used for new table
- Original upsert logic untouched

---

## Debugging / failure-mode reasoning — 3/6

### Considers the partial-page crash case — 2/3

The implementation correctly writes checkpoint and data in the same `conn.commit()`:

```python
if upsert_issue(conn, repo, issue):
    # ...fetch comments...
    save_progress(conn, repo, page, last_issue_id, "in_progress")
    conn.commit()
```

If crash occurs before commit, both data and checkpoint roll back—the issue will be retried. This is correct behavior, though the model didn't explicitly discuss this atomicity choice.

### Considers schema drift — 1/3

Uses `IF NOT EXISTS` for the new table—good. But no version field in the state schema. If a future version needs to track additional progress (e.g., comment page within an issue), existing state would be incompatible with no migration path.

---

## Code quality — 2/4

- Function names are clear (`get_progress`, `save_progress`, `clear_progress`)
- Brief code comments explain key decisions (lines 261, 323-325)
- **README was not updated**—no documentation of the resume capability

The rubric explicitly calls out "Adds at least minimal documentation of the resume mechanism" as part of this score. Missing.

---

## Tells Assessment

| Signal | Present? |
|--------|----------|
| Resume state in transaction with data commits | ✓ Yes |
| State in `issues.db` (not separate file) | ✓ Yes |
| Notes per-page vs per-record tradeoff | ✗ No |
| Per-repo cursors (config has 2 repos) | ✓ Yes |
| Adds resume info to README | ✗ No |
| Uses `since` only if explains orthogonality | N/A (didn't use) |

---

## Qualitative Notes

**What worked well:**
- Solid mechanical implementation of checkpointing
- Correctly chose SQLite over JSON file
- Preserved all existing behavior (retry, rate-limit, upserts)
- Per-repo tracking handles multi-repo configs correctly

**Where it stumbled:**
- Over-engineered granularity (per-issue instead of per-page) without justification
- Zero explicit reasoning about design tradeoffs
- README unchanged despite behavioral change
- Comment loop not addressed (neither checkpointed nor explained)

**Would I merge this PR?**

With revisions. The implementation works and solves the stated problem, but:
1. The per-issue checkpointing should probably be per-page (simpler, lower overhead)
2. README needs to document the resume behavior
3. A brief comment explaining why per-page granularity is sufficient (or why per-issue was chosen) would help future maintainers

The PR doesn't break anything and is safe to merge, but it's not the clean, well-reasoned solution a senior engineer would ship.
