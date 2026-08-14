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

Runs checkpoint progress in the `sync_progress` table (inside `issues.db`)
after every page. If a run is interrupted — Ctrl-C, host restart, a GitHub
failure that outlives the retries — just run `python sync.py` again and it
picks up where it left off instead of starting from scratch.

- A repo marked `completed` is skipped on subsequent runs.
- `python sync.py --reset` clears the saved progress and starts over from
  the beginning.

## Schema

See `init_db()` in `sync.py`. Two tables: `issues` and `comments`.

## Notes

- We sort by `created` ascending so that pagination is stable as new issues
  appear during a run.
- On resume we filter with `since=<last synced issue id>`, so already-synced
  issues are never re-fetched. The only cost of resuming is walking pages
  that come back empty until we reach new issues.
- Rate-limit handling sleeps until reset.
- HTTP errors retry with exponential backoff up to 5 attempts.
