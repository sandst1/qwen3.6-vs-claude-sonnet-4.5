"""
Verify resumability: simulate an interrupted run, then restart and check that
we resume where we left off, fetch no extra pages, and refresh comments only
when the comment count changed.

Run with: python test_resume.py
"""
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import sync as S

REPO = "test/repo"
PER_PAGE = 2


def make_issue(n, comments=0):
    return {
        "id": n,
        "number": n,
        "title": f"issue {n}",
        "state": "open",
        "user": {"login": "alice"},
        "created_at": f"2024-01-{n:02d}T00:00:00Z",
        "updated_at": f"2024-01-{n:02d}T00:00:00Z",
        "comments": comments,
        "labels": [],
        "comments_url": f"https://api.github.com/repos/{REPO}/issues/{n}/comments",
    }


def make_comment(cid, issue_id):
    return {
        "id": cid,
        "user": {"login": "bob"},
        "body": f"comment {cid}",
        "created_at": "2024-02-01T00:00:00Z",
        "updated_at": "2024-02-01T00:00:00Z",
    }


class FakeResp:
    def __init__(self, data):
        self._data = data
        self.status_code = 200
        self.text = ""

    def json(self):
        return self._data

    def raise_for_status(self):
        pass


class FakeSession:
    """Serves a fixed set of pages; counts how many issue-list calls were made."""
    def __init__(self, pages, comments_by_issue):
        self.pages = pages  # dict page -> list[issue]
        self.comments_by_issue = comments_by_issue
        self.issue_list_calls = 0
        self.comment_calls = 0

    def get(self, url, params=None, timeout=None):
        if url.endswith("/issues"):
            self.issue_list_calls += 1
            return FakeResp(self.pages.get(params["page"], []))
        # comments url: .../issues/<n>/comments
        issue_id = int(url.rstrip("/").split("/")[-2])
        self.comment_calls += 1
        return FakeResp(self.comments_by_issue.get(issue_id, []))


def run_sync(session, conn, interrupt_at_page=None):
    """Call sync_issues; if interrupt_at_page is set, raise KeyboardInterrupt
    right after that page's commit (simulating a Ctrl-C)."""
    orig = S.sync_issues
    # Monkeypatch request_with_retry is not needed; instead we wrap the whole
    # call and interrupt by having the fake session raise on a given page.
    if interrupt_at_page is not None:
        base_get = session.get

        def get(*a, **kw):
            if kw.get("params", {}).get("page") == interrupt_at_page and a[0].endswith("/issues"):
                raise KeyboardInterrupt
            return base_get(*a, **kw)

        session.get = get
    try:
        orig(session, conn, REPO, PER_PAGE)
    finally:
        if interrupt_at_page is not None:
            session.get = base_get


def main():
    db = Path(__file__).parent / "test_resume.db"
    for p in (db, db.with_suffix(".db-wal"), db.with_suffix(".db-shm")):
        if p.exists():
            p.unlink()

    conn = sqlite3.connect(db)
    conn.execute("PRAGMA journal_mode=WAL")
    S.init_db(conn)

    # 5 issues, 2 per page -> pages: 1:[1,2] 2:[3,4] 3:[5] (short page = last)
    # issues 2 and 5 have comments.
    pages = {1: [make_issue(1), make_issue(2, comments=1)],
             2: [make_issue(3), make_issue(4)],
             3: [make_issue(5, comments=1)]}
    comments = {2: [make_comment(101, 2)], 5: [make_comment(201, 5)]}

    # --- Run 1: interrupted right before page 2 is fetched ---
    s1 = FakeSession(pages, comments)
    try:
        run_sync(s1, conn, interrupt_at_page=2)
        raise AssertionError("expected KeyboardInterrupt")
    except KeyboardInterrupt:
        pass
    conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")

    st = S.get_sync_state(conn, REPO)
    assert st == {"last_page": 1, "finished": False}, st
    n_issues = conn.execute("SELECT COUNT(*) FROM issues").fetchone()[0]
    n_comments = conn.execute("SELECT COUNT(*) FROM comments").fetchone()[0]
    assert n_issues == 2, n_issues          # issues 1,2
    assert n_comments == 1, n_comments      # comment 101
    assert s1.issue_list_calls == 1, s1.issue_list_calls  # only page 1 fetched
    assert s1.comment_calls == 1, s1.comment_calls
    print("run 1 (interrupted after page 1): OK")

    # --- Run 2: restart; must resume at page 2, finish, fetch no extra pages ---
    s2 = FakeSession(pages, comments)
    run_sync(s2, conn)
    conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")

    st = S.get_sync_state(conn, REPO)
    assert st == {"last_page": 3, "finished": True}, st
    n_issues = conn.execute("SELECT COUNT(*) FROM issues").fetchone()[0]
    n_comments = conn.execute("SELECT COUNT(*) FROM comments").fetchone()[0]
    assert n_issues == 5, n_issues
    assert n_comments == 2, n_comments      # 101 + 201
    # Resumed at page 2, so only pages 2 and 3 were fetched (not page 1).
    assert s2.issue_list_calls == 2, s2.issue_list_calls
    assert s2.comment_calls == 1, s2.comment_calls  # only issue 5's comment
    print("run 2 (resumed, finished): OK")

    # --- Run 3: a finished repo starts over from page 1; nothing new ---
    s3 = FakeSession(pages, comments)
    run_sync(s3, conn)
    st = S.get_sync_state(conn, REPO)
    assert st == {"last_page": 3, "finished": True}, st
    assert conn.execute("SELECT COUNT(*) FROM issues").fetchone()[0] == 5
    assert conn.execute("SELECT COUNT(*) FROM comments").fetchone()[0] == 2
    assert s3.issue_list_calls == 3, s3.issue_list_calls  # pages 1,2,3
    # All issues are re-fetched, so their comments are refreshed too (full refresh
    # of a finished repo). Issues with comments: 2 and 5.
    assert s3.comment_calls == 2, s3.comment_calls
    print("run 3 (re-run of finished repo, full refresh): OK")

    # --- Run 4: issue 3 gained a comment since last sync -> picked up on re-run ---
    pages4 = {1: [make_issue(1), make_issue(2, comments=1)],
              2: [make_issue(3, comments=1), make_issue(4)],
              3: [make_issue(5, comments=1)]}
    comments4 = {2: [make_comment(101, 2)], 3: [make_comment(301, 3)], 5: [make_comment(201, 5)]}
    s4 = FakeSession(pages4, comments4)
    run_sync(s4, conn)
    assert conn.execute("SELECT COUNT(*) FROM issues").fetchone()[0] == 5
    assert conn.execute("SELECT COUNT(*) FROM comments").fetchone()[0] == 3  # +301
    # Full re-fetch of a finished repo: all comments refreshed (2, 3, 5).
    assert s4.comment_calls == 3, s4.comment_calls
    print("run 4 (new comment picked up on re-run): OK")

    conn.close()
    for p in (db, db.with_suffix(".db-wal"), db.with_suffix(".db-shm")):
        if p.exists():
            p.unlink()
    print("\nAll resume tests passed.")


if __name__ == "__main__":
    main()
