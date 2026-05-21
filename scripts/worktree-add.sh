#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <worktree-path> <branch-name>" >&2
  exit 1
fi

WORKTREE_PATH="$1"
BRANCH_NAME="$2"
REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)

git -C "$REPO_ROOT" worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"

ln -s "$REPO_ROOT/node_modules" "$WORKTREE_PATH/node_modules"
ln -s "$REPO_ROOT/apps/web/node_modules" "$WORKTREE_PATH/apps/web/node_modules"
ln -s "$REPO_ROOT/packages/shared/node_modules" "$WORKTREE_PATH/packages/shared/node_modules"
ln -s "$REPO_ROOT/packages/cli/node_modules" "$WORKTREE_PATH/packages/cli/node_modules"

echo "Worktree ready at $WORKTREE_PATH (branch: $BRANCH_NAME)"
echo "node_modules symlinked from $REPO_ROOT"
