#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
BRANCH="gh-pages"
COMMIT_MSG="publish: ${1:-$(git rev-parse --short HEAD)}"
git fetch origin "$BRANCH" >/dev/null 2>&1 || true
COMMIT_HASH="$(git rev-parse HEAD || echo unknown)"
git tag -f pages-publish "${COMMIT_HASH}" >/dev/null 2>&1 || true
echo "Pushing ${COMMIT_MSG} to origin/${BRANCH} via existing dist/"
git push origin "${COMMIT_HASH}:${BRANCH}" --force-with-lease
echo "Done"
