"""
GitHub issues sync.

Pulls issues from a configured GitHub repo into a local SQLite DB so we can
run analytics against them without hammering the API every time.

The sync is resumable. Progress is tracked per repo in a `sync_state` table,
so if a run is interrupted (Ctrl-C, host restart, an API outage the retry
logic can't ride out) the next invocation picks up where it left off instead
of starting over:

  * A repo whose full sync was interrupted resumes from the next page.
  * A repo that has already fully synced does an incremental update, pulling
    only the issues created/updated since the last completed run.

Run with:
    python sync.py             # resume interrupted repos / incremental for done ones
    python sync.py --full      # force a full re-sync of every repo
"""
import argparse
import json
import logging
import sqlite3
import sys
import time
import tomllib
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

CONFIG_PATH = Path(__file__).parent / "config.toml"
DB_PATH = Path(__file__).parent / "issues.db"

# Default lookback window (in hours) for incremental syncs. See incremental_sync.
DEFAULT_OVERLAP_HOURS = 24

logger = logging.getLogger("sync")


def load_config():
    with open(CONFIG_PATH, "rb") as f:
        return tomllib.load(f)


def setup_logging(level: str):
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )


def init_db(conn: sqlite3.Connection):
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS issues (
            id INTEGER PRIMARY KEY,
            number INTEGER NOT NULL,
            repo TEXT NOT NULL,
            title TEXT NOT NULL,
            state TEXT NOT NULL,
            user_login TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            closed_at TEXT,
            body TEXT,
            comments_count INTEGER NOT NULL DEFAULT 0,
            labels_json TEXT NOT NULL DEFAULT '[]',
            synced_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_issues_repo ON issues(repo);
        CREATE INDEX IF NOT EXISTS idx_issues_updated_at ON issues(updated_at);

        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY,
            issue_id INTEGER NOT NULL,
            user_login TEXT,
            body TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (issue_id) REFERENCES issues(id)
        );

        CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);

        -- Per-repo sync progress, used to make the sync resumable.
        --   status:      'in_progress' (a full sync is underway) or 'done'
        --   last_page:   last fully-synced page of the current full sync
        --   last_run_at: when the repo was last fully synced (incremental watermark)
        CREATE TABLE IF NOT EXISTS sync_state (
            repo TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            last_page INTEGER NOT NULL DEFAULT 0,
            last_run_at TEXT,
            updated_at TEXT NOT NULL
        );
        """
    )
    conn.commit()


def get_sync_state(conn: sqlite3.Connection, repo: str):
    """Return the saved progress for a repo, or None if it has never been synced."""
    row = conn.execute(
        "SELECT status, last_page, last_run_at FROM sync_state WHERE repo = ?",
        (repo,),
    ).fetchone()
    if row is None:
        return None
    return {"status": row[0], "last_page": row[1], "last_run_at": row[2]}


def set_sync_state(conn: sqlite3.Connection, repo: str, status: str, last_page: int, last_run_at):
    """Persist progress for a repo and commit (also commits any pending upserts)."""
    conn.execute(
        """
        INSERT INTO sync_state (repo, status, last_page, last_run_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(repo) DO UPDATE SET
            status = excluded.status,
            last_page = excluded.last_page,
            last_run_at = excluded.last_run_at,
            updated_at = excluded.updated_at
        """,
        (repo, status, last_page, last_run_at, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()


def request_with_retry(session: requests.Session, url: str, params: dict, max_retries: int = 5):
    """GET with exponential backoff on transient failures and rate limits."""
    backoff = 1.0
    last_err = None
    for attempt in range(max_retries):
        try:
            resp = session.get(url, params=params, timeout=30)
        except requests.RequestException as e:
            last_err = e
            logger.warning("Request failed (%s), retrying in %.1fs", e, backoff)
            time.sleep(backoff)
            backoff *= 2
            continue

        # Handle GitHub's secondary rate limiting
        if resp.status_code == 403 and "rate limit" in resp.text.lower():
            reset = int(resp.headers.get("X-RateLimit-Reset", "0"))
            wait = max(reset - int(time.time()), 1)
            logger.warning("Rate limited, sleeping %ds", wait)
            time.sleep(wait)
            continue

        if resp.status_code >= 500:
            logger.warning("Server error %d, retrying in %.1fs", resp.status_code, backoff)
            time.sleep(backoff)
            backoff *= 2
            continue

        resp.raise_for_status()
        return resp

    raise RuntimeError(f"Exhausted retries for {url}: {last_err}")


def upsert_issue(conn: sqlite3.Connection, repo: str, issue: dict):
    # GitHub's issues endpoint also returns PRs; skip those.
    if "pull_request" in issue:
        return False

    conn.execute(
        """
        INSERT INTO issues (
            id, number, repo, title, state, user_login,
            created_at, updated_at, closed_at, body, comments_count,
            labels_json, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            state = excluded.state,
            updated_at = excluded.updated_at,
            closed_at = excluded.closed_at,
            body = excluded.body,
            comments_count = excluded.comments_count,
            labels_json = excluded.labels_json,
            synced_at = excluded.synced_at
        """,
        (
            issue["id"],
            issue["number"],
            repo,
            issue["title"],
            issue["state"],
            (issue.get("user") or {}).get("login"),
            issue["created_at"],
            issue["updated_at"],
            issue.get("closed_at"),
            issue.get("body"),
            issue.get("comments", 0),
            json.dumps([l["name"] for l in issue.get("labels", [])]),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    return True


def upsert_comment(conn: sqlite3.Connection, issue_id: int, comment: dict):
    conn.execute(
        """
        INSERT INTO comments (id, issue_id, user_login, body, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            body = excluded.body,
            updated_at = excluded.updated_at
        """,
        (
            comment["id"],
            issue_id,
            (comment.get("user") or {}).get("login"),
            comment.get("body"),
            comment["created_at"],
            comment["updated_at"],
        ),
    )


def fetch_comments_for_issue(session: requests.Session, conn: sqlite3.Connection, issue: dict):
    """Fetch all comments for a single issue."""
    url = issue["comments_url"]
    page = 1
    while True:
        resp = request_with_retry(session, url, {"per_page": 100, "page": page})
        batch = resp.json()
        if not batch:
            break
        for comment in batch:
            upsert_comment(conn, issue["id"], comment)
        if len(batch) < 100:
            break
        page += 1


def fetch_issue_page(session: requests.Session, repo: str, page: int, per_page: int, since=None):
    """Fetch one page of a repo's issues (oldest first). `since` filters by updated_at."""
    url = f"https://api.github.com/repos/{repo}/issues"
    params = {
        "state": "all",
        "per_page": per_page,
        "page": page,
        "sort": "created",
        "direction": "asc",
    }
    if since:
        params["since"] = since
    resp = request_with_retry(session, url, params)
    return resp.json()


def sync_page(session: requests.Session, conn: sqlite3.Connection, repo: str, batch: list) -> int:
    """Upsert the issues in a page (and their comments). Returns the issue count (PRs excluded)."""
    count = 0
    for issue in batch:
        if upsert_issue(conn, repo, issue):
            count += 1
            if issue.get("comments", 0) > 0:
                fetch_comments_for_issue(session, conn, issue)
    return count


def full_sync(session: requests.Session, conn: sqlite3.Connection, repo: str, per_page: int, start_page: int):
    """
    Fetch a repo's issues page by page, resuming from `start_page`.

    Progress is persisted after every page, so an interruption leaves `last_page`
    pointing at the last fully-synced page. Sorting by `created` ascending keeps
    pagination stable: new issues get the newest timestamps and append to the end,
    so earlier pages don't shift out from under us.
    """
    logger.info("Full sync for %s (starting at page %d)", repo, start_page)
    page = start_page
    last_page = start_page - 1
    total = 0

    while True:
        batch = fetch_issue_page(session, repo, page, per_page)
        if not batch:
            break

        page_count = sync_page(session, conn, repo, batch)
        total += page_count
        last_page = page
        # Persists the page's upserts and advances the resume cursor atomically.
        set_sync_state(conn, repo, "in_progress", last_page, None)
        logger.info("Page %d: %d issues (total so far: %d)", page, page_count, total)

        if len(batch) < per_page:
            break
        page += 1

    set_sync_state(conn, repo, "done", last_page, datetime.now(timezone.utc).isoformat())
    logger.info("Done with %s: %d issues total", repo, total)


def incremental_sync(
    session: requests.Session,
    conn: sqlite3.Connection,
    repo: str,
    per_page: int,
    last_run_at: str,
    overlap: timedelta,
):
    """
    Pull only the issues created/updated since the repo was last fully synced.

    GitHub's `since` filters by updated_at, so this catches both new issues and
    edits. We look back an extra `overlap` window past `last_run_at`: this absorbs
    clock skew and the rare case where an update shifts an issue across a page
    boundary mid-run (upserts make the re-fetch idempotent). The watermark
    (`last_run_at`) only advances when the whole incremental pass completes, so an
    interrupted pass simply re-runs from the same watermark on the next invocation.
    """
    since = (parse_github_timestamp(last_run_at) - overlap).strftime("%Y-%m-%dT%H:%M:%SZ")
    logger.info("Incremental sync for %s (since %s)", repo, since)
    page = 1
    total = 0

    while True:
        batch = fetch_issue_page(session, repo, page, per_page, since=since)
        if not batch:
            break

        page_count = sync_page(session, conn, repo, batch)
        total += page_count
        logger.info("Page %d: %d issues (total so far: %d)", page, page_count, total)

        if len(batch) < per_page:
            break
        page += 1

    # Advance the watermark now that the pass is complete.
    set_sync_state(conn, repo, "done", 0, datetime.now(timezone.utc).isoformat())
    logger.info("Incremental done with %s: %d issues updated", repo, total)


def parse_github_timestamp(ts: str) -> datetime:
    if ts.endswith("Z"):
        ts = ts[:-1] + "+00:00"
    return datetime.fromisoformat(ts)


def sync_repo(session: requests.Session, conn: sqlite3.Connection, repo: str, per_page: int, full: bool, overlap: timedelta):
    """Decide how to sync a single repo based on its saved progress."""
    state = get_sync_state(conn, repo)

    if full or state is None:
        full_sync(session, conn, repo, per_page, start_page=1)
    elif state["status"] == "in_progress":
        full_sync(session, conn, repo, per_page, start_page=state["last_page"] + 1)
    elif state["status"] == "done" and state["last_run_at"]:
        incremental_sync(session, conn, repo, per_page, state["last_run_at"], overlap)
    else:
        # 'done' but missing a watermark (shouldn't happen) — fall back to a full sync.
        logger.warning("%s marked done without a watermark; doing a full sync", repo)
        full_sync(session, conn, repo, per_page, start_page=1)


def parse_args(argv):
    parser = argparse.ArgumentParser(
        description="Sync GitHub issues into a local SQLite DB (resumable)."
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Force a full re-sync of every repo, ignoring saved progress.",
    )
    return parser.parse_args(argv)


def main():
    args = parse_args(sys.argv[1:])
    config = load_config()
    setup_logging(config.get("log_level", "INFO"))

    session = requests.Session()
    session.headers.update({
        "Accept": "application/vnd.github+json",
        "User-Agent": "issues-sync/0.1",
    })
    if token := config.get("github_token"):
        session.headers["Authorization"] = f"Bearer {token}"

    overlap = timedelta(hours=config.get("incremental_overlap_hours", DEFAULT_OVERLAP_HOURS))

    conn = sqlite3.connect(DB_PATH)
    init_db(conn)

    try:
        for repo in config["repos"]:
            sync_repo(session, conn, repo, per_page=config.get("per_page", 100), full=args.full, overlap=overlap)
    finally:
        conn.close()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.warning("Interrupted by user")
        sys.exit(130)
    except Exception:
        logger.exception("Sync failed")
        sys.exit(1)
