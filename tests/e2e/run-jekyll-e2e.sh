#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="${PLAYWRIGHT_JEKYLL_DEST:-$(mktemp -d "${TMPDIR:-/tmp}/mdz-jekyll-e2e.XXXXXX")}"

cleanup() {
  rm -rf "$DEST_DIR"
}

trap cleanup EXIT

bundle exec jekyll serve \
  --host 127.0.0.1 \
  --port 4000 \
  --destination "$DEST_DIR"
