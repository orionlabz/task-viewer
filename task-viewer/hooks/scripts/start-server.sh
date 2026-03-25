#!/bin/bash
set -euo pipefail

PROJECT_CWD="$PWD"

# 1. Check if server is already running and healthy
if [ -f /tmp/task-viewer.pid ]; then
  PID=$(cat /tmp/task-viewer.pid)
  if kill -0 "$PID" 2>/dev/null; then
    # Process exists — check if it responds
    if curl -sf http://localhost:37778 > /dev/null 2>&1; then
      # Server is healthy, skip restart
      exit 0
    fi
    # Process exists but not responding — kill it
    kill "$PID" 2>/dev/null || true
    sleep 1
    kill -9 "$PID" 2>/dev/null || true
  fi
  rm -f /tmp/task-viewer.pid
fi

# 2. Kill any stale process on the port (orphaned from a previous crash)
lsof -ti:37778 | xargs kill 2>/dev/null || true
sleep 1
lsof -ti:37778 | xargs kill -9 2>/dev/null || true

# 3. Install deps if needed
cd "${CLAUDE_PLUGIN_ROOT}/hooks/server"
[ -d node_modules ] || npm install --silent

# 4. Start server
PROJECT_CWD="$PROJECT_CWD" nohup node server.mjs > /tmp/task-viewer.log 2>&1 &
echo $! > /tmp/task-viewer.pid

# 5. Wait for server to be ready, then open browser
for i in 1 2 3 4 5; do
  curl -sf http://localhost:37778 > /dev/null 2>&1 && break
  sleep 1
done
open "http://localhost:37778" 2>/dev/null || xdg-open "http://localhost:37778" 2>/dev/null || true
