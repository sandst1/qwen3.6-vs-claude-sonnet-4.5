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

See `init_db()` in `sync.py`. Three tables: `issues`, `comments`, and
`sync_state` (per-repo run checkpoint used for resuming).

## Notes

- We sort by `created` ascending so that pagination is stable as new issues
  appear during a run.
- Rate-limit handling sleeps until reset.
- HTTP errors retry with exponential backoff up to 5 attempts.

## Resuming

If a run is interrupted (host restart, Ctrl-C, unrecoverable API error),
just run `python sync.py` again — it picks up where it left off:

- Progress is checkpointed per repo in the `sync_state` table, committed in
  the same transaction as the issues page it covers, so at most one page of
  work is lost.
- On startup, an interrupted run is resumed: finished repos are skipped and
  in-progress repos continue from their last committed page. Upserts are
  idempotent, so a page partially applied before the crash is safe to redo.
- Once a run completes cleanly, the next invocation starts a fresh full sync.
