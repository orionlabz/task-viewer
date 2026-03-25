# Task Viewer — Claude Code Plugin

Real-time Kanban dashboard that visualizes Claude Code tasks and Superpowers plans.

## Features

- **Live Kanban Board** — See tasks move through Pending → In Progress → Completed in real-time
- **Superpowers Integration** — View specs and plans with progress tracking
- **Session History** — Browse tasks from previous Claude Code sessions
- **Aurora Theme** — Matches the Siderea Aurora visual identity
- **Auto-Lifecycle** — Starts with Claude Code, stops when you exit

## How It Works

The plugin hooks into Claude Code's `SessionStart` and `Stop` events:

1. **On session start:** Launches a local web server on `http://localhost:37778`
2. **During the session:** Watches for task and plan file changes, pushes updates via WebSocket
3. **On session end:** Gracefully shuts down the server

## Data Sources

| Source | Path | Update Method |
|--------|------|--------------|
| Tasks | `~/.claude/tasks/{sessionId}/*.json` | File watcher (real-time) |
| Specs | `docs/superpowers/specs/*.md` | File watcher |
| Plans | `docs/superpowers/plans/*.md` | File watcher |
| History | `~/.claude/sessions/*.json` | REST API (lazy load) |

## Requirements

- Node.js 18+
- Claude Code CLI
- Superpowers plugin (recommended, for spec/plan visualization)

## Troubleshooting

Use the `/task-viewer` skill to check if the server is running.

If the dashboard doesn't start automatically:
1. Check logs: `cat /tmp/task-viewer-*.log`
2. Check if port 37778 is in use: `lsof -i :37778`
3. Start manually: `cd hooks/server && PROJECT_CWD=$PWD node server.mjs`
