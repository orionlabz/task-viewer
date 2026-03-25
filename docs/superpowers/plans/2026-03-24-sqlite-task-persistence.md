# SQLite Task Persistence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace JSON file storage with SQLite and capture task data directly from PostToolUse hooks, so tasks persist across sessions.

**Architecture:** PostToolUse hooks on TaskCreate/TaskUpdate run `sync-task.sh` which reads hook stdin and POSTs task data to the server via curl. Server stores in SQLite (`better-sqlite3`). Frontend receives updates via existing WebSocket broadcast.

**Tech Stack:** better-sqlite3, Express, bash/jq (hooks), WebSocket

**Spec:** `docs/superpowers/specs/2026-03-24-sqlite-task-persistence-design.md`

---

### Task 1: Add better-sqlite3 dependency

**Files:**
- Modify: `task-viewer/hooks/server/package.json:9-13`

- [ ] **Step 1: Add better-sqlite3 to dependencies**

```json
"dependencies": {
  "better-sqlite3": "^11",
  "chokidar": "^4",
  "express": "^4",
  "ws": "^8"
}
```

- [ ] **Step 2: Install dependencies**

Run: `cd task-viewer/hooks/server && npm install`
Expected: `better-sqlite3` installed with native bindings, no errors.

- [ ] **Step 3: Commit**

```bash
git add task-viewer/hooks/server/package.json task-viewer/hooks/server/package-lock.json
git commit -m "feat(task-viewer): add better-sqlite3 dependency"
```

---

### Task 2: Rewrite storage.mjs with SQLite

**Files:**
- Rewrite: `task-viewer/hooks/server/storage.mjs`
- Delete: `task-viewer/hooks/server/data/sessions/` (empty dir, replaced by SQLite)

- [ ] **Step 1: Delete the empty data/sessions directory**

```bash
rm -rf task-viewer/hooks/server/data/sessions
```

- [ ] **Step 2: Rewrite storage.mjs**

```javascript
import Database from 'better-sqlite3';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'task-viewer.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --- Migrations ---
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    project_cwd TEXT NOT NULL,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT,
    summary TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_cwd);

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT NOT NULL,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    subject TEXT NOT NULL DEFAULT '',
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    active_form TEXT,
    blocks TEXT,
    blocked_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (id, session_id)
  );
  CREATE INDEX IF NOT EXISTS idx_tasks_session ON tasks(session_id);
`);

// --- Prepared statements ---
const stmts = {
  upsertSession: db.prepare(`
    INSERT INTO sessions (id, project_cwd, started_at)
    VALUES (@id, @projectCwd, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      project_cwd = COALESCE(NULLIF(@projectCwd, ''), sessions.project_cwd)
  `),

  upsertTask: db.prepare(`
    INSERT INTO tasks (id, session_id, subject, description, status, active_form, blocks, blocked_by, updated_at)
    VALUES (@id, @sessionId, @subject, @description, @status, @activeForm, @blocks, @blockedBy, datetime('now'))
    ON CONFLICT(id, session_id) DO UPDATE SET
      subject = COALESCE(NULLIF(excluded.subject, ''), tasks.subject),
      description = COALESCE(NULLIF(excluded.description, ''), tasks.description),
      status = COALESCE(NULLIF(excluded.status, ''), tasks.status),
      active_form = COALESCE(NULLIF(excluded.active_form, ''), tasks.active_form),
      blocks = COALESCE(NULLIF(excluded.blocks, ''), tasks.blocks),
      blocked_by = COALESCE(NULLIF(excluded.blocked_by, ''), tasks.blocked_by),
      updated_at = datetime('now')
  `),

  getSession: db.prepare(`SELECT * FROM sessions WHERE id = ?`),

  getSessionTasks: db.prepare(`SELECT * FROM tasks WHERE session_id = ? ORDER BY CAST(id AS INTEGER)`),

  listSessions: db.prepare(`
    SELECT s.*, COUNT(t.id) as task_count
    FROM sessions s
    LEFT JOIN tasks t ON t.session_id = s.id
    WHERE s.project_cwd = ?
    GROUP BY s.id
    ORDER BY s.started_at DESC
  `),

  finalizeSession: db.prepare(`
    UPDATE sessions SET ended_at = datetime('now'), summary = COALESCE(@summary, sessions.summary)
    WHERE id = @id
  `),

  latestSession: db.prepare(`
    SELECT id FROM sessions WHERE project_cwd = ? ORDER BY started_at DESC LIMIT 1
  `),
};

