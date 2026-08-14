"""
GitHub issues sync.

Pulls issues from a configured GitHub repo into a local SQLite DB so we can
run analytics against them without hammering the API every time.

Run with:
    python sync.py
"""
import logging
import sqlite3
import sys
import time
import tomllib
from datetime import datetime, timezone
from pathlib import Path

import requests

CONFIG_PATH = Path(__file__).parent / "config.toml"
DB_PATH = Path(__file__).parent / "issues.db"

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
        CREATE TABLE IF NOT EXISTS sync_state (
            repo TEXT PRIMARY KEY,
            last_page INTEGER NOT NULL,
            finished INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL
        );

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
        """
    )
    conn.commit()


def get_sync_state(conn: sqlite3.Connection, repo: str):
    row = conn.execute(
        "SELECT last_page, finished FROM sync_state WHERE repo = ?", (repo,)
    ).fetchone()
    if row is None:
        return {"last_page": 0, "finished": False}
    return {"last_page": row[0], "finished": bool(row[1])}


def set_sync_state(conn: sqlite3.Connection, repo: str, last_page: int, finished: bool):
    conn.execute(
        """
        INSERT INTO sync_state (repo, last_page, finished, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(repo) DO UPDATE SET
            last_page = excluded.last_page,
            finished = excluded.finished,
            updated_at = excluded.updated_at
        """,
        (repo, last_page, int(finished), datetime.now(timezone.utc).isoformat()),
    )


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

    import json
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


def sync_issues(session: requests.Session, conn: sqlite3.Connection, repo: str, per_page: int):
    """Fetch all issues for a repo and write them to the DB.

    Resumable: a run interrupted mid-way (Ctrl-C, crash, network failure) can be
    restarted and it picks up where it left off. An interrupted repo resumes right
    after the last fully-synced page, so pages already processed are skipped
    entirely (no API calls) and only the not-yet-synced issues are fetched. A
    finished repo starts over from page 1, re-fetching everything so new issues
    and new comments are picked up. All writes are upserts, so nothing is lost.
    """
    logger.info("Syncing issues for %s", repo)
    url = f"https://api.github.com/repos/{repo}/issues"
    state = get_sync_state(conn, repo)
    # last_page is the highest page fully synced (0 = nothing yet). A finished
    # run starts over from page 1 (full re-fetch, so new issues and new comments
    # are picked up); an interrupted run resumes right after the last synced page.
    start_page = 1 if state["finished"] else state["last_page"] + 1
    if not state["finished"] and state["last_page"] > 0:
        logger.info("Resuming %s at page %d (page %d and earlier already synced)", repo, start_page, state["last_page"])

    total_issues = 0
    page = start_page
    while True:
        params = {
            "state": "all",
            "per_page": per_page,
            "page": page,
            "sort": "created",
            "direction": "asc",
        }
        resp = request_with_retry(session, url, params)
        batch = resp.json()
        if not batch:
            set_sync_state(conn, repo, page - 1, True)
            conn.commit()
            break

        new_issues = []
        for issue in batch:
            # upsert_issue returns True only for issues we didn't already have
            # (PRs and re-fetched existing issues return False).
            if upsert_issue(conn, repo, issue):
                new_issues.append(issue)
        issue_count_in_page = len(new_issues)

        # Fetch comments for issues we just added. On a resume these are the
        # genuinely new issues; on a full re-fetch these are all issues, so their
        # comments are refreshed too.
        for issue in new_issues:
            if issue.get("comments", 0) > 0:
                fetch_comments_for_issue(session, conn, issue)

        # Commit the page data and the progress marker in one transaction so they
        # can never disagree: a crash between the two is impossible.
        set_sync_state(conn, repo, page, False)
        conn.commit()
        total_issues += issue_count_in_page
        logger.info("Page %d: %d new issues (total this run: %d)", page, issue_count_in_page, total_issues)

        if len(batch) < per_page:
            set_sync_state(conn, repo, page, True)
            conn.commit()
            break
        page += 1

    logger.info("Done with %s: %d new issues this run", repo, total_issues)


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


def main():
    config = load_config()
    setup_logging(config.get("log_level", "INFO"))

    session = requests.Session()
    session.headers.update({
        "Accept": "application/vnd.github+json",
        "User-Agent": "issues-sync/0.1",
    })
    if token := config.get("github_token"):
        session.headers["Authorization"] = f"Bearer {token}"

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    init_db(conn)

    try:
        for repo in config["repos"]:
            sync_issues(session, conn, repo, per_page=config.get("per_page", 100))
    finally:
        # Move any still-pending WAL data into the main DB file so an interrupted
        # run's committed pages are immediately visible to the next run, even if
        # the -wal/-shm sidecars get deleted.
        try:
            conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        except sqlite3.Error:
            pass
        conn.close()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        # main()'s finally block has already checkpointed the WAL, so everything
        # committed up to this point is safe to resume from.
        logger.warning("Interrupted by user — progress saved, re-run to resume")
        sys.exit(130)
    except Exception:
        logger.exception("Sync failed — progress saved, re-run to resume")
        sys.exit(1)
