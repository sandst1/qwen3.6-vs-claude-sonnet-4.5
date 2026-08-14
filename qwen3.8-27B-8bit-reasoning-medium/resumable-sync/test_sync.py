"""Tests for resumable sync behavior, using a fake GitHub API."""
import contextlib
import io
import sqlite3
import tempfile
import time
import unittest
from pathlib import Path

import requests

import sync


def make_issue(number, created, updated, comments=0, **kw):
    d = {
        "id": number,
        "number": number,
        "title": f"issue {number}",
        "state": "open",
        "user": {"login": "alice"},
        "created_at": created,
        "updated_at": updated,
        "closed_at": None,
        "body": None,
        "comments": comments,
        "labels": [],
        "comments_url": f"https://api.github.com/repos/acme/widget/issues/{number}/comments",
    }
    d.update(kw)
    return d


def make_comment(cid, issue_number):
    return {
        "id": cid,
        "user": {"login": "bob"},
        "body": f"comment {cid}",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    }


class FakeHTTPResp:
    def __init__(self, status=200, payload=None, headers=None, text=""):
        self.status_code = status
        self._payload = payload
        self.headers = headers or {}
        self.text = text

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"{self.status_code} for url")


class FakeGitHub:
    """Serves issues/comments with real sorting and pagination."""

    def __init__(self, issues, comments, interrupt_after=None):
        self.issues = issues
        self.comments = comments  # issue number -> list of comment dicts
        self.interrupt_after = interrupt_after
        self.calls = []

    def request_with_retry(self, session, url, params, max_retries=5):
        self.calls.append((url, params))
        if self.interrupt_after is not None and len(self.calls) >= self.interrupt_after:
            raise KeyboardInterrupt("simulated interruption")

        if url.endswith("/comments"):
            number = int(url.rsplit("/", 2)[-2])
            batch = self.comments.get(number, [])
            per_page = params.get("per_page", 100)
            start = (params["page"] - 1) * per_page
            return FakeHTTPResp(200, batch[start:start + per_page])

        if params.get("sort") == "created":
            ordered = sorted(self.issues, key=lambda i: i["created_at"])
        else:
            ordered = sorted(self.issues, key=lambda i: i["updated_at"], reverse=True)
        per_page = params["per_page"]
        start = (params["page"] - 1) * per_page
        return FakeHTTPResp(200, ordered[start:start + per_page])

    def list_pages(self):
        return [p["page"] for u, p in self.calls if not u.endswith("/comments")]

    def comment_numbers(self):
        return [int(u.rsplit("/", 2)[-2]) for u, p in self.calls if u.endswith("/comments")]


class FakeClock:
    def __init__(self, t):
        self.t = t

    def utcnow_iso(self):
        return self.t


