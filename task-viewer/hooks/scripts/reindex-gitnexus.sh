#!/usr/bin/env bash
# PostToolUse hook: re-analyze GitNexus index after git commit/merge
# Runs in background to avoid blocking Claude Code

set -euo pipefail

# Only trigger on git commit or git merge commands
TOOL_INPUT="${TOOL_INPUT:-}"
if ! echo "$TOOL_INPUT" | grep -qE 'git (commit|merge)'; then
  exit 0
fi

# Determine project directory
PROJECT_DIR="${PROJECT_CWD:-$(pwd)}"

# Check if gitnexus is indexed for this project
if [ ! -d "$PROJECT_DIR/.gitnexus" ]; then
  exit 0
fi

# Check if embeddings exist to preserve them
HAS_EMBEDDINGS=false
if [ -f "$PROJECT_DIR/.gitnexus/meta.json" ]; then
  EMBED_COUNT=$(grep -o '"embeddings":[0-9]*' "$PROJECT_DIR/.gitnexus/meta.json" 2>/dev/null | grep -o '[0-9]*$' || echo "0")
  if [ "$EMBED_COUNT" -gt 0 ]; then
    HAS_EMBEDDINGS=true
  fi
fi

# Run analyze in background
if [ "$HAS_EMBEDDINGS" = true ]; then
  (cd "$PROJECT_DIR" && npx gitnexus analyze --embeddings > /tmp/gitnexus-reindex.log 2>&1) &
else
  (cd "$PROJECT_DIR" && npx gitnexus analyze > /tmp/gitnexus-reindex.log 2>&1) &
fi

exit 0
