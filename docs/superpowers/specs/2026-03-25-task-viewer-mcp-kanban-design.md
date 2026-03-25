# Task-Viewer: MCP Server + Kanban UI + Multi-Project Fix

**Date**: 2026-03-25
**Status**: Approved
**Scope**: task-viewer plugin — MCP server, Kanban UI redesign, PROJECT_CWD bug fix

---

## Problem Statement

The task-viewer plugin has three issues to solve:

1. **No active task management**: Claude can only observe tasks passively via PostToolUse hooks. There are no tools for Claude to enrich, classify, or query tasks.
2. **No Kanban visualization**: The current feature-group UI does not map to a project management workflow.
3. **Multi-project bug**: The server locks to the `PROJECT_CWD` of the first project that starts it. Tasks from other projects appear empty or corrupt the session→project mapping in SQLite.

---

## Architecture Overview

```
TaskCreate/TaskUpdate (Claude Code native)
        │
        ▼
PostToolUse Hook (sync-task.sh)
├── Maps status → kanban_column (pending→backlog, in_progress→in_progress, completed→done)
└── POST /api/tasks → SQLite

                    ┌──────────────────────────┐
                    │  Express Server :37778   │
                    │  REST API + WebSocket    │
                    │  Static Kanban UI        │
                    └────────────┬─────────────┘
                                 │ reads/writes
                    ┌────────────▼─────────────┐
                    │     SQLite (task-viewer.db)│
                    └────────────▲─────────────┘
                                 │ reads/writes
                    ┌────────────┴─────────────┐
                    │   MCP Server (stdio)     │
                    │   task_enrich            │
                    │   task_query             │
                    │   task_move              │
                    │   task_dashboard         │
                    │   task_bulk_classify     │
                    └──────────────────────────┘
```

---

## Section 1: MCP Server

### Deployment Model

- **Type**: stdio (local process, managed by Claude Code)
- **Runtime**: Node.js with `@modelcontextprotocol/sdk`
- **Storage**: Shares the same SQLite database as the Express server
- **Registration**: `.mcp.json` at plugin root using `${CLAUDE_PLUGIN_ROOT}`
- **Pattern**: Follows the claude-mem plugin model (`${CLAUDE_PLUGIN_ROOT}/server/mcp-server.mjs`)

### Tools

#### `task_enrich`
Adds or updates metadata on an existing task.

**Input**:
```json
{
  "taskId": "string",
  "sessionId": "string",
  "priority": "low|medium|high|critical (optional)",
  "effort": "trivial|small|medium|large|epic (optional)",
  "component": "string (optional)",
  "tags": ["string"] "(optional)",
  "kanban_column": "backlog|todo|in_progress|done (optional)",
  "feature": "string (optional)"
}
```
**Output**: Updated task object.
**When to use**: After TaskCreate, when Claude has enough context to classify the task.

#### `task_query`
Queries tasks with filters. Returns tasks matching all provided criteria.

**Input**:
```json
{
  "status": "pending|in_progress|completed (optional)",
  "column": "backlog|todo|in_progress|done (optional)",
  "component": "string (optional)",
  "priority": "string (optional)",
  "feature": "string (optional)",
  "sessionId": "string (optional, defaults to current project)",
  "limit": "number (optional, default 50)"
}
```
**Output**: Array of task objects.
**When to use**: When Claude needs project context ("what's in_progress right now?").

#### `task_move`
Moves a task to a specific Kanban column.

**Input**:
```json
{
  "taskId": "string",
  "sessionId": "string",
  "column": "backlog|todo|in_progress|done"
}
```
**Output**: Updated task object.
**When to use**: Explicit promotion/demotion of a task between columns, separate from status changes.

#### `task_dashboard`
Returns a project state snapshot.

**Input**: `{}` (no parameters)
**Output**:
```json
{
  "projectCwd": "/path/to/project",
  "columns": {
    "backlog": { "count": 12, "tasks": [...] },
    "todo": { "count": 4, "tasks": [...] },
    "in_progress": { "count": 3, "tasks": [...] },
    "done": { "count": 47, "tasks": [...] }
  },
  "metrics": {
    "totalTasks": 66,
    "completionRate": 0.71,
    "byComponent": { "auth": 8, "ui": 12, ... },
    "byPriority": { "high": 5, "medium": 10, ... }
  }
}
```
**When to use**: Session start/end summaries, project status requests.

