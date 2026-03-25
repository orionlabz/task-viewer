# SQLite Task Persistence

## Problem

Task-viewer cannot persist tasks across sessions. Claude Code's task JSON files in `~/.claude/tasks/` are ephemeral — they exist in memory during a session but are cleaned up after. The plugin reads from these files, finds nothing, and shows empty boards. Session history is also lost because the JSON file storage (`data/sessions/`) was never populated (the persistence chain depended on finding tasks on disk).

## Solution

Replace JSON file storage with SQLite and capture task data directly from hook stdin instead of reading from disk.

## Data Flow

```
Claude Code ─── TaskCreate/TaskUpdate ───► PostToolUse hook fires
                                                    │
                                            sync-task.sh reads stdin
                                            extracts tool_input + session_id
                                                    │
                                            curl POST /api/tasks ──────► server.mjs
                                                                              │
                                                                     SQLite INSERT/UPDATE
                                                                              │
                                                                     WebSocket broadcast
                                                                              │
                                                                        Frontend (app.js)
```

Key difference from current approach: **zero dependency on Claude Code's internal task files**. Data flows directly from hook stdin to the server via HTTP.

## SQLite Schema

Single database file: `hooks/server/data/task-viewer.db`

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  project_cwd TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  summary TEXT
);

CREATE TABLE tasks (
  id TEXT NOT NULL,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  active_form TEXT,
  blocks TEXT,       -- JSON array
  blocked_by TEXT,   -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (id, session_id)
);

CREATE INDEX idx_tasks_session ON tasks(session_id);
CREATE INDEX idx_sessions_project ON sessions(project_cwd);
```

Two tables only. `claude_mem` enrichment tables are out of scope (phase 2).

## Hook Changes

### hooks.json

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/start-server.sh",
            "timeout": 30000,
            "statusMessage": "Starting Task Viewer..."
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "TaskCreate|TaskUpdate",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/sync-task.sh",
            "timeout": 5000
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Generate a 1-2 sentence summary of what was accomplished this session. POST using: curl -s -X POST -H 'Content-Type: application/json' -d '{\"sessionId\": \"<current session id>\", \"summary\": \"<your summary>\"}' http://localhost:37778/api/session-context/finalize. Then approve stopping.",
            "timeout": 30000
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/stop-server.sh",
            "timeout": 10000,
            "statusMessage": "Stopping Task Viewer..."
          }
        ]
      }
    ]
  }
}
```

Changes from current:
- `SessionStart` matcher: `*` instead of `startup|clear|compact`
- `PostToolUse` matcher: `TaskCreate|TaskUpdate` instead of just `TaskUpdate`
- `PostToolUse` runs `sync-task.sh` (new) instead of `enrich-task.sh`
- `Stop` only has the prompt hook (summary) — no server kill
- `SessionEnd` (new) handles server shutdown
- Removed `request-context.sh` hook (claude-mem enrichment deferred to phase 2)

### sync-task.sh (new)

Reads the PostToolUse hook stdin and POSTs task data directly to the server:

```bash
#!/bin/bash
input=$(cat 2>/dev/null || echo '{}')

session_id=$(echo "$input" | jq -r '.session_id // empty')
tool_name=$(echo "$input" | jq -r '.tool_name // empty')

# Extract task fields from tool_input and tool_output
task_id=$(echo "$input" | jq -r '.tool_output.id // .tool_input.taskId // empty')
subject=$(echo "$input" | jq -r '.tool_input.subject // empty')
description=$(echo "$input" | jq -r '.tool_input.description // empty')
status=$(echo "$input" | jq -r '.tool_input.status // empty')
active_form=$(echo "$input" | jq -r '.tool_input.activeForm // empty')

# Build JSON payload, only include non-empty fields
payload=$(jq -n \
  --arg sid "$session_id" \
  --arg tid "$task_id" \
  --arg tool "$tool_name" \
  --arg subject "$subject" \
  --arg description "$description" \
  --arg status "$status" \
  --arg active_form "$active_form" \
  '{sessionId: $sid, taskId: $tid, toolName: $tool, subject: $subject, description: $description, status: $status, activeForm: $active_form}')

curl -s -X POST -H 'Content-Type: application/json' \
  -d "$payload" http://localhost:37778/api/tasks 2>/dev/null || true

echo '{}'
```

Zero tokens consumed. Runs as shell, no systemMessage.

### Hook stdin shapes

**TaskCreate:**
```json
{
  "session_id": "uuid",
  "tool_name": "TaskCreate",
  "tool_input": { "subject": "Fix bug", "description": "..." },
  "tool_output": { "id": "1", "subject": "Fix bug", "status": "pending" }
}
```

**TaskUpdate:**
```json
{
  "session_id": "uuid",
  "tool_name": "TaskUpdate",
  "tool_input": { "taskId": "1", "status": "completed" },
  "tool_output": { "id": "1", "subject": "Fix bug", "status": "completed" }
}
```

Task ID: use `tool_output.id` (present in both). For TaskCreate the `tool_input` has no `taskId` — the ID is assigned by Claude and returned in `tool_output`.

## Server Changes

### New endpoint: POST /api/tasks

Receives task data from `sync-task.sh`:

1. Upsert session (create if not exists)
2. For `TaskCreate`: INSERT new task
3. For `TaskUpdate`: UPDATE existing task (merge fields — only overwrite non-empty values)
4. Broadcast `tasks:update` via WebSocket