class SyncTestCase(unittest.TestCase):
    REPO = "acme/widget"
    PER_PAGE = 2

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.db_path = Path(self._tmp.name) / "test.db"
        self.conn = sqlite3.connect(self.db_path)
        sync.init_db(self.conn)
        self._patchers = []

    def tearDown(self):
        for target, attr, orig in reversed(self._patchers):
            setattr(target, attr, orig)
        self._patchers = []
        self.conn.close()
        self._tmp.cleanup()

    def patch(self, target, attr, value):
        orig = getattr(target, attr)
        setattr(target, attr, value)
        self._patchers.append((target, attr, orig))

    def make_issues(self):
        return [
            make_issue(1, "2024-01-01T00:00:00Z", "2024-01-01T05:00:00Z", comments=2),
            make_issue(2, "2024-01-02T00:00:00Z", "2024-01-02T05:00:00Z"),
            make_issue(3, "2024-01-03T00:00:00Z", "2024-01-03T05:00:00Z", comments=1),
            make_issue(4, "2024-01-04T00:00:00Z", "2024-01-04T05:00:00Z"),
            make_issue(5, "2024-01-05T00:00:00Z", "2024-01-05T01:00:00Z", comments=1),
        ]

    def make_comments(self):
        return {
            1: [make_comment(101, 1), make_comment(102, 1)],
            3: [make_comment(103, 3)],
            5: [make_comment(105, 5)],
        }

    def run_sync(self, fake, force=False):
        self.patch(sync, "request_with_retry", fake.request_with_retry)
        sync.sync_repo(None, self.conn, self.REPO, per_page=self.PER_PAGE, force=force)

    def checkpoint(self):
        return sync.get_checkpoint(self.conn, self.REPO)

    def issue_count(self):
        return self.conn.execute("SELECT COUNT(*) FROM issues").fetchone()[0]

    def comment_count(self):
        return self.conn.execute("SELECT COUNT(*) FROM comments").fetchone()[0]

    def test_full_sync(self):
        fake = FakeGitHub(self.make_issues(), self.make_comments())
        self.patch(sync, "utcnow_iso", FakeClock("2024-01-05T02:00:00Z").utcnow_iso)
        self.run_sync(fake)

        self.assertEqual(self.issue_count(), 5)
        self.assertEqual(self.comment_count(), 4)
        self.assertEqual(fake.list_pages(), [1, 2, 3])
        self.assertEqual(sorted(fake.comment_numbers()), [1, 3, 5])
        cp = self.checkpoint()
        self.assertEqual(cp["finished"], 1)
        self.assertEqual(cp["cutoff"], "2024-01-05T02:00:00Z")

    def test_interruption_then_resume(self):
        issues, comments = self.make_issues(), self.make_comments()
        self.patch(sync, "utcnow_iso", FakeClock("2024-01-05T02:00:00Z").utcnow_iso)

        # Calls: page1, comments#1, page2, comments#3, page3, comments#5.
        # Interrupt on the 3rd call: page 2 is never processed.
        fake = FakeGitHub(issues, comments, interrupt_after=3)
        with self.assertRaises(KeyboardInterrupt):
            self.run_sync(fake)

        cp = self.checkpoint()
        self.assertEqual(cp["finished"], 0)
        self.assertEqual(cp["last_page"], 1)
        self.assertEqual(self.issue_count(), 2)
        self.assertEqual(self.comment_count(), 2)

        # Resume: must start at page 2, not page 1.
        fake2 = FakeGitHub(issues, comments)
        self.run_sync(fake2)
        self.assertEqual(fake2.list_pages(), [2, 3])
        self.assertEqual(fake2.comment_numbers(), [3, 5])
        self.assertEqual(self.issue_count(), 5)
        self.assertEqual(self.comment_count(), 4)
        cp = self.checkpoint()
        self.assertEqual(cp["finished"], 1)
        self.assertEqual(cp["cutoff"], "2024-01-05T02:00:00Z")

    def test_incremental_only_pulls_changes(self):
        issues, comments = self.make_issues(), self.make_comments()
        self.patch(sync, "utcnow_iso", FakeClock("2024-01-05T02:00:00Z").utcnow_iso)
        self.run_sync(FakeGitHub(issues, comments))

        # Issue 2 changes after the full sync finished.
        issues[1] = make_issue(2, "2024-01-02T00:00:00Z", "2024-01-05T23:00:00Z", comments=1)
        comments[2] = [make_comment(104, 2)]

        self.patch(sync, "utcnow_iso", FakeClock("2024-01-06T00:00:00Z").utcnow_iso)
        fake = FakeGitHub(issues, comments)
        self.run_sync(fake)

        row = self.conn.execute(
            "SELECT updated_at FROM issues WHERE number = 2"
        ).fetchone()
        self.assertEqual(row[0], "2024-01-05T23:00:00Z")
        self.assertEqual(self.comment_count(), 5)
        # Only the changed issue's comments were fetched.
        self.assertEqual(fake.comment_numbers(), [2])
        cp = self.checkpoint()
        self.assertEqual(cp["finished"], 1)
        self.assertEqual(cp["cutoff"], "2024-01-06T00:00:00Z")

    def test_incremental_no_changes_is_one_page(self):
        issues, comments = self.make_issues(), self.make_comments()
        self.patch(sync, "utcnow_iso", FakeClock("2024-01-05T02:00:00Z").utcnow_iso)
        self.run_sync(FakeGitHub(issues, comments))

        self.patch(sync, "utcnow_iso", FakeClock("2024-01-06T00:00:00Z").utcnow_iso)
        fake = FakeGitHub(issues, comments)
        self.run_sync(fake)
        self.assertEqual(fake.list_pages(), [1])
        self.assertEqual(fake.comment_numbers(), [])

    def test_force_resyncs_from_scratch(self):
        issues, comments = self.make_issues(), self.make_comments()
        self.patch(sync, "utcnow_iso", FakeClock("2024-01-05T02:00:00Z").utcnow_iso)
        self.run_sync(FakeGitHub(issues, comments))

        self.patch(sync, "utcnow_iso", FakeClock("2024-01-06T00:00:00Z").utcnow_iso)
        fake = FakeGitHub(issues, comments)
        self.run_sync(fake, force=True)
        self.assertEqual(fake.list_pages(), [1, 2, 3])
        # Issues unchanged, so comments are not re-fetched.
        self.assertEqual(fake.comment_numbers(), [])
        self.assertEqual(self.issue_count(), 5)
        self.assertEqual(self.comment_count(), 4)
        cp = self.checkpoint()
        self.assertEqual(cp["finished"], 1)
        self.assertEqual(cp["last_page"], 3)

    def test_status_output(self):
        issues, comments = self.make_issues(), self.make_comments()
        self.patch(sync, "utcnow_iso", FakeClock("2024-01-05T02:00:00Z").utcnow_iso)
        fake = FakeGitHub(issues, comments, interrupt_after=3)
        with self.assertRaises(KeyboardInterrupt):
            self.run_sync(fake)

        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            sync.print_status(self.conn, [self.REPO])
        self.assertIn("in progress", buf.getvalue())
        self.assertIn("resumes at page 2", buf.getvalue())

        fake2 = FakeGitHub(issues, comments)
        self.run_sync(fake2)
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            sync.print_status(self.conn, [self.REPO, "other/repo"])
        out = buf.getvalue()
        self.assertIn("complete", out)
        self.assertIn("other/repo: not started", out)

    def test_main_end_to_end(self):
        tmp = Path(self._tmp.name)
        config_path = tmp / "config.toml"
        config_path.write_text(
            f'repos = ["{self.REPO}"]\nper_page = {self.PER_PAGE}\nlog_level = "WARNING"\n'
        )
        db_path = tmp / "e2e.db"
        self.patch(sync, "CONFIG_PATH", config_path)
        self.patch(sync, "DB_PATH", db_path)
        self.patch(sync, "utcnow_iso", FakeClock("2024-01-05T02:00:00Z").utcnow_iso)
        self.patch(sync, "request_with_retry",
                   FakeGitHub(self.make_issues(), self.make_comments()).request_with_retry)

        sync.main([])

        conn = sqlite3.connect(db_path)
        n_issues = conn.execute("SELECT COUNT(*) FROM issues").fetchone()[0]
        n_comments = conn.execute("SELECT COUNT(*) FROM comments").fetchone()[0]
        conn.close()
        self.assertEqual(n_issues, 5)
        self.assertEqual(n_comments, 4)


