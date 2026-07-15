#!/usr/bin/env python3
"""Fill in <pubDate> per item and <channel><lastBuildDate> in sitemap.rss.

sitemap.rss is otherwise hand-maintained: this script does not add or
remove <item> entries, it only (re)computes dates for the items already
listed there. Run it after publishing or re-dating a page, or any time
before a release, to refresh sitemap.rss without hand-editing XML.

Date for each item is resolved in priority order:
  1. <meta property="article:published_time"> on the page (blog posts)
  2. the visible "Month Year" project date label, e.g. "April 2022"
     (project pages) - day-of-month is unknown, so the 15th is used
  3. the date the page was first added to git history (everything else:
     home, legal pages, service pages)

Usage:
    python scripts/generate-rss-dates.py
"""
import re
import subprocess
import sys
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RSS_PATH = ROOT / "sitemap.rss"

MONTHS = {
    "januari": 1, "january": 1,
    "februari": 2, "february": 2,
    "maart": 3, "march": 3,
    "april": 4,
    "mei": 5, "may": 5,
    "juni": 6, "june": 6,
    "juli": 7, "july": 7,
    "augustus": 8, "august": 8,
    "september": 9,
    "oktober": 10, "october": 10,
    "november": 11,
    "december": 12,
}


def url_to_path(url: str) -> Path:
    path = url.replace("https://imetech.nl", "").strip("/")
    if path == "":
        return ROOT / "index.html"
    return ROOT / path / "index.html"


def from_article_meta(html: str):
    m = re.search(r'<meta property="article:published_time" content="(\d{4}-\d{2}-\d{2})"', html)
    if m:
        return datetime.strptime(m.group(1), "%Y-%m-%d")
    return None


def from_project_label(html: str):
    m = re.search(r'<span class="label">([A-Za-z]+)\s+(\d{4})</span>', html)
    if m:
        month = MONTHS.get(m.group(1).lower())
        if month:
            return datetime(int(m.group(2)), month, 15)
    return None


def from_git_history(rel_path: str):
    try:
        out = subprocess.run(
            ["git", "log", "--follow", "--format=%ad", "--date=short", "--", rel_path],
            cwd=ROOT, capture_output=True, text=True, check=True,
        ).stdout.strip().splitlines()
        if out:
            return datetime.strptime(out[-1], "%Y-%m-%d")
    except subprocess.CalledProcessError:
        pass
    return None


def resolve_date(url: str):
    path = url_to_path(url)
    if not path.is_file():
        return None, "no local file found for this URL"
    html = path.read_text(encoding="utf-8")
    date = from_article_meta(html)
    if date:
        return date, "article:published_time"
    date = from_project_label(html)
    if date:
        return date, "project date label"
    rel = str(path.relative_to(ROOT)).replace("\\", "/")
    date = from_git_history(rel)
    if date:
        return date, "git first-commit date"
    return None, "no date signal found"


def to_rfc822(dt: datetime) -> str:
    return format_datetime(dt.replace(tzinfo=timezone.utc), usegmt=True)


def main():
    content = RSS_PATH.read_text(encoding="utf-8")

    def process_item(match):
        block = match.group(0)
        link_m = re.search(r"<link>([^<]+)</link>", block)
        if not link_m:
            return block
        url = link_m.group(1)
        date, source = resolve_date(url)
        if date is None:
            print(f"WARNING: {url}: {source} - leaving without pubDate", file=sys.stderr)
            return block
        pub = to_rfc822(date)
        if "<pubDate>" in block:
            return re.sub(r"<pubDate>[^<]*</pubDate>", f"<pubDate>{pub}</pubDate>", block)
        return block.replace("\n    </item>", f"\n      <pubDate>{pub}</pubDate>\n    </item>")

    content = re.sub(r"<item>.*?</item>", process_item, content, flags=re.S)

    first_item_idx = content.index("<item>")
    head, rest = content[:first_item_idx], content[first_item_idx:]
    now = to_rfc822(datetime.now(timezone.utc))
    if "<lastBuildDate>" in head:
        head = re.sub(r"<lastBuildDate>[^<]*</lastBuildDate>", f"<lastBuildDate>{now}</lastBuildDate>", head)
    else:
        head = re.sub(r"(</description>\s*\n)", rf"\1    <lastBuildDate>{now}</lastBuildDate>\n", head, count=1)

    RSS_PATH.write_text(head + rest, encoding="utf-8", newline="\n")
    print(f"Updated {RSS_PATH}")


if __name__ == "__main__":
    main()
