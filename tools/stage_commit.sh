#!/usr/bin/env bash
# Plumbing-based commit used from the Cowork sandbox, where the FUSE mount
# blocks deletion of .git/index.lock after a failed commit. We keep a copy
# of the index outside the mount, update it there, and then advance the
# branch ref via git-commit-tree + git-update-ref.
#
# Usage:
#   ./tools/stage_commit.sh "<commit subject>" "<commit body>"
#
# Any paths pre-staged with `git add` via normal flow won't appear; this
# script builds the commit off the current working tree relative to HEAD.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
ALT_INDEX="${TMPDIR:-/tmp}/mdz_alt_index"
cp "$REPO/.git/index" "$ALT_INDEX"

cd "$REPO"

# Refresh and add every changed/new path (respecting .gitignore).
GIT_INDEX_FILE="$ALT_INDEX" git add -A
GIT_INDEX_FILE="$ALT_INDEX" git update-index --refresh >/dev/null 2>&1 || true

TREE=$(GIT_INDEX_FILE="$ALT_INDEX" git write-tree)
PARENT=$(git rev-parse HEAD)

if [[ "$TREE" == "$(git rev-parse "$PARENT^{tree}")" ]]; then
  echo "no changes to commit" >&2
  exit 0
fi

SUBJECT="$1"
BODY="${2:-}"
MSG="$SUBJECT"
if [[ -n "$BODY" ]]; then
  MSG="$SUBJECT

$BODY"
fi

COMMIT=$(printf "%s" "$MSG" | git commit-tree "$TREE" -p "$PARENT")

# `git update-ref` fails because .git/HEAD.lock can't be deleted on this
# FUSE mount. Write the ref directly, ignoring any leftover .lock files.
REF_FILE="$REPO/.git/refs/heads/gh-pages"
printf "%s\n" "$COMMIT" > "$REF_FILE"

# Sync index so `git status` is clean.
cp "$ALT_INDEX" "$REPO/.git/index" 2>/dev/null || true

echo "$COMMIT"
