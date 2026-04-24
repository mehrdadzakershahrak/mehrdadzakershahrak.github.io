#!/usr/bin/env python3
"""Rotate the homepage hero verb in index.html."""

from __future__ import annotations

import argparse
import random
import re
import sys
from pathlib import Path

VERBS = (
    "shaping",
    "framing",
    "forming",
    "guiding",
    "influencing",
)
HERO_RE = re.compile(
    r"(Played a part in )(" + "|".join(VERBS) + r")( the principles behind<br>)"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Rotate the homepage hero verb to another allowed value."
    )
    parser.add_argument(
        "--index-path",
        default="index.html",
        help="Path to the homepage template to update.",
    )
    parser.add_argument(
        "--chance",
        type=float,
        default=1.0,
        help="Probability of applying a rotation on this run.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        help="Optional deterministic random seed for testing.",
    )
    parser.add_argument(
        "--current-verb",
        action="store_true",
        help="Print the current hero verb without modifying the file.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Choose a new verb but do not write the file.",
    )
    args = parser.parse_args()
    if not 0.0 <= args.chance <= 1.0:
        parser.error("--chance must be between 0.0 and 1.0")
    return args


def load_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise SystemExit(f"index file not found: {path}")


def current_verb(text: str) -> str:
    match = HERO_RE.search(text)
    if not match:
        raise SystemExit("could not find the homepage hero verb line")
    return match.group(2)


def next_verb(current: str, rng: random.Random) -> str:
    candidates = [verb for verb in VERBS if verb != current]
    return rng.choice(candidates)


def rotate_once(text: str, replacement: str) -> str:
    return HERO_RE.sub(rf"\1{replacement}\3", text, count=1)


def build_rng(seed: int | None) -> random.Random:
    if seed is not None:
        return random.Random(seed)
    return random.SystemRandom()


def main() -> int:
    args = parse_args()
    path = Path(args.index_path)
    text = load_text(path)
    current = current_verb(text)

    if args.current_verb:
        print(current)
        return 0

    rng = build_rng(args.seed)
    if args.chance < 1.0 and rng.random() > args.chance:
        print(f"skipped rotation; current verb remains {current}")
        return 0

    replacement = next_verb(current, rng)
    updated = rotate_once(text, replacement)

    if updated == text:
        raise SystemExit("rotation produced no change")

    if not args.dry_run:
        path.write_text(updated, encoding="utf-8")

    print(replacement)
    return 0


if __name__ == "__main__":
    sys.exit(main())
