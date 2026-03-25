---
name: task-viewer
description: Use when the user asks about the task viewer dashboard, wants to check if it's running, or needs help troubleshooting the Kanban visualization. Examples: "is the dashboard running?", "open task viewer", "task viewer not working", "check kanban status"
allowed-tools: Bash
---

# Task Viewer Diagnostics

Check if the Task Viewer dashboard is running and accessible.

## Steps

1. Check if the server process is running:
   ```bash
   HASH=$(echo -n "$PWD" | if command -v md5 >/dev/null 2>&1; then md5 -q; else md5sum | cut -d' ' -f1; fi)
   if [ -f /tmp/task-viewer-$HASH.pid ] && kill -0 $(cat /tmp/task-viewer-$HASH.pid) 2>/dev/null; then
     echo "Task Viewer is RUNNING (PID: $(cat /tmp/task-viewer-$HASH.pid))"
     echo "Dashboard: http://localhost:37778"
   else
     echo "Task Viewer is NOT RUNNING"
     echo ""
     echo "To start manually:"
     echo "  cd ${CLAUDE_PLUGIN_ROOT}/hooks/server"
     echo "  PROJECT_CWD=$PWD node server.mjs"
   fi
   ```

2. If running, confirm the dashboard is accessible by checking the port.

3. Report status to the user with the URL if running, or troubleshooting steps if not.
