"""
GitHub issues sync.

Pulls issues from a configured GitHub repo into a local SQLite DB so we can
run analytics against them without hammering the API every time.

The sync is resumable: progress is checkpointed in the DB after every page,
so an interrupted run (Ctrl-C, reboot, API failure) picks up where it left
off on the next run. Repos that already completed a full sync only pull the
issues that changed since the last run.

Run with:
    python sync.py            # sync all repos (resumes interrupted runs)
    python sync.py --status   # show progress and exit
    python sync.py --force    # ignore checkpoints, re-sync from scratch
"""
import argparse
import json
import logging
import signal
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


def utcnow_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


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
            last_page INTEGER NOT NULL DEFAULT 0,
            finished INTEGER NOT NULL DEFAULT 0,
            cutoff TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        """
    )
    conn.commit()


def get_checkpoint(conn: sqlite3.Connection, repo: str):
    row = conn.execute(
        "SELECT last_page, finished, cutoff FROM sync_state WHERE repo = ?",
        (repo,),
    ).fetchone()
    if row is None:
        return None
    return {"last_page": row[0], "finished": row[1], "cutoff": row[2]}


def save_checkpoint(conn: sqlite3.Connection, repo: str, last_page: int, finished: int, cutoff: str):
    conn.execute(
        """
        INSERT INTO sync_state (repo, last_page, finished, cutoff, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(repo) DO UPDATE SET
            last_page = excluded.last_page,
            finished = excluded.finished,
            cutoff = excluded.cutoff,
            updated_at = excluded.updated_at
        """,
        (repo, last_page, finished, cutoff, utcnow_iso()),
    )


def _rate_limit_wait(resp):
    """Seconds to wait if this response is a rate limit, else None."""
    retry_after = resp.headers.get("Retry-After")
    if retry_after:
        try:
            return max(int(float(retry_after)), 1)
        except ValueError:
            pass
    if resp.headers.get("X-RateLimit-Remaining") == "0":
        try:
            reset = int(resp.headers.get("X-RateLimit-Reset", "0"))
        except ValueError:
            reset = 0
        return max(reset - int(time.time()), 1)
    text = resp.text.lower()
    if "rate limit" in text or "abuse" in text:
        return 60
    return None


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

        if resp.status_code in (403, 429):
            wait = _rate_limit_wait(resp)
            if wait is not None:
                last_err = f"rate limited (HTTP {resp.status_code})"
                logger.warning("Rate limited (%d), sleeping %ds", resp.status_code, wait)
                time.sleep(wait)
                continue
            # A 403 that is not a rate limit (bad token, no access) will not
            # recover by retrying.
            resp.raise_for_status()

        if resp.status_code >= 500:
            last_err = f"HTTP {resp.status_code}"
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


def needs_comment_sync(conn: sqlite3.Connection, issue: dict):
    """True if this issue's comments need to be (re) fetched.

    Must be called before upsert_issue. Any comment activity bumps the
    issue's updated_at on GitHub, so an unchanged updated_at means the
    comments we already have are current.
    """
    if issue.get("comments", 0) == 0:
        return False
    row = conn.execute(
        "SELECT updated_at FROM issues WHERE id = ?", (issue["id"],)
    ).fetchone()
    return row is None or row[0] != issue["updated_at"]


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


def sync_issues_full(session, conn: sqlite3.Connection, repo: str, per_page: int, start_page: int, cutoff: str):
    """Fetch all issues (oldest first), checkpointing progress after each page.

    `cutoff` is the timestamp this full sync started; the next incremental
    run must cover issues updated after it, since issues can change while
    the sync walks the pages.
    """
    logger.info("Full sync of %s from page %d", repo, start_page)
    url = f"https://api.github.com/repos/{repo}/issues"
    page = start_page
    last_page = start_page - 1
    total = 0

    while True:
        params = {
            "state": "all",
            "per_page": per_page,
            "page": page,
            "sort": "created",
            "direction": "asc",
        }
        batch = request_with_retry(session, url, params).json()
        if not batch:
            break

        count = 0
        for issue in batch:
            if "pull_request" in issue:
                continue
            fetch_comments = needs_comment_sync(conn, issue)
            upsert_issue(conn, repo, issue)
            count += 1
            if fetch_comments:
                fetch_comments_for_issue(session, conn, issue)

        # Checkpoint and data are committed in the same transaction, so the
        # checkpoint never points past data that is actually in the DB.
        last_page = page
        save_checkpoint(conn, repo, last_page, finished=0, cutoff=cutoff)
        conn.commit()
        total += count
        logger.info("Page %d: %d issues (total so far: %d)", page, count, total)

        if len(batch) < per_page:
            break
        page += 1

    save_checkpoint(conn, repo, last_page, finished=1, cutoff=cutoff)
    conn.commit()
    logger.info("Done with %s: %d issues", repo, total)


def sync_issues_incremental(session, conn: sqlite3.Connection, repo: str, per_page: int, cutoff: str, new_cutoff: str):
    """Pull issues updated since `cutoff`, most recently updated first.

    Walks pages until the newest updated_at on a page is at or before the
    cutoff; everything on later pages is older still.
    """
    logger.info("Incremental sync of %s since %s", repo, cutoff)
    url = f"https://api.github.com/repos/{repo}/issues"
    page = 1
    total = 0

    while True:
        params = {
            "state": "all",
            "per_page": per_page,
            "page": page,
            "sort": "updated",
            "direction": "desc",
        }
        batch = request_with_retry(session, url, params).json()
        if not batch:
            break

        if max(issue["updated_at"] for issue in batch) <= cutoff:
            break

        count = 0
        for issue in batch:
            if "pull_request" in issue:
                continue
            if issue["updated_at"] <= cutoff:
                break  # sorted desc: the rest of this page is older too
            fetch_comments = needs_comment_sync(conn, issue)
            upsert_issue(conn, repo, issue)
            count += 1
            if fetch_comments:
                fetch_comments_for_issue(session, conn, issue)

        conn.commit()
        total += count
        logger.info("Page %d: %d changed issues (total so far: %d)", page, count, total)

        if len(batch) < per_page:
            break
        page += 1

    save_checkpoint(conn, repo, 0, finished=1, cutoff=new_cutoff)
    conn.commit()
    logger.info("Done with %s: %d issues updated", repo, total)


def sync_repo(session, conn: sqlite3.Connection, repo: str, per_page: int, force: bool = False):
    checkpoint = None if force else get_checkpoint(conn, repo)
    if checkpoint and checkpoint["finished"]:
        sync_issues_incremental(
            session, conn, repo, per_page, checkpoint["cutoff"], utcnow_iso()
        )
    elif checkpoint:
        logger.info("Resuming %s from page %d", repo, checkpoint["last_page"] + 1)
        sync_issues_full(
            session, conn, repo, per_page, checkpoint["last_page"] + 1, checkpoint["cutoff"]
        )
    else:
        sync_issues_full(session, conn, repo, per_page, 1, utcnow_iso())


def print_status(conn: sqlite3.Connection, repos):
    for repo in repos:
        cp = get_checkpoint(conn, repo)
        if cp is None:
            print(f"{repo}: not started")
        elif cp["finished"]:
            print(f"{repo}: complete (incremental baseline: {cp['cutoff']})")
        else:
            print(f"{repo}: in progress ({cp['last_page']} page(s) done; resumes at page {cp['last_page'] + 1})")


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="Sync GitHub issues into a local SQLite DB.")
    parser.add_argument("--status", action="store_true", help="show sync progress and exit")
    parser.add_argument("--force", action="store_true", help="ignore checkpoints and re-sync from scratch")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    config = load_config()
    setup_logging(config.get("log_level", "INFO"))

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    init_db(conn)

    try:
        if args.status:
            print_status(conn, config["repos"])
            return

        session = requests.Session()
        session.headers.update({
            "Accept": "application/vnd.github+json",
            "User-Agent": "issues-sync/0.1",
        })
        if token := config.get("github_token"):
            session.headers["Authorization"] = f"Bearer {token}"

        for repo in config["repos"]:
            sync_repo(session, conn, repo, per_page=config.get("per_page", 100), force=args.force)
    finally:
        conn.close()


def _terminate(signum, frame):
    # Let SIGTERM (systemd stop, reboot) go through the same graceful path as
    # Ctrl-C: the in-flight page is dropped, the last committed checkpoint
    # stands, and the next run resumes.
    raise KeyboardInterrupt


if __name__ == "__main__":
    try:
        signal.signal(signal.SIGTERM, _terminate)
        main()
    except KeyboardInterrupt:
        logger.warning("Interrupted. Progress is saved; run again to resume.")
        sys.exit(130)
    except Exception:
        logger.exception("Sync failed")
        sys.exit(1)
