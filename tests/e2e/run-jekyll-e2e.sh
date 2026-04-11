#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/homebrew/bin:$PATH"

if command -v rbenv >/dev/null 2>&1; then
  eval "$(rbenv init - bash)"
fi

if ! ruby -e 'exit RUBY_VERSION.start_with?("3.2.") ? 0 : 1'; then
  echo "Jekyll E2E requires Ruby 3.2.x. Use rbenv with the repo's .ruby-version before running npm run test:e2e." >&2
  exit 1
fi

if ! bundle _4.0.7_ --version >/dev/null 2>&1; then
  echo "Bundler 4.0.7 is required. Run: gem install bundler -v 4.0.7" >&2
  exit 1
fi

DEST_DIR="${PLAYWRIGHT_JEKYLL_DEST:-$(mktemp -d "${TMPDIR:-/tmp}/mdz-jekyll-e2e.XXXXXX")}"

cleanup() {
  rm -rf "$DEST_DIR"
}

trap cleanup EXIT

bundle _4.0.7_ exec jekyll serve \
  --host 127.0.0.1 \
  --port 4000 \
  --destination "$DEST_DIR"