#### `task_bulk_classify`
Classifies multiple tasks in one call. Efficient for batch enrichment.

**Input**:
```json
{
  "tasks": [
    { "taskId": "1", "sessionId": "abc", "priority": "high", "component": "auth" },
    { "taskId": "2", "sessionId": "abc", "effort": "small", "feature": "login-flow" }
  ]
}
```
**Output**: Array of updated task objects.
**When to use**: Beginning of session to classify backlog, or end of session cleanup.

---

## Section 2: Kanban UI

### Layout

Four-column Kanban board replacing the current feature-group view.

```
┌─────────────────────────────────────────────────────────────────┐
│  Task Viewer  [Project: orionlabz]  ●  Session: abc123...  🌙   │
├──────────────┬──────────────┬────────────────┬──────────────────┤
│   BACKLOG    │     TODO     │  IN PROGRESS   │      DONE        │
│     (12)     │     (4)      │      (3)        │     (47) ▶       │
│──────────────│──────────────│────────────────│──────────────────│
│ ┌──────────┐ │ ┌──────────┐ │ ┌────────────┐ │  (collapsed)     │
│ │ Fix auth │ │ │ Add MCP  │ │ │ Kanban UI  │ │                  │
│ │ bug      │ │ │ server   │ │ │ redesign   │ │                  │
│ │ #7 ●high │ │ │ #12 med  │ │ │ #15 ●high  │ │                  │
│ └──────────┘ │ └──────────┘ │ └────────────┘ │                  │
└──────────────┴──────────────┴────────────────┴──────────────────┘
```

### Task Card

Each card displays:
- **Subject** (title, truncated at 2 lines)
- **ID** (`#7`)
- **Priority badge** — only if set: `●critical` (red), `●high` (orange), `●medium` (blue), `●low` (gray)
- **Component tag** — only if set
- **Effort chip** — only if set

**Expanded card** (click to expand):
- Description
- activeForm ("Currently doing...")
- Feature group
- Tags
- Session ID (abbreviated)
- Created/updated timestamps

### Column Behavior

- **Independent scroll** per column
- **Done column** starts collapsed; click header to expand (history can be long)
- **Badge counts** always visible even when Done is collapsed
- **Empty state** per column: "No tasks here" placeholder

### Filters (top bar)

- **Session toggle**: "This session" vs "All sessions"
- **Component filter**: auto-populated chips from existing tasks, multi-select

### Status → Column Mapping

| Claude Code `status` | `kanban_column` | Set by |
|---|---|---|
| `pending` (new) | `backlog` | sync-task.sh hook (default) |
| `pending` (promoted) | `todo` | Claude via `task_move` or `task_enrich` |
| `in_progress` | `in_progress` | sync-task.sh hook (automatic) |
| `completed` | `done` | sync-task.sh hook (automatic) |

The `backlog → todo` transition is intentionally manual — Claude decides when a task is ready to be worked on.

---

## Section 3: Multi-Project Fix

### Root Cause

`start-server.sh` checks server health but not project identity. When started from a different project, it exits early leaving the server locked to the wrong `PROJECT_CWD`. `listFeatures()` filters by CWD, so tasks don't appear.

Secondary issue: `_initialTaskLoad()` in `watchers.mjs` grabs any session with task files and re-associates it with the current project's CWD, corrupting the session→project mapping.

### Fix 1: `/api/health` endpoint

New endpoint on the Express server:

```json
GET /api/health
→ { "status": "ok", "projectCwd": "/path/to/project", "port": 37778 }
```

### Fix 2: `start-server.sh` project check

```bash
RUNNING_CWD=$(curl -sf http://localhost:37778/api/health | jq -r '.projectCwd // ""' 2>/dev/null)

if [ "$RUNNING_CWD" = "$PROJECT_CWD" ]; then
  exit 0  # Same project, nothing to do
fi
# Different project → kill and restart with correct PROJECT_CWD
```

