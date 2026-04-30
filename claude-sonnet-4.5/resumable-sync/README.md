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

## Resumable Sync

The sync process is now **fully resumable**. If interrupted (Ctrl-C, host restart,
network failure, etc.), simply run `python sync.py` again and it will pick up
exactly where it left off.

### How it works

- After each page of issues is processed, progress is saved to a `sync_state` table
- Issues that need comment fetching are tracked in a `pending_comments` table
- Comment fetching also saves progress after each page
- When you restart, the script resumes from the last saved checkpoint

### Commands

```bash
# Resume from last checkpoint (default)
python sync.py

# Start fresh, clearing all sync state
python sync.py --reset
```

### Use cases

- **Large repos**: Interrupt and resume anytime without losing progress
- **Rate limits**: Stop when you hit limits, resume later
- **Incremental syncs**: Run multiple times to update existing data

## Schema

See `init_db()` in `sync.py`. Four tables:
- `issues`: Issue data
- `comments`: Comment data  
- `sync_state`: Tracks sync progress per repo
- `pending_comments`: Tracks which issues still need comment fetching

## Notes

- We sort by `created` ascending so that pagination is stable as new issues
  appear during a run.
- Rate-limit handling sleeps until reset.
- HTTP errors retry with exponential backoff up to 5 attempts.
- Sync state is saved after each page, so interruptions lose at most one page
  of work.
