# Task Viewer — Claude Code Plugin

Real-time Kanban dashboard that visualizes Claude Code tasks and plans.

## Features

- **Live Kanban Board** — See tasks move through Pending → In Progress → Completed in real-time
- **Plan Integration** — View Superpowers specs and plans with progress tracking
- **Session Persistence** — SQLite-backed history with summaries from previous sessions
- **Dark/Light Theme** — Aurora theme with toggle and system preference support
- **Auto-Lifecycle** — Starts with Claude Code, stops when you exit

## How It Works

The plugin hooks into Claude Code lifecycle events:

1. **SessionStart:** Launches a local web server on `http://localhost:37778`
2. **PostToolUse (TaskCreate/TaskUpdate):** Syncs task data to the server via REST API
3. **Stop:** Generates and persists a session summary
4. **SessionEnd:** Gracefully shuts down the server

## Data Sources

| Source | Path | Update Method |
|--------|------|--------------|
| Tasks | Synced via PostToolUse hook | REST POST + WebSocket broadcast |
| Specs | `docs/superpowers/specs/*.md` | File watcher |
| Plans | `docs/superpowers/plans/*.md` | File watcher |
| Sessions | SQLite (`task-viewer.db`) | REST API (lazy load) |

## Requirements

- Node.js 18+
- Claude Code CLI

## Troubleshooting

Use the `/task-viewer` skill to check if the server is running.

If the dashboard doesn't start automatically:
1. Check logs: `cat /tmp/task-viewer.log`
2. Check if port 37778 is in use: `lsof -i :37778`
3. Start manually: `cd hooks/server && PROJECT_CWD=$PWD node server.mjs`
