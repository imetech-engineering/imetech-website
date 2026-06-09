#!/usr/bin/env python3
"""Fix common UTF-8 mojibake in HTML files."""
from __future__ import annotations

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Order matters: longer / more specific patterns first.
REPLACEMENTS: list[tuple[str, str]] = [
    ("ÃƒÂ³ÃƒÂ³", "óó"),
    ("ÃƒÂ¶", "ö"),
    ("ÃƒÂ³", "ó"),
    ("ÃƒÂº", "ú"),
    ("ÃƒÂ¼", "ü"),
    ("ÃƒÂª", "ê"),
    ("ÃƒÂ«", "ë"),
    ("ÃƒÂ©", "é"),
    ("ÃƒÂ¯", "ï"),
    ("Ãƒ×", "×"),
    ("Ãƒ—", "×"),
    ("Ã‚Â°", "°"),
    ("Ã¢â€šâ€š", "₂"),
    ("â€”", "—"),
    ("â€“", "–"),
    ("â€˜", "'"),
    ("â€™", "'"),
    ("â€œ", '"'),
    ("â€\u009d", '"'),
    ("â€¦", "…"),
    ("Â·", "·"),
    ("Ã©Ã©n", "één"),
    ("EÃ©n", "Één"),
    ("Ã©", "é"),
    ("Ã«", "ë"),
    ("Ã¯", "ï"),
    ("Ã³", "ó"),
    ("Ã¶", "ö"),
    ("Ã¼", "ü"),
    ("Ã¨", "è"),
    ("Ã ", "à"),
    ("Ã¢", "â"),
    ("Ã®", "î"),
    ("Ã´", "ô"),
    ("Ã§", "ç"),
    ("Ã‰", "É"),
    ("Ã„", "Ä"),
    ("Ã–", "Ö"),
    ("Ãœ", "Ü"),
]


def should_process(path: str) -> bool:
    rel = os.path.relpath(path, ROOT).replace("\\", "/")
    if rel.startswith("v1/"):
        return False
    return rel.endswith(".html")


def fix_text(text: str) -> tuple[str, int]:
    total = 0
    for bad, good in REPLACEMENTS:
        count = text.count(bad)
        if count:
            text = text.replace(bad, good)
            total += count
    return text, total


def main() -> int:
    changed_files = 0
    total_replacements = 0

    for dirpath, _, files in os.walk(ROOT):
        for name in files:
            if not name.endswith(".html"):
                continue
            path = os.path.join(dirpath, name)
            if not should_process(path):
                continue
            with open(path, encoding="utf-8", errors="surrogateescape") as fh:
                original = fh.read()
            fixed, count = fix_text(original)
            if count and fixed != original:
                with open(path, "w", encoding="utf-8", newline="\n") as fh:
                    fh.write(fixed)
                rel = os.path.relpath(path, ROOT)
                print(f"{rel}: {count} replacements")
                changed_files += 1
                total_replacements += count

    print(f"Done. {changed_files} files, {total_replacements} replacements.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