class FakeSession:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = 0

    def get(self, url, params=None, timeout=None):
        self.calls += 1
        return self.responses.pop(0)


class RetryTestCase(unittest.TestCase):
    def setUp(self):
        self._sleep = time.sleep
        time.sleep = lambda s: None

    def tearDown(self):
        time.sleep = self._sleep

    def test_retries_on_429_with_retry_after(self):
        session = FakeSession([
            FakeHTTPResp(429, headers={"Retry-After": "2"}),
            FakeHTTPResp(200, payload=[{"ok": 1}]),
        ])
        resp = sync.request_with_retry(session, "http://x", {})
        self.assertEqual(resp.json(), [{"ok": 1}])
        self.assertEqual(session.calls, 2)

    def test_retries_on_403_rate_limit_header(self):
        session = FakeSession([
            FakeHTTPResp(403, headers={"X-RateLimit-Remaining": "0", "X-RateLimit-Reset": "0"}),
            FakeHTTPResp(200, payload=[{"ok": 1}]),
        ])
        resp = sync.request_with_retry(session, "http://x", {})
        self.assertEqual(resp.json(), [{"ok": 1}])

    def test_retries_on_5xx_then_succeeds(self):
        session = FakeSession([
            FakeHTTPResp(502),
            FakeHTTPResp(503),
            FakeHTTPResp(200, payload=[{"ok": 1}]),
        ])
        resp = sync.request_with_retry(session, "http://x", {})
        self.assertEqual(resp.json(), [{"ok": 1}])
        self.assertEqual(session.calls, 3)

    def test_non_rate_limit_403_fails_fast(self):
        session = FakeSession([
            FakeHTTPResp(403, text="Forbidden: bad credentials"),
        ])
        with self.assertRaises(requests.HTTPError):
            sync.request_with_retry(session, "http://x", {})
        self.assertEqual(session.calls, 1)

    def test_exhausted_retries_raises(self):
        session = FakeSession([FakeHTTPResp(500)] * 3)
        with self.assertRaises(RuntimeError) as ctx:
            sync.request_with_retry(session, "http://x", {}, max_retries=3)
        self.assertIn("HTTP 500", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