### Modified endpoint: GET /api/sessions

Query sessions table filtered by `project_cwd`. No longer merges with `~/.claude/sessions/` — the server is the single source of truth for sessions it has seen.

### Modified endpoint: GET /api/sessions/:id

Return session + all its tasks from SQLite.

### Modified endpoint: POST /api/session-context/finalize

Body: `{ sessionId?, summary? }`. If `sessionId` omitted, finalizes the most recent session for the current `PROJECT_CWD`. Sets `ended_at` and optional `summary` on the session row.

### Removed endpoints

- `POST /api/session-context` (claude-mem — phase 2)
- `POST /api/session-context/task` (claude-mem — phase 2)

### storage.mjs rewrite

Replace JSON file read/write with `better-sqlite3`:

```javascript
import Database from 'better-sqlite3';

const db = new Database('data/task-viewer.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run migrations on init
db.exec(`CREATE TABLE IF NOT EXISTS sessions (...)`);
db.exec(`CREATE TABLE IF NOT EXISTS tasks (...)`);

export function upsertSession(id, projectCwd) { ... }
export function upsertTask(sessionId, taskData) { ... }
export function getSession(id) { ... }
export function getSessionTasks(sessionId) { ... }
export function listSessions(projectCwd) { ... }
export function finalizeSession(id, summary) { ... }
```

Synchronous API — `better-sqlite3` is sync and fast. No async/await needed for DB operations.

### Upsert merge strategy

For `upsertTask`: INSERT OR REPLACE with coalesce — only overwrite a column if the new value is non-null/non-empty. This handles TaskUpdate sending partial data (e.g., only `status` changed):

```sql
INSERT INTO tasks (id, session_id, subject, description, status, active_form, blocks, blocked_by, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
ON CONFLICT(id, session_id) DO UPDATE SET
  subject = COALESCE(NULLIF(excluded.subject, ''), tasks.subject),
  description = COALESCE(NULLIF(excluded.description, ''), tasks.description),
  status = COALESCE(NULLIF(excluded.status, ''), tasks.status),
  active_form = COALESCE(NULLIF(excluded.active_form, ''), tasks.active_form),
  blocks = COALESCE(NULLIF(excluded.blocks, ''), tasks.blocks),
  blocked_by = COALESCE(NULLIF(excluded.blocked_by, ''), tasks.blocked_by),
  updated_at = datetime('now');
```

### watchers.mjs simplification

- Remove: reading tasks from `~/.claude/tasks/{sessionId}/*.json`
- Remove: `updateSessionTasks` calls on file change
- Keep: watching `~/.claude/sessions/` for new session detection
- Keep: watching specs/plans directories
- Add: on session change, upsert session in SQLite and broadcast

### package.json

Add dependency: `better-sqlite3`

## Frontend Changes

### app.js

Minimal changes:
- `loadHistory()` already fetches from `/api/sessions` — works as-is
- `toggleHistory()` already fetches from `/api/sessions/:id` — works as-is
- Task rendering already handles the task object shape
- Remove `claudeMemByTask` and `sessionClaudeMem` state (phase 2)
- Remove `handleClaudeMemUpdate` handler (phase 2)
- Remove claude-mem rendering sections from `createTaskCard` (phase 2)

### styles.css

Remove claude-mem section styles (phase 2). Keep everything else.

## Files Changed

| File | Action | What |
|------|--------|------|
| `hooks/hooks.json` | Modify | New matcher, new events, remove enrich-task |
| `hooks/scripts/sync-task.sh` | Create | Direct task POST from hook stdin |
| `hooks/scripts/enrich-task.sh` | Delete | Replaced by sync-task.sh |
| `hooks/scripts/request-context.sh` | Delete | claude-mem deferred to phase 2 |
| `hooks/server/storage.mjs` | Rewrite | SQLite instead of JSON files |
| `hooks/server/server.mjs` | Modify | New POST /api/tasks, remove claude-mem endpoints |
| `hooks/server/watchers.mjs` | Modify | Remove disk task reads, simplify |
| `hooks/server/package.json` | Modify | Add better-sqlite3 |
| `hooks/server/public/app.js` | Modify | Remove claude-mem state/rendering (phase 2) |
| `hooks/server/public/styles.css` | Modify | Remove claude-mem styles (phase 2) |
| `hooks/server/data/sessions/` | Delete | Replaced by SQLite db |

## Edge Cases

| Case | Handling |
|------|---------|
| Server not running when hook POSTs | curl fails silently; task captured on next update |
| Rapid TaskCreate/Update events | Each hook fires independently; SQLite WAL handles concurrent writes |
| Session not yet in DB | `upsertSession` auto-creates on first task POST |
| TaskUpdate before TaskCreate | Upsert creates the task row with available fields |
| Old sessions in data/sessions/ JSON | No migration — directory is empty (confirmed). Delete `data/sessions/` dir. |
| better-sqlite3 native build fails | Fallback: `sql.js` (WASM, no native) — slower but works everywhere |

## Out of Scope (Phase 2)

- claude-mem integration (timeline, observations, related context)
- Session summary via Stop prompt hook (keep the hook but enrichment rendering deferred)
- Specs/plans persistence in SQLite (currently works fine from disk)