### Fix 3: `_initialTaskLoad` scoped to project

Only sync from sessions already associated with the current `projectCwd` in SQLite. Never grab sessions from other projects.

```js
async _initialTaskLoad() {
  const sessions = await discoverProjectSessions(this.projectCwd);
  if (sessions.length === 0) {
    this.onUpdate('kanban:update', { columns: emptyColumns() });
    return;
  }
  for (const s of sessions) {
    await this._syncTasksFromDisk(s.sessionId);
  }
}
```

---

## Section 4: Integration

### Task Lifecycle (end-to-end)

```
1. Claude: TaskCreate("Fix auth bug")
   └── PostToolUse hook → sync-task.sh
       ├── status: "pending" → kanban_column: "backlog"
       └── POST /api/tasks → SQLite → WebSocket → card in BACKLOG

2. Claude: task_enrich({taskId:"7", priority:"high", component:"auth", kanban_column:"todo"})
   └── MCP Server → SQLite update → WebSocket → card moves to TODO

3. Claude: TaskUpdate({taskId:"7", status:"in_progress"})
   └── PostToolUse hook → kanban_column: "in_progress" → card moves to IN PROGRESS

4. Claude: TaskUpdate({taskId:"7", status:"completed"})
   └── PostToolUse hook → kanban_column: "done" → card moves to DONE
```

### File Structure

```
plugin/task-viewer/
├── .mcp.json                         ← NEW: registers MCP server
├── hooks/
│   ├── hooks.json                    ← updated: same events, SessionStart tweaked
│   └── scripts/
│       ├── start-server.sh           ← fix: PROJECT_CWD check via /api/health
│       ├── stop-server.sh            ← unchanged
│       └── sync-task.sh              ← updated: maps status → kanban_column
└── server/
    ├── mcp-server.mjs                ← NEW: MCP stdio server (5 tools)
    ├── server.mjs                    ← updated: /api/health, kanban endpoints
    ├── storage.mjs                   ← updated: new columns, new query methods
    ├── watchers.mjs                  ← fix: _initialTaskLoad scoped to project
    └── public/
        ├── app.js                    ← rewritten: Kanban UI logic
        ├── index.html                ← updated: 4-column layout
        └── styles.css                ← rewritten: Kanban styles
```

### SQLite Schema Changes

New columns on `tasks` table (incremental migration):

```sql
ALTER TABLE tasks ADD COLUMN kanban_column TEXT NOT NULL DEFAULT 'backlog';
ALTER TABLE tasks ADD COLUMN priority TEXT;
ALTER TABLE tasks ADD COLUMN effort TEXT;
ALTER TABLE tasks ADD COLUMN component TEXT;
ALTER TABLE tasks ADD COLUMN tags TEXT;  -- JSON array

CREATE INDEX IF NOT EXISTS idx_tasks_kanban ON tasks(kanban_column);
CREATE INDEX IF NOT EXISTS idx_tasks_component ON tasks(component);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
```

The existing `metadata` JSON column is preserved for arbitrary extra data. The new columns are for indexed, queryable fields.

### New Dependency

```json
"@modelcontextprotocol/sdk": "^1.0.0"
```

Added to `server/package.json`. The MCP server runs as a separate stdio process managed by Claude Code — no port conflict with Express on 37778.

### What Does Not Change

- Port 37778 for the Express server
- SQLite as the storage engine
- File watcher (chokidar) as the fallback sync mechanism
- PostToolUse hooks as the primary real-time sync path
- `better-sqlite3` as the SQLite driver

---

## Out of Scope

- LanceDB or vector search (no semantic search requirement; Claude classifies via MCP tools)
- Drag-and-drop between columns (tasks are managed by Claude, not by UI interaction)
- Multi-user or remote access
- Notifications or alerts

---

## Success Criteria

1. Tasks created in any project appear in the correct Kanban column in real-time
2. `task_enrich` and `task_move` tools are available to Claude and update the UI via WebSocket
3. `task_dashboard` returns accurate per-column counts and metrics
4. Starting the task-viewer from a different project correctly restarts the server without corrupting existing project data
5. Done column is collapsed by default and expands on click
6. Existing tasks in SQLite are preserved through the migration
