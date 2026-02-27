#!/usr/bin/env python
"""Periodic RAG data refresh: scrape Telesur site and ingest into ChromaDB."""

from __future__ import annotations

import argparse
import datetime as dt
import os
import subprocess
import sys
import time
from pathlib import Path

try:
    import fcntl
    _HAS_FCNTL = True
except ImportError:
    _HAS_FCNTL = False


ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

DATA_DIR_DEFAULT = str(ROOT_DIR.parent / "data")
LOCK_PATH = Path("/tmp/telebot-rag-refresh.lock")


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def run_command(cmd: list[str]) -> tuple[int, str, str]:
    process = subprocess.run(cmd, capture_output=True, text=True)
    return process.returncode, process.stdout, process.stderr


def refresh_once(
    *,
    base_url: str,
    max_pages: int,
    data_dir: str,
    reset: bool,
    allow_scrape_failure: bool,
) -> int:
    timestamp = dt.datetime.now(dt.timezone.utc).isoformat()
    print(f"[refresh] start {timestamp}")

    scrape_cmd = [
        sys.executable,
        "scripts/scrape_telesur.py",
        "--base-url",
        base_url,
        "--max-pages",
        str(max_pages),
        "--output-md",
        f"{data_dir}/telesur_site_scrape.md",
    ]
    code, out, err = run_command(scrape_cmd)
    if out.strip():
        print(out.strip())
    if err.strip():
        print(err.strip())

    if code != 0:
        message = f"[refresh] scrape failed (exit {code})"
        if allow_scrape_failure:
            print(f"{message}; continuing with ingest.")
        else:
            print(message)
            return code

    ingest_cmd = [
        sys.executable,
        "scripts/ingest_docs.py",
        "--data-dir",
        data_dir,
    ]
    if reset:
        ingest_cmd.append("--reset")

    code, out, err = run_command(ingest_cmd)
    if out.strip():
        print(out.strip())
    if err.strip():
        print(err.strip())

    if code != 0:
        print(f"[refresh] ingest failed (exit {code})")
        return code

    timestamp = dt.datetime.now(dt.timezone.utc).isoformat()
    print(f"[refresh] success {timestamp}")
    return 0


def with_lock(func):
    def wrapped(*args, **kwargs):
        if not _HAS_FCNTL:
            return func(*args, **kwargs)
        LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
        with LOCK_PATH.open("w") as lock_file:
            try:
                fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            except OSError:
                print(
                    "[refresh] another refresh is already running; skipping this cycle."
                )
                return 0
            return func(*args, **kwargs)

    return wrapped


@with_lock
def locked_refresh(*args, **kwargs) -> int:
    return refresh_once(*args, **kwargs)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Refresh scraped data and ingest into Chroma."
    )
    parser.add_argument(
        "--once", action="store_true", help="Run one refresh cycle and exit."
    )
    parser.add_argument(
        "--daemon",
        action="store_true",
        help="Run refresh cycle in an endless interval loop.",
    )
    parser.add_argument(
        "--interval-minutes",
        type=int,
        default=int(os.getenv("RAG_REFRESH_INTERVAL_MINUTES", "360")),
        help="Refresh interval for daemon mode.",
    )
    parser.add_argument(
        "--base-url",
        default=os.getenv("RAG_SCRAPE_BASE_URL", "https://www.telesur.sr"),
        help="Base URL for scraper.",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=int(os.getenv("RAG_SCRAPE_MAX_PAGES", "50")),
        help="Maximum pages to scrape.",
    )
    parser.add_argument(
        "--data-dir",
        default=os.getenv("RAG_DATA_DIR", DATA_DIR_DEFAULT),
        help="Data directory used by scraper and ingester.",
    )
    parser.add_argument(
        "--allow-scrape-failure",
        action="store_true",
        default=env_bool("RAG_ALLOW_SCRAPE_FAILURE", True),
        help="Continue to ingestion when scraping fails.",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        default=env_bool("RAG_REFRESH_RESET", False),
        help="Reset Chroma collection before ingestion.",
    )
    args = parser.parse_args()

    if not args.once and not args.daemon:
        args.once = True

    if args.interval_minutes < 1:
        print("--interval-minutes must be >= 1")
        return 2

    refresh_kwargs = {
        "base_url": args.base_url,
        "max_pages": args.max_pages,
        "data_dir": args.data_dir,
        "reset": args.reset,
        "allow_scrape_failure": args.allow_scrape_failure,
    }

    if args.once:
        return locked_refresh(**refresh_kwargs)

    interval_seconds = args.interval_minutes * 60
    print(
        f"[refresh] daemon started: every {args.interval_minutes} minutes "
        f"(base={args.base_url}, max_pages={args.max_pages})"
    )
    while True:
        time.sleep(interval_seconds)
        _ = locked_refresh(**refresh_kwargs)


if __name__ == "__main__":
    raise SystemExit(main())
