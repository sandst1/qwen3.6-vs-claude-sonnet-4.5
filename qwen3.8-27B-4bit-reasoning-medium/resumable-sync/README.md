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

Progress is tracked per repo in a `sync_state` table, so an interrupted run
(Ctrl-C, host restart, an API outage the retry logic can't ride out) does not
start over. Just re-run the same command:

- A repo whose **full sync was interrupted** resumes from the next page.
- A repo that has **already fully synced** does an **incremental** update,
  pulling only the issues created/updated since the last completed run.

Because the full sync sorts by `created` ascending, new issues append to the
end of the list and earlier pages stay stable, so resuming by page number is
safe. The incremental watermark only advances once a pass completes, so an
interrupted incremental pass simply re-runs from the same point.

To force a full re-sync of every repo (ignore saved progress), run:

```bash
python sync.py --full
```

## Schema

See `init_db()` in `sync.py`. Three tables: `issues`, `comments`, and
`sync_state` (per-repo resume progress).

## Notes

- We sort by `created` ascending so that pagination is stable as new issues
  appear during a run.
- Incremental syncs look back `incremental_overlap_hours` (default 24) past the
  last completed run to stay correct at the boundary; upserts make the overlap
  idempotent.
- Rate-limit handling sleeps until reset.
- HTTP errors retry with exponential backoff up to 5 attempts.
