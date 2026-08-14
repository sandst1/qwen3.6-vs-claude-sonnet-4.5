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

## Schema

See `init_db()` in `sync.py`. Two tables: `issues` and `comments`.

## Notes

- We sort by `created` ascending so that pagination is stable as new issues
  appear during a run.
- Rate-limit handling sleeps until reset.
- HTTP errors retry with exponential backoff up to 5 attempts.

## Resumability

The sync is resumable: if a run is interrupted (Ctrl-C, host restart, a network
failure that exhausts retries), just run it again and it picks up where it left
off.

- Progress is tracked in a `sync_state` table (one row per repo: the last fully
  synced page, and whether the repo was fully synced). The marker is committed in
  the same transaction as the page's data, so the two can never disagree.
- An interrupted repo resumes right after the last synced page: pages already
  synced are skipped without any API calls, and only the not-yet-synced issues
  are fetched (with their comments).
- A finished repo starts over from page 1 on the next run. Because every issue
  is re-fetched, new issues *and* new comments (e.g. someone commented after the
  last sync) are picked up. Issue and comment rows are upserts, so nothing is
  ever lost.