// --- Public API ---

export function upsertSession(id, projectCwd) {
  stmts.upsertSession.run({ id, projectCwd: projectCwd || '' });
  return stmts.getSession.get(id);
}

export function upsertTask(sessionId, taskData) {
  stmts.upsertTask.run({
    id: taskData.id,
    sessionId,
    subject: taskData.subject || '',
    description: taskData.description || '',
    status: taskData.status || '',
    activeForm: taskData.activeForm || '',
    blocks: taskData.blocks ? JSON.stringify(taskData.blocks) : '',
    blockedBy: taskData.blockedBy ? JSON.stringify(taskData.blockedBy) : '',
  });
}

export function getSession(id) {
  const session = stmts.getSession.get(id);
  if (!session) return null;
  const tasks = getSessionTasks(id);
  return { ...session, tasks };
}

export function getSessionTasks(sessionId) {
  const rows = stmts.getSessionTasks.all(sessionId);
  return rows.map(row => ({
    ...row,
    blocks: row.blocks ? JSON.parse(row.blocks) : [],
    blockedBy: row.blocked_by ? JSON.parse(row.blocked_by) : [],
    activeForm: row.active_form,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sessionId: row.session_id,
  }));
}

export function listSessions(projectCwd) {
  return stmts.listSessions.all(projectCwd).map(row => ({
    sessionId: row.id,
    projectCwd: row.project_cwd,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    summary: row.summary,
    taskCount: row.task_count,
  }));
}

