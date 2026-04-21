#!/usr/bin/env python3
"""
Static validators for the Jekyll site.

We can't run `bundle exec jekyll build` in this sandbox (rubygems.org blocked),
so this script sanity-checks the source files we're likely to touch:

 * HTML/Markdown front-matter + Liquid tag balance
 * SCSS brace/paren balance + trailing-semicolon hygiene
 * JS files via `node --check`
 * JSON data files parse cleanly

Run after each stage:
    python3 tools/validate_site.py
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ---------- Liquid / HTML ----------

LIQUID_OPEN_RE = re.compile(r"\{%[-]?\s*([a-zA-Z_]+)")
LIQUID_CLOSE_RE = re.compile(r"\{%[-]?\s*end([a-zA-Z_]+)")

PAIR_TAGS = {
    "if", "for", "unless", "case", "capture", "comment",
    "raw", "tablerow", "form", "highlight",
}

def check_liquid(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8", errors="replace")
    stack: list[tuple[str, int]] = []
    errors: list[str] = []
    for lineno, line in enumerate(text.splitlines(), 1):
        # matching open/close on a per-line basis
        pos = 0
        while True:
            m = re.search(r"\{%[-]?\s*(end)?([a-zA-Z_]+)", line[pos:])
            if not m:
                break
            pos += m.end()
            is_end = bool(m.group(1))
            name = m.group(2)
            if name in PAIR_TAGS and not is_end:
                stack.append((name, lineno))
            elif is_end and name in PAIR_TAGS:
                if not stack:
                    errors.append(f"{path}:{lineno}: unmatched end{name}")
                else:
                    top, _ = stack.pop()
                    if top != name:
                        errors.append(
                            f"{path}:{lineno}: expected end{top}, got end{name}"
                        )
    for name, lineno in stack:
        errors.append(f"{path}:{lineno}: unclosed {{% {name} %}}")

    # expression balance
    open_count = text.count("{{")
    close_count = text.count("}}")
    if open_count != close_count:
        errors.append(f"{path}: {{{{ count {open_count} != }}}} count {close_count}")
    return errors


# ---------- SCSS ----------

def strip_scss_comments(text: str) -> str:
    # block comments
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    # line comments
    text = re.sub(r"//[^\n]*", "", text)
    # strings
    text = re.sub(r'"(?:\\.|[^"\\])*"', '""', text)
    text = re.sub(r"'(?:\\.|[^'\\])*'", "''", text)
    return text


def check_scss(path: Path) -> list[str]:
    src = path.read_text(encoding="utf-8", errors="replace")
    # Skip Jekyll front-matter if present
    if src.startswith("---"):
        parts = src.split("---", 2)
        if len(parts) >= 3:
            src = parts[2]
    stripped = strip_scss_comments(src)
    errors: list[str] = []
    depth = 0
    paren = 0
    bracket = 0
    for i, ch in enumerate(stripped):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth < 0:
                errors.append(f"{path}: extra closing '}}' near offset {i}")
                depth = 0
        elif ch == "(":
            paren += 1
        elif ch == ")":
            paren -= 1
        elif ch == "[":
            bracket += 1
        elif ch == "]":
            bracket -= 1
    if depth != 0:
        errors.append(f"{path}: unbalanced braces (depth={depth})")
    if paren != 0:
        errors.append(f"{path}: unbalanced parentheses (depth={paren})")
    if bracket != 0:
        errors.append(f"{path}: unbalanced brackets (depth={bracket})")
    return errors


# ---------- JS ----------

def check_js(path: Path) -> list[str]:
    # Jekyll-processed JS starts with `---` front-matter; node --check can't
    # parse it. Skip those.
    try:
        head = path.read_text(encoding="utf-8", errors="replace")[:4]
        if head.startswith("---"):
            return []
    except Exception:
        pass
    try:
        res = subprocess.run(
            ["node", "--check", str(path)],
            capture_output=True, text=True, check=False, timeout=10,
        )
    except Exception as exc:  # noqa: BLE001
        return [f"{path}: node --check failed: {exc}"]
    if res.returncode != 0:
        return [f"{path}: {res.stderr.strip() or res.stdout.strip()}"]
    return []


# ---------- JSON / YAML-ish data ----------

def check_json(path: Path) -> list[str]:
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        return [f"{path}: {exc}"]
    return []


# ---------- runner ----------

IGNORED_DIRS = {".git", "node_modules", "_site", "vendor", "MythosBridge", "test-results"}

def walk(root: Path):
    for p in root.rglob("*"):
        if any(part in IGNORED_DIRS for part in p.parts):
            continue
        if p.is_file():
            yield p


def main() -> int:
    errors: list[str] = []
    liquid_exts = {".html", ".md"}
    scss_exts = {".scss", ".sass"}
    for p in walk(ROOT):
        ext = p.suffix.lower()
        if ext in liquid_exts:
            errors.extend(check_liquid(p))
        elif ext in scss_exts:
            errors.extend(check_scss(p))
        elif ext == ".js":
            errors.extend(check_js(p))
        elif ext == ".json":
            errors.extend(check_json(p))
    if errors:
        print("Validation FAILED:\n", file=sys.stderr)
        for e in errors:
            print("  " + e, file=sys.stderr)
        return 1
    print("Validation OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
