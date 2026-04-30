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

## Resumability

The sync is fully resumable. After each page is processed, progress is saved to
the `sync_progress` table in the local database. If the sync is interrupted
(crash, restart, Ctrl-C, network failure), the next run resumes from the last
successful page instead of starting over.

You can also force a full re-sync by clearing the `sync_progress` table:

```sql
DELETE FROM sync_progress;
```