export function finalizeSession(id, summary, projectCwd) {
  let sessionId = id;
  if (!sessionId && projectCwd) {
    const latest = stmts.latestSession.get(projectCwd);
    if (latest) sessionId = latest.id;
  }
  if (!sessionId) return null;
  stmts.finalizeSession.run({ id: sessionId, summary: summary || null });
  return stmts.getSession.get(sessionId);
}
```

- [ ] **Step 3: Add `data/` to .gitignore**

Ensure the SQLite database file is not committed. Check if `.gitignore` exists and add:

```
task-viewer/hooks/server/data/*.db
task-viewer/hooks/server/data/*.db-wal
task-viewer/hooks/server/data/*.db-shm
```

- [ ] **Step 4: Commit**

```bash
git add task-viewer/hooks/server/storage.mjs .gitignore
git commit -m "feat(task-viewer): rewrite storage.mjs with SQLite persistence"
```

---

### Task 3: Update server.mjs — new POST /api/tasks, remove claude-mem endpoints

**Files:**
- Modify: `task-viewer/hooks/server/server.mjs`

- [ ] **Step 1: Replace imports**

Replace the storage imports (lines 8-16) with:

```javascript
import {
  upsertSession,
  upsertTask,
  getSession,
  getSessionTasks,
  listSessions,
  finalizeSession,
} from './storage.mjs';
```

- [ ] **Step 2: Add POST /api/tasks endpoint**

Add after the static middleware (line 29):

```javascript
app.post('/api/tasks', (req, res) => {
  try {
    const { sessionId, taskId, toolName, subject, description, status, activeForm } = req.body;
    if (!sessionId || !taskId) return res.status(400).json({ error: 'sessionId and taskId required' });

    // Auto-create session if needed
    upsertSession(sessionId, PROJECT_CWD);

    // Upsert the task
    upsertTask(sessionId, { id: taskId, subject, description, status, activeForm });

    // Broadcast updated task list
    const tasks = getSessionTasks(sessionId);
    broadcast('tasks:update', { tasks, sessionId });

    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    res.status(500).json({ error: 'failed to sync task' });
  }
});
```

- [ ] **Step 3: Replace GET /api/sessions endpoint**

Replace lines 78-99 with:

```javascript
app.get('/api/sessions', (_req, res) => {
  try {
    const sessions = listSessions(PROJECT_CWD);
    res.json(sessions);
  } catch (err) {
    console.error('GET /api/sessions error:', err);
    res.status(500).json({ error: 'failed to list sessions' });
  }
});
```

- [ ] **Step 4: Replace GET /api/sessions/:id endpoint**

Replace lines 101-114 with:

```javascript
app.get('/api/sessions/:sessionId', (req, res) => {
  try {
    const session = getSession(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'session not found' });
    res.json(session);
  } catch (err) {
    console.error('GET /api/sessions/:id error:', err);
    res.status(500).json({ error: 'failed to load session' });
  }
});
```

- [ ] **Step 5: Simplify POST /api/session-context/finalize**

Replace lines 60-76 with:

```javascript
app.post('/api/session-context/finalize', (req, res) => {
  try {
    const { sessionId, summary } = req.body || {};
    const session = finalizeSession(sessionId, summary, PROJECT_CWD);
    if (!session) return res.status(400).json({ error: 'no session to finalize' });
    res.json({ ok: true, session });
  } catch (err) {
    console.error('POST /api/session-context/finalize error:', err);
    res.status(500).json({ error: 'failed to finalize session' });
  }
});
```

- [ ] **Step 6: Remove claude-mem POST endpoints**

Delete the `POST /api/session-context` endpoint (lines 33-44) and the `POST /api/session-context/task` endpoint (lines 46-58). These are deferred to phase 2.

- [ ] **Step 7: Simplify shutdown handler**

Replace the `shutdown` function (lines 159-177) with:

```javascript
async function shutdown() {
  console.log('Shutting down Task Viewer...');
  // Finalize active session if watchers tracked one
  if (watchers.activeSessionId) {
    try {
      finalizeSession(watchers.activeSessionId, null, PROJECT_CWD);
    } catch (err) {
      console.error('Failed to finalize session on shutdown:', err);
    }
  }
  watchers.close().then(() => {
    server.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 3000);
}
```

- [ ] **Step 8: Remove unused parsers import**

Remove `loadSessionTasks` from the imports on line 7 (it's no longer used in server.mjs).

- [ ] **Step 9: Commit**

```bash
git add task-viewer/hooks/server/server.mjs
git commit -m "feat(task-viewer): add POST /api/tasks, replace storage with SQLite queries"
```

---

### Task 4: Simplify watchers.mjs — remove disk task reads

**Files:**
- Modify: `task-viewer/hooks/server/watchers.mjs`

- [ ] **Step 1: Remove task-related imports**

Replace imports (lines 4-10) — remove `loadSessionTasks` and `updateSessionTasks`:

```javascript
import {
  loadAllSpecs,
  loadAllPlans,
  linkSpecsAndPlans,
  discoverProjectSessions,
} from './parsers.mjs';
```

- [ ] **Step 2: Remove `updateSessionTasks` import from storage**

Delete line 11: `import { updateSessionTasks } from './storage.mjs';`

- [ ] **Step 3: Add upsertSession import**

```javascript
import { upsertSession } from './storage.mjs';
```

- [ ] **Step 4: Simplify `_emitTasks`**

Replace the `_emitTasks` method (lines 86-97) with:

```javascript
async _emitTasks() {
  // Tasks now come via POST /api/tasks from hooks, not from disk.
  // This method only broadcasts the current session ID.
  this.onUpdate('tasks:update', { tasks: [], sessionId: this.activeSessionId });
}
```

- [ ] **Step 5: Update `_checkNewSession` to upsert into SQLite**

Replace lines 74-84:

```javascript
async _checkNewSession() {
  const sessions = await discoverProjectSessions(this.projectCwd);
  if (sessions.length === 0) return;
  const latest = sessions[0];
  if (latest.sessionId !== this.activeSessionId) {
    this.activeSessionId = latest.sessionId;
    // Register session in SQLite
    upsertSession(this.activeSessionId, this.projectCwd);
    this.onUpdate('session:change', { sessionId: this.activeSessionId });
  }
}
```

- [ ] **Step 6: Remove `_watchTasks` method and its calls**

Delete the `_watchTasks` method (lines 64-72) and remove its call from `start()` (lines 37-39).

- [ ] **Step 7: Simplify `start()` — register initial session in SQLite**

Replace lines 31-52:

```javascript
async start() {
  const sessions = await discoverProjectSessions(this.projectCwd);
  if (sessions.length > 0) {
    this.activeSessionId = sessions[0].sessionId;
    upsertSession(this.activeSessionId, this.projectCwd);
  }

  const specsDir = join(this.projectCwd, 'docs', 'superpowers', 'specs');
  this._watch(specsDir, '*.md', debounce(() => this._emitSpecsPlans(), 200));

  const plansDir = join(this.projectCwd, 'docs', 'superpowers', 'plans');
  this._watch(plansDir, '*.md', debounce(() => this._emitSpecsPlans(), 200));

  const sessionsDir = join(CLAUDE_DIR, 'sessions');
  this._watch(sessionsDir, '*.json', debounce(() => this._checkNewSession(), 200));

  await this._emitTasks();
  await this._emitSpecsPlans();
}
```

- [ ] **Step 8: Commit**

```bash
git add task-viewer/hooks/server/watchers.mjs
git commit -m "refactor(task-viewer): remove disk task reads from watchers, use SQLite"
```

---

### Task 5: Create sync-task.sh hook script

**Files:**
- Create: `task-viewer/hooks/scripts/sync-task.sh`

- [ ] **Step 1: Create the script**

```bash
#!/bin/bash
input=$(cat 2>/dev/null || echo '{}')

session_id=$(echo "$input" | jq -r '.session_id // empty')
tool_name=$(echo "$input" | jq -r '.tool_name // empty')

# Extract task fields from tool_input and tool_output
task_id=$(echo "$input" | jq -r '.tool_output.id // .tool_input.taskId // empty')
subject=$(echo "$input" | jq -r '.tool_output.subject // .tool_input.subject // empty')
description=$(echo "$input" | jq -r '.tool_input.description // empty')
status=$(echo "$input" | jq -r '.tool_output.status // .tool_input.status // empty')
active_form=$(echo "$input" | jq -r '.tool_input.activeForm // empty')

# Skip if missing required fields
if [ -z "$session_id" ] || [ -z "$task_id" ]; then
  echo '{}'
  exit 0
fi

# Build JSON payload
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

- [ ] **Step 2: Make executable**

```bash
chmod +x task-viewer/hooks/scripts/sync-task.sh
```

- [ ] **Step 3: Commit**

```bash
git add task-viewer/hooks/scripts/sync-task.sh
git commit -m "feat(task-viewer): add sync-task.sh for direct task capture from hooks"
```

---

### Task 6: Update hooks.json

**Files:**
- Modify: `task-viewer/hooks/hooks.json`

- [ ] **Step 1: Replace hooks.json with spec version**

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

- [ ] **Step 2: Delete old scripts no longer referenced**

```bash
rm task-viewer/hooks/scripts/enrich-task.sh
rm task-viewer/hooks/scripts/request-context.sh
```

- [ ] **Step 3: Commit**

```bash
git add task-viewer/hooks/hooks.json
git rm task-viewer/hooks/scripts/enrich-task.sh task-viewer/hooks/scripts/request-context.sh
git commit -m "feat(task-viewer): update hooks for direct task sync, remove claude-mem hooks"
```

---

### Task 7: Clean up frontend — remove claude-mem code (phase 2 prep)

**Files:**
- Modify: `task-viewer/hooks/server/public/app.js`

- [ ] **Step 1: Remove claude-mem state variables**

Remove lines 8-9:

```javascript
let claudeMemByTask = {}; // taskId -> { observations, relatedContext, timeline }
let sessionClaudeMem = null; // session-level claude-mem data
```

- [ ] **Step 2: Remove handleClaudeMemUpdate handler**

Delete the `handleClaudeMemUpdate` function (lines 69-84) and remove its case from the WebSocket switch (line 48):

```javascript
case 'claudemem:update': handleClaudeMemUpdate(msg.data); break;
```

- [ ] **Step 3: Remove claude-mem rendering from createTaskCard**

Delete the claude-mem enrichment sections from `createTaskCard` (lines 192-231) — the block starting with `const cm = claudeMemByTask[task.id];`.

- [ ] **Step 4: Remove renderHistoryClaudeMem**

Delete the `renderHistoryClaudeMem` function (lines 465-496) and remove its call from `toggleHistory` (line 456):

Change:
```javascript
body.innerHTML = renderHistoryKanban(tasks) + renderHistoryClaudeMem(session);
```
To:
```javascript
body.innerHTML = renderHistoryKanban(tasks);
```

- [ ] **Step 5: Commit**

```bash
git add task-viewer/hooks/server/public/app.js
git commit -m "refactor(task-viewer): remove claude-mem frontend code, deferred to phase 2"
```

---

### Task 8: Remove claude-mem styles from CSS

**Files:**
- Modify: `task-viewer/hooks/server/public/styles.css`

- [ ] **Step 1: Remove all `.cm-` prefixed CSS rules**

Search for and delete all rules with selectors starting with `.cm-` (cm-section, cm-section-header, cm-section-body, cm-icon, cm-count, cm-timeline-entry, cm-time, cm-observation, cm-context, cm-source, cm-badge).

- [ ] **Step 2: Commit**

```bash
git add task-viewer/hooks/server/public/styles.css
git commit -m "refactor(task-viewer): remove claude-mem styles, deferred to phase 2"
```

---

### Task 9: End-to-end verification

- [ ] **Step 1: Kill any running server**

```bash
lsof -ti:37778 | xargs kill 2>/dev/null || true
```

- [ ] **Step 2: Install deps and start server**

```bash
cd task-viewer/hooks/server && npm install && PROJECT_CWD="$(pwd)/../../../" node server.mjs
```

Expected: `Task Viewer running at http://localhost:37778`

- [ ] **Step 3: Test POST /api/tasks (simulates sync-task.sh)**

```bash
# Simulate TaskCreate
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"sessionId":"test-123","taskId":"1","toolName":"TaskCreate","subject":"Test task","description":"A test","status":"pending","activeForm":""}' \
  http://localhost:37778/api/tasks

# Simulate TaskUpdate
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"sessionId":"test-123","taskId":"1","toolName":"TaskUpdate","subject":"","description":"","status":"completed","activeForm":""}' \
  http://localhost:37778/api/tasks
```

Expected: `{"ok":true}` for both. Open browser at `http://localhost:37778` — should show the task moving from pending to completed.

- [ ] **Step 4: Test session history**

```bash
curl -s http://localhost:37778/api/sessions | python3 -m json.tool
```

Expected: Array with at least the `test-123` session, `taskCount: 1`.

- [ ] **Step 5: Test finalize**

```bash
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"sessionId":"test-123","summary":"Test session completed"}' \
  http://localhost:37778/api/session-context/finalize
```

Expected: `{"ok":true, "session": {...}}` with `ended_at` set and `summary` populated.

- [ ] **Step 6: Verify SQLite database**

```bash
sqlite3 task-viewer/hooks/server/data/task-viewer.db "SELECT * FROM sessions; SELECT * FROM tasks;"
```

Expected: One session row, one task row with status `completed`.

- [ ] **Step 7: Clean up test data and commit**

```bash
rm task-viewer/hooks/server/data/task-viewer.db
git add -A && git status
```

Verify only expected files are staged. Final commit if needed.
