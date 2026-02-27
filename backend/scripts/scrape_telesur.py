#!/usr/bin/env python
"""Scrape public Telesur website pages and export RAG-ready documents."""

from __future__ import annotations

import argparse
import hashlib
import re
import sys
import warnings
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse, urldefrag
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR_DEFAULT = str(ROOT_DIR.parent / "data")


DEFAULT_KEYWORDS = (
    "mobile",
    "fiber",
    "internet",
    "entertainment",
    "tv",
    "plan",
    "prepaid",
    "postpaid",
    "broadband",
    "telefonie",
    "pakket",
    "bundel",
)

SKIP_URL_PATTERNS = (
    "/wp-admin/",
    "/wp-login",
    "/cart",
    "/checkout",
    "/my-account",
)


@dataclass
class PageRecord:
    url: str
    title: str
    relevance_score: int
    text: str


def normalize_url(base_url: str, href: str) -> str | None:
    if not href:
        return None
    if (
        href.startswith("mailto:")
        or href.startswith("tel:")
        or href.startswith("javascript:")
    ):
        return None
    absolute = urljoin(base_url, href)
    absolute, _fragment = urldefrag(absolute)
    parsed = urlparse(absolute)
    if parsed.scheme not in {"http", "https"}:
        return None
    cleaned = parsed._replace(query="", fragment="")
    return cleaned.geturl().rstrip("/")


def should_skip_url(url: str, domain: str) -> bool:
    parsed = urlparse(url)
    if parsed.netloc != domain:
        return True
    lower = url.lower()
    if any(pattern in lower for pattern in SKIP_URL_PATTERNS):
        return True
    if re.search(r"\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|mp4|mp3)$", lower):
        return True
    return False


def collapse_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def extract_clean_text(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "noscript", "iframe", "svg", "form"]):
        tag.decompose()

    title = ""
    if soup.title and soup.title.string:
        title = collapse_whitespace(soup.title.string)
    if not title:
        h1 = soup.find("h1")
        if h1:
            title = collapse_whitespace(h1.get_text(" ", strip=True))
    if not title:
        title = "Untitled page"

    container = soup.find("main") or soup.find("article") or soup.body or soup
    for tag_name in ("header", "footer", "nav", "aside"):
        for tag in container.find_all(tag_name):
            tag.decompose()

    text = collapse_whitespace(container.get_text(" ", strip=True))
    return title, text


def relevance_score(url: str, title: str, text: str, keywords: Iterable[str]) -> int:
    content = f"{url} {title} {text}".lower()
    score = 0
    for keyword in keywords:
        if keyword.lower() in content:
            score += 1
    return score


def allowed_by_robots(
    robots: RobotFileParser | None, url: str, user_agent: str
) -> bool:
    if robots is None:
        return True
    try:
        return robots.can_fetch(user_agent, url)
    except Exception:
        return True


def load_robots(base_url: str) -> RobotFileParser | None:
    robots_url = urljoin(base_url.rstrip("/") + "/", "robots.txt")
    parser = RobotFileParser()
    parser.set_url(robots_url)
    try:
        parser.read()
        return parser
    except Exception:
        return None


def resolve_canonical_base(
    base_url: str,
    session: requests.Session,
    headers: dict[str, str],
) -> tuple[str, str]:
    try:
        response = session.get(base_url, headers=headers, timeout=20)
    except requests.RequestException:
        parsed = urlparse(base_url)
        return base_url, parsed.netloc

    soup = BeautifulSoup(response.text, "html.parser")
    canonical = soup.find("link", attrs={"rel": "canonical"})
    if canonical:
        href = (canonical.get("href") or "").strip()
        if href:
            parsed_canonical = urlparse(href)
            if parsed_canonical.scheme in {"http", "https"} and parsed_canonical.netloc:
                canonical_root = (
                    f"{parsed_canonical.scheme}://{parsed_canonical.netloc}"
                )
                return canonical_root.rstrip("/"), parsed_canonical.netloc

    resolved = response.url.rstrip("/")
    parsed = urlparse(resolved)
    return resolved, parsed.netloc


def discover_sitemap_urls(
    base_url: str,
    session: requests.Session,
    headers: dict[str, str],
) -> list[str]:
    candidates = [
        urljoin(base_url.rstrip("/") + "/", "sitemap.xml"),
    ]
    robots_url = urljoin(base_url.rstrip("/") + "/", "robots.txt")
    try:
        robots_response = session.get(robots_url, headers=headers, timeout=20)
        if robots_response.ok:
            for line in robots_response.text.splitlines():
                if line.lower().startswith("sitemap:"):
                    sitemap_url = line.split(":", 1)[1].strip()
                    if sitemap_url:
                        candidates.append(sitemap_url)
    except requests.RequestException:
        pass

    seen: set[str] = set()
    urls: list[str] = []
    for sitemap_url in candidates:
        if sitemap_url in seen:
            continue
        seen.add(sitemap_url)
        try:
            response = session.get(sitemap_url, headers=headers, timeout=20)
        except requests.RequestException:
            continue
        if not response.ok:
            continue
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", XMLParsedAsHTMLWarning)
            soup = BeautifulSoup(response.text, "html.parser")
        for loc in soup.find_all("loc"):
            value = collapse_whitespace(loc.get_text(" ", strip=True))
            if value:
                urls.append(value.rstrip("/"))
    return urls


