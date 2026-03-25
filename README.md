# OrionLabz — Claude Code Plugin Marketplace

Custom Claude Code plugins by OrionLabz.

## Plugins

### task-viewer

Real-time Kanban dashboard for Claude Code sessions with SQLite persistence and plan tracking.

- Live task board (Pending / In Progress / Completed) updated via WebSocket
- Superpowers spec & plan visualization with progress tracking
- Session history with summaries persisted in SQLite
- Dark/Light Aurora theme
- Auto-starts on `localhost:37778` with Claude Code sessions

**Install:**

```bash
claude plugins add-marketplace orionlabz/task-viewer
claude plugins enable task-viewer@orionlabz
```

## License

MIT
