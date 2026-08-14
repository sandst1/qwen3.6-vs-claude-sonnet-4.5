# issues-sync

Syncs GitHub issues into a local SQLite DB. Used by the analytics team for
their dashboards and notebooks.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python sync.py
```

The script uses unauthenticated GitHub API by default (60 req/hr). For real
runs, drop a token into `config.toml`.

## What it does

1. Reads `config.toml` for the list of repos to sync.
2. For each repo, paginates through `/issues?state=all` (oldest first).
3. For each issue, also fetches its comments.
4. Upserts everything into `issues.db`.

## Resumable

Progress is checkpointed in the DB (`sync_state` table) after every page, in
the same transaction as the page's data. If a run is interrupted (Ctrl-C,
reboot, API failure), just run it again — it picks up at the next un-synced
page instead of starting over. Once a repo has completed a full sync, later
runs are incremental: they only pull issues whose `updated_at` is newer than
the last sync, so steady-state runs are cheap.

- `python sync.py --status` — show where each repo stands, without syncing.
- `python sync.py --force` — ignore checkpoints and re-sync from page 1.

Comments are only (re) fetched for issues whose `updated_at` changed, since
any comment activity bumps the issue's `updated_at`.

## Schema

See `init_db()` in `sync.py`. Two tables: `issues` and `comments`.

## Notes

- We sort by `created` ascending so that pagination is stable as new issues
  appear during a run (and so an interrupted run can safely resume from a
  later page).
- The DB runs in WAL mode for crash safety; an in-flight page is simply
  dropped on interruption and re-fetched on resume.
- Rate-limit handling (403/429, `Retry-After`, `X-RateLimit-Reset`) sleeps
  until reset; other transient HTTP errors retry with exponential backoff up
  to 5 attempts. A 403 that is not a rate limit fails fast.
- Deleted comments are not removed from the DB (upserts only). Delete the DB
  and run `--force` if you ever need a clean slate.