def write_outputs(
    output_md: Path,
    base_url: str,
    pages: list[PageRecord],
    max_chars_per_page: int,
) -> None:
    output_md.parent.mkdir(parents=True, exist_ok=True)

    md_lines: list[str] = [
        "# Telesur Website Extract",
        "",
        f"Source root: {base_url}",
        f"Relevant pages captured: {len(pages)}",
        "",
    ]

    for idx, page in enumerate(pages, start=1):
        trimmed = page.text[:max_chars_per_page].strip()
        md_lines.extend(
            [
                f"## {idx}. {page.title}",
                f"Source: {page.url}",
                f"Relevance score: {page.relevance_score}",
                "",
                trimmed,
                "",
            ]
        )

    output_md.write_text("\n".join(md_lines).strip() + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Scrape key Telesur pages for TeleBot RAG data."
    )
    parser.add_argument(
        "--base-url", default="https://www.telesur.sr", help="Website root to crawl"
    )
    parser.add_argument(
        "--max-pages", type=int, default=50, help="Maximum pages to fetch"
    )
    parser.add_argument(
        "--min-text-len",
        type=int,
        default=250,
        help="Minimum cleaned text length to keep page",
    )
    parser.add_argument(
        "--max-chars-per-page",
        type=int,
        default=8000,
        help="Max chars stored per kept page",
    )
    parser.add_argument(
        "--keywords",
        default=",".join(DEFAULT_KEYWORDS),
        help="Comma-separated relevance keywords",
    )
    parser.add_argument(
        "--output-md",
        default=str(Path(DATA_DIR_DEFAULT) / "telesur_site_scrape.md"),
        help="Markdown output path",
    )
    parser.add_argument(
        "--user-agent",
        default="TeleBotAcademicScraper/1.0 (+https://telesur.sr)",
        help="HTTP User-Agent",
    )
    parser.add_argument(
        "--ignore-robots",
        action="store_true",
        help="Ignore robots.txt checks (not recommended)",
    )
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    keywords = tuple(k.strip().lower() for k in args.keywords.split(",") if k.strip())
    output_md = Path(args.output_md)

    headers = {"User-Agent": args.user_agent}
    session = requests.Session()
    resolved_base_url, domain = resolve_canonical_base(
        base_url=base_url,
        session=session,
        headers=headers,
    )
    if not domain:
        print("Invalid --base-url. Example: https://www.telesur.sr")
        return 2
    if resolved_base_url != base_url:
        print(f"Using canonical base URL: {resolved_base_url}")
    base_url = resolved_base_url

    robots = None if args.ignore_robots else load_robots(base_url=base_url)
    queue: deque[str] = deque([base_url])
    seen: set[str] = set()
    seen_signatures: set[str] = set()
    kept: list[PageRecord] = []

    print(f"Starting crawl on {base_url} (max-pages={args.max_pages})")
    if robots is None and not args.ignore_robots:
        print("robots.txt unavailable, proceeding conservatively.")

    for discovered in discover_sitemap_urls(
        base_url=base_url, session=session, headers=headers
    ):
        if not should_skip_url(discovered, domain=domain):
            queue.append(discovered)

    while queue and len(seen) < args.max_pages:
        current = queue.popleft()
        if current in seen:
            continue
        if should_skip_url(current, domain=domain):
            continue
        if not allowed_by_robots(robots, current, args.user_agent):
            continue

        seen.add(current)
        try:
            response = session.get(current, headers=headers, timeout=20)
        except requests.RequestException as exc:
            print(f"[skip] {current} -> request error: {exc}")
            continue

        content_type = (response.headers.get("content-type") or "").lower()
        if response.status_code >= 400 or "text/html" not in content_type:
            print(
                f"[skip] {current} -> status={response.status_code} content-type={content_type}"
            )
            continue

        title, text = extract_clean_text(response.text)
        score = relevance_score(current, title, text, keywords)
        signature = hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()
        if signature in seen_signatures:
            print(f"[drop] {current} (duplicate text)")
        elif len(text) >= args.min_text_len and score > 0:
            seen_signatures.add(signature)
            kept.append(
                PageRecord(url=current, title=title, relevance_score=score, text=text)
            )
            print(f"[keep] {current} (score={score}, chars={len(text)})")
        else:
            print(f"[drop] {current} (score={score}, chars={len(text)})")

        soup = BeautifulSoup(response.text, "html.parser")
        for anchor in soup.find_all("a"):
            href = anchor.get("href")
            normalized = normalize_url(base_url=current, href=href or "")
            if not normalized:
                continue
            if normalized in seen:
                continue
            if should_skip_url(normalized, domain=domain):
                continue
            queue.append(normalized)

    kept.sort(key=lambda row: row.relevance_score, reverse=True)
    write_outputs(
        output_md=output_md,
        base_url=base_url,
        pages=kept,
        max_chars_per_page=args.max_chars_per_page,
    )

    print("")
    print(f"Crawl complete. Visited pages: {len(seen)}")
    print(f"Relevant pages exported: {len(kept)}")
    print(f"Markdown: {output_md}")
    print("Next step: run ingest_docs.py to add extracted markdown into Chroma.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
