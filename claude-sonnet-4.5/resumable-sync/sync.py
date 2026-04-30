"""
GitHub issues sync.

Pulls issues from a configured GitHub repo into a local SQLite DB so we can
run analytics against them without hammering the API every time.

Run with:
    python sync.py         # Resume from last checkpoint
    python sync.py --reset # Start fresh, clearing all sync state
"""
import argparse
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

        CREATE TABLE IF NOT EXISTS sync_state (
            repo TEXT PRIMARY KEY,
            status TEXT NOT NULL CHECK(status IN ('in_progress', 'completed')),
            current_page INTEGER NOT NULL DEFAULT 1,
            issues_synced INTEGER NOT NULL DEFAULT 0,
            started_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS pending_comments (
            issue_id INTEGER PRIMARY KEY,
            repo TEXT NOT NULL,
            comments_url TEXT NOT NULL,
            current_page INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (issue_id) REFERENCES issues(id)
        );

        CREATE INDEX IF NOT EXISTS idx_pending_comments_repo ON pending_comments(repo);
        """
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


def get_sync_state(conn: sqlite3.Connection, repo: str) -> dict:
    """Get the current sync state for a repo, or None if not started."""
    cursor = conn.execute(
        "SELECT status, current_page, issues_synced, started_at, updated_at FROM sync_state WHERE repo = ?",
        (repo,)
    )
    row = cursor.fetchone()
    if row:
        return {
            "status": row[0],
            "current_page": row[1],
            "issues_synced": row[2],
            "started_at": row[3],
            "updated_at": row[4],
        }
    return None


def init_sync_state(conn: sqlite3.Connection, repo: str):
    """Initialize or reset sync state for a repo."""
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """
        INSERT INTO sync_state (repo, status, current_page, issues_synced, started_at, updated_at)
        VALUES (?, 'in_progress', 1, 0, ?, ?)
        ON CONFLICT(repo) DO UPDATE SET
            status = 'in_progress',
            current_page = 1,
            issues_synced = 0,
            started_at = ?,
            updated_at = ?
        """,
        (repo, now, now, now, now)
    )
    # Clear any pending comments for this repo
    conn.execute("DELETE FROM pending_comments WHERE repo = ?", (repo,))
    conn.commit()


def update_sync_state(conn: sqlite3.Connection, repo: str, page: int, issues_synced: int):
    """Update sync state after processing a page."""
    conn.execute(
        """
        UPDATE sync_state
        SET current_page = ?, issues_synced = ?, updated_at = ?
        WHERE repo = ?
        """,
        (page, issues_synced, datetime.now(timezone.utc).isoformat(), repo)
    )
    conn.commit()


def mark_sync_completed(conn: sqlite3.Connection, repo: str):
    """Mark a repo's sync as completed."""
    conn.execute(
        """
        UPDATE sync_state
        SET status = 'completed', updated_at = ?
        WHERE repo = ?
        """,
        (datetime.now(timezone.utc).isoformat(), repo)
    )
    conn.commit()


def add_pending_comment_fetch(conn: sqlite3.Connection, repo: str, issue_id: int, comments_url: str):
    """Mark an issue as needing comment fetching."""
    conn.execute(
        """
        INSERT INTO pending_comments (issue_id, repo, comments_url, current_page)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(issue_id) DO NOTHING
        """,
        (issue_id, repo, comments_url)
    )


def get_pending_comments(conn: sqlite3.Connection, repo: str) -> list:
    """Get all issues that still need comment fetching for a repo."""
    cursor = conn.execute(
        "SELECT issue_id, comments_url, current_page FROM pending_comments WHERE repo = ?",
        (repo,)
    )
    return [{"issue_id": r[0], "comments_url": r[1], "current_page": r[2]} for r in cursor.fetchall()]


def update_pending_comment_page(conn: sqlite3.Connection, issue_id: int, page: int):
    """Update the current page for a pending comment fetch."""
    conn.execute(
        "UPDATE pending_comments SET current_page = ? WHERE issue_id = ?",
        (page, issue_id)
    )


def remove_pending_comment(conn: sqlite3.Connection, issue_id: int):
    """Remove an issue from pending comments (all comments fetched)."""
    conn.execute("DELETE FROM pending_comments WHERE issue_id = ?", (issue_id,))


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
    """Fetch all issues for a repo and write them to the DB. Resumes from last checkpoint if interrupted."""
    state = get_sync_state(conn, repo)
    
    if state and state["status"] == "completed":
        logger.info("Repo %s already completed, skipping issue sync", repo)
        # Still process any pending comments from previous runs
        process_pending_comments(session, conn, repo)
        return
    
    if state and state["status"] == "in_progress":
        page = state["current_page"]
        total_issues = state["issues_synced"]
        logger.info("Resuming %s from page %d (%d issues already synced)", repo, page, total_issues)
        # Process any pending comments from before the interruption
        process_pending_comments(session, conn, repo)
    else:
        page = 1
        total_issues = 0
        init_sync_state(conn, repo)
        logger.info("Starting fresh sync for %s", repo)

    url = f"https://api.github.com/repos/{repo}/issues"

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
            break

        issue_count_in_page = 0
        for issue in batch:
            if upsert_issue(conn, repo, issue):
                issue_count_in_page += 1

                # Mark issues with comments as pending instead of fetching immediately
                # This allows us to resume comment fetching if interrupted
                if issue.get("comments", 0) > 0:
                    add_pending_comment_fetch(conn, repo, issue["id"], issue["comments_url"])

        total_issues += issue_count_in_page
        
        # Save checkpoint after each page
        update_sync_state(conn, repo, page + 1, total_issues)
        
        logger.info("Page %d: %d issues (total so far: %d)", page, issue_count_in_page, total_issues)

        if len(batch) < per_page:
            break
        page += 1

    # Mark issues sync as complete
    mark_sync_completed(conn, repo)
    logger.info("Issue sync done for %s: %d issues total", repo, total_issues)
    
    # Now fetch all pending comments
    process_pending_comments(session, conn, repo)


def fetch_comments_for_issue(session: requests.Session, conn: sqlite3.Connection, issue_id: int, comments_url: str, start_page: int = 1):
    """Fetch all comments for a single issue, starting from a specific page."""
    page = start_page
    while True:
        resp = request_with_retry(session, comments_url, {"per_page": 100, "page": page})
        batch = resp.json()
        if not batch:
            break
        for comment in batch:
            upsert_comment(conn, issue_id, comment)
        
        # Save progress after each page
        update_pending_comment_page(conn, issue_id, page + 1)
        conn.commit()
        
        if len(batch) < 100:
            break
        page += 1
    
    # All comments fetched, remove from pending
    remove_pending_comment(conn, issue_id)
    conn.commit()


def process_pending_comments(session: requests.Session, conn: sqlite3.Connection, repo: str):
    """Process all pending comment fetches for a repo."""
    pending = get_pending_comments(conn, repo)
    if not pending:
        return
    
    logger.info("Fetching comments for %d issues in %s", len(pending), repo)
    for item in pending:
        fetch_comments_for_issue(session, conn, item["issue_id"], item["comments_url"], item["current_page"])
    
    logger.info("Completed fetching comments for %s", repo)


def reset_sync_state(conn: sqlite3.Connection):
    """Clear all sync state to force a fresh start."""
    logger.info("Resetting sync state...")
    conn.execute("DELETE FROM sync_state")
    conn.execute("DELETE FROM pending_comments")
    conn.commit()
    logger.info("Sync state cleared. Will start fresh.")


def main():
    parser = argparse.ArgumentParser(description="Sync GitHub issues to local database")
    parser.add_argument("--reset", action="store_true", help="Clear sync state and start fresh")
    args = parser.parse_args()
    
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
    init_db(conn)

    if args.reset:
        reset_sync_state(conn)

    try:
        for repo in config["repos"]:
            sync_issues(session, conn, repo, per_page=config.get("per_page", 100))
        logger.info("All repos synced successfully!")
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
