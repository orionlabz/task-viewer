# Side Panel + List View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent side panel (project stats/task detail) and a Kanban/List view toggle to the task-viewer plugin UI.

**Architecture:** Extend the existing Express+WebSocket server with new SQLite tables and REST endpoints, add two MCP tools, and build the UI features in the existing `app.js`/`styles.css`/`index.html` files. The panel sits as a fixed 240px column to the right of the board area; the list view replaces the board inside the same container on toggle.

**Tech Stack:** Node.js, better-sqlite3, Express, vanilla JS/HTML/CSS, @modelcontextprotocol/sdk

---

## File Map

| File | Changes |
|------|---------|
| `hooks/server/storage.mjs` | New tables, prepared stmts, 4 new export functions |
| `hooks/server/server.mjs` | 5 new REST endpoints; auto-emit status_change on task upsert |
| `hooks/server/mcp-server.mjs` | 2 new MCP tools: `task_annotate`, `session_summarize` |
| `hooks/server/public/index.html` | View toggle buttons; workspace+panel DOM structure |
| `hooks/server/public/styles.css` | `.workspace`, `.side-panel`, `.list-view`, `.panel-*` rules |
| `hooks/server/public/app.js` | currentView, renderListView, panel idle+detail, steps toggle |
| `hooks/scripts/capture-tool-call.sh` | New: captures active tool call → POST to server |
| `hooks/hooks.json` | Add PostToolUse hook for Bash\|Edit\|Write\|Read |

All files are under `task-viewer/` relative to the repo root.

---

### Task 1: Storage — task_events and project_sessions tables

**Files:**
- Modify: `task-viewer/hooks/server/storage.mjs`

- [ ] **Step 1: Add migrations for both new tables at the end of the existing `db.exec(...)` migrations block**

```js
// After the existing incremental migrations block (after the idx_tasks_* CREATE INDEX block, around line 74):
db.exec(`
  CREATE TABLE IF NOT EXISTS task_events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id    TEXT NOT NULL,
    session_id TEXT NOT NULL,
    type       TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_task_events_task ON task_events(task_id, session_id);

  CREATE TABLE IF NOT EXISTS project_sessions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id       TEXT NOT NULL UNIQUE,
    project_cwd      TEXT NOT NULL DEFAULT '',
    summary          TEXT NOT NULL,
    tasks_completed  INTEGER NOT NULL DEFAULT 0,
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_project_sessions_cwd ON project_sessions(project_cwd);
`);
```

- [ ] **Step 2: Add prepared statements inside the `const stmts = { ... }` object**

```js
// Add after the existing `enrichTask` statement:
  insertEvent: db.prepare(`
    INSERT INTO task_events (task_id, session_id, type, content)
    VALUES (@taskId, @sessionId, @type, @content)
  `),

  getTaskEvents: db.prepare(`
    SELECT id, task_id, session_id, type, content, created_at
    FROM task_events
    WHERE task_id = @taskId AND session_id = @sessionId
    ORDER BY created_at ASC
  `),

  getLastEventStatus: db.prepare(`
    SELECT content FROM task_events
    WHERE task_id = @taskId AND session_id = @sessionId AND type = 'status_change'
    ORDER BY created_at DESC LIMIT 1
  `),

  upsertProjectSession: db.prepare(`
    INSERT INTO project_sessions (session_id, project_cwd, summary, tasks_completed)
    VALUES (@sessionId, @projectCwd, @summary, @tasksCompleted)
    ON CONFLICT(session_id) DO UPDATE SET
      summary          = excluded.summary,
      tasks_completed  = excluded.tasks_completed
  `),

  getProjectTimeline: db.prepare(`
    SELECT session_id, summary, tasks_completed, created_at
    FROM project_sessions
    WHERE project_cwd = ?
    ORDER BY created_at DESC
    LIMIT 20
  `),
```

- [ ] **Step 3: Add the four export functions at the bottom of storage.mjs**

```js
export function insertTaskEvent(taskId, sessionId, type, content) {
  const result = stmts.insertEvent.run({
    taskId,
    sessionId,
    type,
    content: typeof content === 'string' ? content : JSON.stringify(content),
  });
  return { id: result.lastInsertRowid };
}

export function getTaskEvents(taskId, sessionId) {
  return stmts.getTaskEvents.all({ taskId, sessionId }).map(row => ({
    id: row.id,
    type: row.type,
    content: (() => { try { return JSON.parse(row.content); } catch { return { text: row.content }; } })(),
    createdAt: row.created_at,
  }));
}

export function upsertProjectSession(sessionId, projectCwd, summary, tasksCompleted) {
  stmts.upsertProjectSession.run({ sessionId, projectCwd: projectCwd || '', summary, tasksCompleted: tasksCompleted || 0 });
}

export function getProjectTimeline(projectCwd) {
  return stmts.getProjectTimeline.all(projectCwd).map(row => ({
    sessionId: row.session_id,
    summary: row.summary,
    tasksCompleted: row.tasks_completed,
    createdAt: row.created_at,
  }));
}
```

- [ ] **Step 4: Expose `getLastEventStatus` for internal use (used in Task 2) — add a helper in storage.mjs**

```js
export function getLastStatusEvent(taskId, sessionId) {
  const row = stmts.getLastEventStatus.get({ taskId, sessionId });
  if (!row) return null;
  try { return JSON.parse(row.content); } catch { return null; }
}
```

- [ ] **Step 5: Verify tables are created**

```bash
cd task-viewer/hooks/server
node -e "import('./storage.mjs').then(m => { console.log('storage loaded ok'); process.exit(0); })"
```

Expected: `storage loaded ok` (no errors)

- [ ] **Step 6: Commit**

```bash
git add task-viewer/hooks/server/storage.mjs
git commit -m "feat(task-viewer): add task_events and project_sessions storage layer"
```

---

### Task 2: Server — new REST endpoints

**Files:**
- Modify: `task-viewer/hooks/server/server.mjs`

- [ ] **Step 1: Update imports at the top of server.mjs to include the new storage functions**

```js
// Replace the existing import block with:
import {
  upsertSession,
  upsertTask,
  getSession,
  getSessionTasks,
  listSessions,
  listKanban,
  enrichTask,
  moveTask,
  getDashboard,
  finalizeSession,
  insertTaskEvent,
  getTaskEvents,
  getLastStatusEvent,
  upsertProjectSession,
  getProjectTimeline,
} from './storage.mjs';
```

- [ ] **Step 2: Add auto status_change event emission inside the existing `POST /api/tasks` handler**

Find this section in the handler (after `upsertTask(sessionId, ...)`):

```js
// Add after the upsertTask call, before broadcast:
if (status) {
  const last = getLastStatusEvent(taskId, sessionId);
  if (!last || last.to !== status) {
    insertTaskEvent(taskId, sessionId, 'status_change', { from: last?.to || null, to: status });
  }
}
```

- [ ] **Step 3: Add `GET /api/tasks/:id/events` — before `const server = createServer(app)` line**

```js
app.get('/api/tasks/:id/events', (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'sessionId query param required' });
    const events = getTaskEvents(req.params.id, sessionId);
    res.json(events);
  } catch (err) {
    console.error('GET /api/tasks/:id/events error:', err);
    res.status(500).json({ error: 'failed to load events' });
  }
});
```

- [ ] **Step 4: Add `POST /api/tasks/:id/notes` — user annotations**

```js
app.post('/api/tasks/:id/notes', (req, res) => {
  try {
    const { sessionId, text } = req.body || {};
    if (!sessionId || !text?.trim()) return res.status(400).json({ error: 'sessionId and text required' });
    const event = insertTaskEvent(req.params.id, sessionId, 'user_note', { text: text.trim() });
    res.json({ ok: true, eventId: event.id });
  } catch (err) {
    console.error('POST /api/tasks/:id/notes error:', err);
    res.status(500).json({ error: 'failed to save note' });
  }
});
```

- [ ] **Step 5: Add `POST /api/events/tool-call` — internal hook endpoint**

```js
app.post('/api/events/tool-call', (req, res) => {
  try {
    const { taskId, sessionId, tool, inputSummary } = req.body || {};
    if (!taskId || !sessionId || !tool) return res.status(400).json({ error: 'taskId, sessionId and tool required' });
    insertTaskEvent(taskId, sessionId, 'tool_call', { tool, input_summary: inputSummary || '' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'failed to record tool call' });
  }
});
```

- [ ] **Step 6: Add `GET /api/project/timeline`**

```js
app.get('/api/project/timeline', (_req, res) => {
  try {
    const timeline = getProjectTimeline(PROJECT_CWD);
    res.json(timeline);
  } catch (err) {
    console.error('GET /api/project/timeline error:', err);
    res.status(500).json({ error: 'failed to load timeline' });
  }
});
```

- [ ] **Step 7: Add static imports for `fs` and `os` at the top of server.mjs (alongside existing imports)**

```js
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
```

- [ ] **Step 8: Add `PATCH /api/tasks/:id/steps` handler**

```js
app.patch('/api/tasks/:id/steps', (req, res) => {
  try {
    const { sessionId, index, checked } = req.body || {};
    if (sessionId === undefined || index === undefined || checked === undefined) {
      return res.status(400).json({ error: 'sessionId, index and checked required' });
    }
    const tasks = getSessionTasks(sessionId);
    const task = tasks.find(t => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: 'task not found' });

    const description = task.description || '';
    const lines = description.split('\n');
    let stepIdx = 0;
    const updated = lines.map(line => {
      const isStep = /^- \[[ x]\] /.test(line);
      if (!isStep) return line;
      if (stepIdx === index) {
        stepIdx++;
        return checked ? line.replace(/^- \[ \] /, '- [x] ') : line.replace(/^- \[x\] /, '- [ ] ');
      }
      stepIdx++;
      return line;
    });
    const newDescription = updated.join('\n');

    // Update DB via upsertTask — COALESCE preserves other fields, non-empty description will save
    upsertTask(sessionId, {
      id: req.params.id,
      subject: task.subject,
      description: newDescription,
      status: task.status,
      activeForm: task.activeForm,
      kanban_column: task.kanbanColumn,
      priority: task.priority,
      effort: task.effort,
      component: task.component,
      tags: task.tags,
    });

    // Write back to source task file so file-watcher re-sync preserves the toggle
    const taskFilePath = `${homedir()}/.claude/tasks/${sessionId}/${req.params.id}.json`;
    if (existsSync(taskFilePath)) {
      const taskFile = JSON.parse(readFileSync(taskFilePath, 'utf8'));
      taskFile.description = newDescription;
      writeFileSync(taskFilePath, JSON.stringify(taskFile, null, 2));
    }

    res.json({ ok: true, description: newDescription });
  } catch (err) {
    console.error('PATCH /api/tasks/:id/steps error:', err);
    res.status(500).json({ error: 'failed to toggle step' });
  }
});
```

**Actually** — the PATCH handler should NOT use a dynamic import. The import statement goes at the top of the file. Replace the `import { readFileSync, writeFileSync, existsSync } from 'node:fs'` and `import { homedir } from 'node:os'` as static top-level imports alongside the existing imports.

- [ ] **Step 9: Add git branch to `/api/health` — update the existing health handler**

```js
import { execSync } from 'node:child_process';

// In GET /api/health handler, replace:
//   res.json({ status: 'ok', projectCwd: PROJECT_CWD, port: PORT });
// with:
app.get('/api/health', (_req, res) => {
  let branch = '—';
  try { branch = execSync('git -C . rev-parse --abbrev-ref HEAD', { cwd: PROJECT_CWD, timeout: 2000 }).toString().trim(); } catch {}
  res.json({ status: 'ok', projectCwd: PROJECT_CWD, port: PORT, branch });
});
```

Also add `import { execSync } from 'node:child_process';` to the top-level imports in server.mjs.

- [ ] **Step 10: Restart server and verify all endpoints respond**

```bash
# Kill running server (if any)
pkill -f "node.*server.mjs" 2>/dev/null || true
cd task-viewer/hooks/server
node server.mjs &
sleep 1

# Test new endpoints
curl -s http://localhost:37778/api/health
curl -s http://localhost:37778/api/project/timeline | head -c 100
curl -s "http://localhost:37778/api/tasks/1/events?sessionId=test" | head -c 100
```

Expected: health returns JSON with `branch` field; others return JSON arrays

- [ ] **Step 11: Test notes endpoint**

```bash
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"sessionId":"test","text":"hello note"}' \
  http://localhost:37778/api/tasks/1/notes
```

Expected: `{"error":"task not found"}` or `{"ok":true,...}` — either is fine, confirms JSON response

- [ ] **Step 12: Commit**

```bash
git add task-viewer/hooks/server/server.mjs
git commit -m "feat(task-viewer): add task events, notes, timeline, and steps REST endpoints"
```

---

### Task 3: MCP — task_annotate and session_summarize tools

**Files:**
- Modify: `task-viewer/hooks/server/mcp-server.mjs`

- [ ] **Step 1: Add new imports at the top of mcp-server.mjs**

Find the existing import line from storage.mjs and add the new functions:

```js
// Find: import { listKanban, enrichTask, moveTask, getDashboard, getSessionTasks } from './storage.mjs';
// Replace with:
import { listKanban, enrichTask, moveTask, getDashboard, getSessionTasks, insertTaskEvent, upsertProjectSession } from './storage.mjs';
```

- [ ] **Step 2: Add `task_annotate` to the tools list array**

```js
// Add after the existing task_bulk_classify tool definition, inside the tools array:
{
  name: 'task_annotate',
  description: 'Add a note to a task on behalf of Claude. Use to record observations, decisions, or progress during task execution.',
  inputSchema: {
    type: 'object',
    properties: {
      taskId:    { type: 'string', description: 'Task ID (e.g. "7")' },
      sessionId: { type: 'string', description: 'Session ID of the task' },
      note:      { type: 'string', description: 'The note to add (2-3 sentences max)' },
    },
    required: ['taskId', 'sessionId', 'note'],
  },
},
{
  name: 'session_summarize',
  description: 'Record a summary of this session in the project timeline. Call at the end of a session to log what was accomplished.',
  inputSchema: {
    type: 'object',
    properties: {
      summary:         { type: 'string', description: '1-2 sentence summary of session work' },
      tasksCompleted:  { type: 'number', description: 'Number of tasks moved to done this session', default: 0 },
    },
    required: ['summary'],
  },
},
```

- [ ] **Step 3: Add handlers for both tools inside the `server.setRequestHandler(CallToolRequestSchema, ...)` switch/if block**

Find the existing tool dispatch logic (likely a series of `if (name === 'task_enrich')` checks or a switch). Add:

```js
if (name === 'task_annotate') {
  const { taskId, sessionId, note } = args;
  if (!taskId || !sessionId || !note?.trim()) {
    return { content: [{ type: 'text', text: JSON.stringify({ ok: false, error: 'taskId, sessionId and note required' }) }] };
  }
  const event = insertTaskEvent(taskId, sessionId, 'claude_note', { text: note.trim(), tool: 'task_annotate' });
  return { content: [{ type: 'text', text: JSON.stringify({ ok: true, eventId: event.id }) }] };
}

if (name === 'session_summarize') {
  const { summary, tasksCompleted = 0 } = args;
  if (!summary?.trim()) {
    return { content: [{ type: 'text', text: JSON.stringify({ ok: false, error: 'summary required' }) }] };
  }
  const sessionId = process.env.CLAUDE_SESSION_ID || `session-${Date.now()}`;
  const projectCwd = process.env.PROJECT_CWD || process.cwd();
  upsertProjectSession(sessionId, projectCwd, summary.trim(), tasksCompleted);
  return { content: [{ type: 'text', text: JSON.stringify({ ok: true, sessionId }) }] };
}
```

- [ ] **Step 4: Verify MCP server lists new tools**

```bash
cd task-viewer/hooks/server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node mcp-server.mjs | python3 -c "import sys,json; tools=json.load(sys.stdin)['result']['tools']; print([t['name'] for t in tools])"
```

Expected output includes: `[..., 'task_annotate', 'session_summarize']`

- [ ] **Step 5: Commit**

```bash
git add task-viewer/hooks/server/mcp-server.mjs
git commit -m "feat(task-viewer): add task_annotate and session_summarize MCP tools"
```

---

### Task 4: Hook — capture tool calls

**Files:**
- Create: `task-viewer/hooks/scripts/capture-tool-call.sh`
- Modify: `task-viewer/hooks/hooks.json`

- [ ] **Step 1: Create capture-tool-call.sh**

```bash
cat > task-viewer/hooks/scripts/capture-tool-call.sh << 'SCRIPT'
#!/bin/bash
input=$(cat 2>/dev/null || echo '{}')

session_id=$(echo "$input" | jq -r '.session_id // empty')
tool_name=$(echo "$input" | jq -r '.tool_name // empty')

# Skip if missing session
if [ -z "$session_id" ] || [ -z "$tool_name" ]; then
  echo '{}'; exit 0
fi

# Find first in_progress task for this session
in_progress=$(curl -s "http://localhost:37778/api/kanban" 2>/dev/null \
  | jq -r --arg sid "$session_id" \
    '.in_progress // [] | map(select(.sessionId == $sid)) | first | .id // empty')

if [ -z "$in_progress" ]; then
  echo '{}'; exit 0
fi

# Build input summary per tool type
case "$tool_name" in
  Bash)  summary=$(echo "$input" | jq -r '.tool_input.command // "" | .[:80]') ;;
  Edit)  summary=$(echo "$input" | jq -r '.tool_input.file_path // ""') ;;
  Write) summary=$(echo "$input" | jq -r '.tool_input.file_path // ""') ;;
  Read)  summary=$(echo "$input" | jq -r '.tool_input.file_path // ""') ;;
  *)     summary="$tool_name" ;;
esac

payload=$(jq -n \
  --arg tid "$in_progress" \
  --arg sid "$session_id" \
  --arg tool "$tool_name" \
  --arg summary "$summary" \
  '{taskId: $tid, sessionId: $sid, tool: $tool, inputSummary: $summary}')

curl -s -X POST -H 'Content-Type: application/json' \
  -d "$payload" http://localhost:37778/api/events/tool-call 2>/dev/null || true

echo '{}'
SCRIPT
chmod +x task-viewer/hooks/scripts/capture-tool-call.sh
```

- [ ] **Step 2: Add the PostToolUse hook entry in hooks.json**

Add a new entry inside the `PostToolUse` array, after the existing `TaskCreate|TaskUpdate` hook:

```json
{
  "matcher": "Bash|Edit|Write|Read",
  "hooks": [
    {
      "type": "command",
      "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/capture-tool-call.sh",
      "timeout": 5000
    }
  ]
}
```

- [ ] **Step 3: Verify the script is executable and syntax is valid**

```bash
bash -n task-viewer/hooks/scripts/capture-tool-call.sh && echo "syntax ok"
```

Expected: `syntax ok`

- [ ] **Step 4: Commit**

```bash
git add task-viewer/hooks/scripts/capture-tool-call.sh task-viewer/hooks/hooks.json
git commit -m "feat(task-viewer): capture tool calls as task events via PostToolUse hook"
```

---

### Task 5: HTML — workspace + panel skeleton

**Files:**
- Modify: `task-viewer/hooks/server/public/index.html`

- [ ] **Step 1: Add view toggle buttons to the toolbar, in `.toolbar-left` after `.session-badge`**

```html
<!-- Add after the <span class="session-badge" ...> line: -->
<div class="view-toggle" id="view-toggle">
  <button class="view-btn active" id="view-kanban" aria-pressed="true" title="Kanban view">⊞</button>
  <button class="view-btn" id="view-list" aria-pressed="false" title="List view">≡</button>
</div>
```

- [ ] **Step 2: Replace `<main class="board">` and its contents with a workspace wrapper that holds the board AND the panel**

```html
<!-- Replace:
  <main class="board">
    ...four columns...
  </main>
with: -->
<div class="workspace">
  <main class="board" id="board">
    <div class="column" id="col-backlog">
      <div class="column-header">
        <span class="column-title">Backlog</span>
        <span class="column-count" id="count-backlog">0</span>
      </div>
      <div class="column-body" id="cards-backlog">
        <div class="empty-state">No tasks here</div>
      </div>
    </div>

    <div class="column" id="col-todo">
      <div class="column-header">
        <span class="column-title">Todo</span>
        <span class="column-count" id="count-todo">0</span>
      </div>
      <div class="column-body" id="cards-todo">
        <div class="empty-state">No tasks here</div>
      </div>
    </div>

    <div class="column" id="col-in_progress">
      <div class="column-header">
        <span class="column-title">In Progress</span>
        <span class="column-count" id="count-in_progress">0</span>
      </div>
      <div class="column-body" id="cards-in_progress">
        <div class="empty-state">No tasks here</div>
      </div>
    </div>

    <div class="column collapsed" id="col-done">
      <div class="column-header" id="done-header" role="button" tabindex="0" aria-expanded="false">
        <span class="column-title">Done</span>
        <span class="column-count" id="count-done">0</span>
        <span class="collapse-chevron">▶</span>
      </div>
      <div class="column-body hidden" id="cards-done">
        <div class="empty-state">No tasks here</div>
      </div>
    </div>
  </main>

  <!-- List view (hidden by default) -->
  <div class="list-view hidden" id="list-view"></div>

  <!-- Persistent side panel -->
  <aside class="side-panel" id="side-panel">
    <!-- Idle state: project stats + timeline -->
    <div class="panel-idle" id="panel-idle">
      <div class="panel-header">
        <div class="panel-project-name" id="panel-project-name">—</div>
        <div class="panel-branch" id="panel-branch">—</div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Estatísticas</div>
        <div class="panel-stats-grid">
          <div class="stat-cell">
            <div class="stat-value stat-done" id="stat-done">0</div>
            <div class="stat-label">concluídas</div>
          </div>
          <div class="stat-cell">
            <div class="stat-value stat-progress" id="stat-progress">0</div>
            <div class="stat-label">em progresso</div>
          </div>
          <div class="stat-cell">
            <div class="stat-value stat-pct" id="stat-pct">0%</div>
            <div class="stat-label">completion</div>
          </div>
          <div class="stat-cell">
            <div class="stat-value stat-sessions" id="stat-sessions">0</div>
            <div class="stat-label">sessões</div>
          </div>
        </div>
      </div>
      <div class="panel-section panel-section-grow">
        <div class="panel-section-title">Timeline do Projeto</div>
        <div class="panel-timeline" id="panel-timeline">
          <div class="timeline-empty">Nenhuma sessão registrada ainda.</div>
        </div>
      </div>
    </div>

    <!-- Task detail state (hidden until task selected) -->
    <div class="panel-detail hidden" id="panel-detail">
      <div class="panel-header panel-header-detail">
        <div class="panel-detail-title" id="detail-title">—</div>
        <button class="panel-close" id="panel-close" title="Close">✕</button>
        <div class="panel-detail-badges" id="detail-badges"></div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Detalhes</div>
        <div class="panel-detail-meta" id="detail-meta"></div>
      </div>
      <div class="panel-section" id="steps-section">
        <div class="panel-section-title">Steps</div>
        <div class="panel-steps" id="detail-steps"></div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Suas Anotações</div>
        <div class="panel-user-notes" id="user-notes-list"></div>
        <textarea class="panel-note-input" id="note-input" placeholder="Adicionar anotação..." rows="2"></textarea>
        <button class="panel-note-save" id="note-save">Salvar</button>
        <div class="panel-note-error hidden" id="note-error"></div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Anotações do Claude</div>
        <div class="panel-claude-notes" id="claude-notes-list"></div>
      </div>
      <div class="panel-tabs">
        <button class="panel-tab active" id="tab-progress" data-tab="progress">Progresso</button>
        <button class="panel-tab" id="tab-execution" data-tab="execution">Execução</button>
      </div>
      <div class="panel-tab-content" id="tab-content-progress"></div>
      <div class="panel-tab-content hidden" id="tab-content-execution"></div>
    </div>
  </aside>
</div>
```

- [ ] **Step 3: Verify the file is valid HTML (no unclosed tags)**

```bash
node -e "const fs=require('fs'); const h=fs.readFileSync('task-viewer/hooks/server/public/index.html','utf8'); console.log('lines:', h.split('\n').length, 'ok')"
```

Expected: prints line count without error

- [ ] **Step 4: Commit**

```bash
git add task-viewer/hooks/server/public/index.html
git commit -m "feat(task-viewer): add workspace layout, view toggle, and side panel HTML"
```

---

### Task 6: CSS — workspace, list view, and panel styles

**Files:**
- Modify: `task-viewer/hooks/server/public/styles.css`

- [ ] **Step 1: Replace `.board { ... }` rule with `.workspace` + `.board` to wrap the new layout**

```css
/* === Layout === */
.app { display: flex; flex-direction: column; height: 100vh; }

.workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.board {
  display: flex;
  flex: 1;
  gap: 10px;
  padding: 12px;
  overflow: hidden;
  background: var(--bg);
}
```

- [ ] **Step 2: Add view toggle styles (add after the `.theme-btn:hover` rule)**

```css
/* === View Toggle === */
.view-toggle {
  display: flex;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  border-radius: 7px;
  overflow: hidden;
  flex-shrink: 0;
}
.view-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--text3);
  padding: 4px 9px;
  transition: color .15s, background .15s;
  line-height: 1;
}
.view-btn:hover { color: var(--text2); background: rgba(255,255,255,0.05); }
.view-btn.active { color: var(--accent); background: var(--accent-muted); }
```

- [ ] **Step 3: Add list view styles (add after the card styles section)**

```css
/* === List View === */
.list-view {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-section {
  border-radius: var(--radius);
  border: 1px solid var(--border);
  overflow: hidden;
  background: var(--surface);
}

.list-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .7px;
  color: var(--text2);
  cursor: pointer;
  user-select: none;
  position: relative;
  overflow: hidden;
}
.list-section-header::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
}
.list-section[data-col="backlog"]  .list-section-header::before { background: linear-gradient(90deg, var(--col-backlog), transparent 80%); }
.list-section[data-col="todo"]     .list-section-header::before { background: linear-gradient(90deg, var(--col-todo), transparent 80%); }
.list-section[data-col="in_progress"] .list-section-header::before { background: linear-gradient(90deg, var(--col-progress), transparent 80%); }
.list-section[data-col="done"]     .list-section-header::before { background: linear-gradient(90deg, var(--col-done), transparent 80%); }

.list-section-count {
  background: rgba(255,255,255,0.07);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 1px 7px;
  font-size: 10px;
  color: var(--text2);
}
.list-section-chevron {
  margin-left: auto;
  font-size: 9px;
  opacity: .5;
  transition: transform .15s;
}
.list-section:not(.collapsed) .list-section-chevron { transform: rotate(90deg); opacity: .7; }

.list-rows { display: flex; flex-direction: column; }

.list-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-top: 1px solid var(--border);
  cursor: pointer;
  transition: background .12s;
  font-size: 12px;
}
.list-row:hover { background: var(--card-hover); }
.list-row.selected { background: var(--accent-muted); }

.list-row-title { flex: 1; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.list-row-comp { font-size: 11px; color: var(--text3); flex-shrink: 0; }
.list-row-priority { font-size: 10px; padding: 1px 6px; border-radius: 4px; flex-shrink: 0; }
```

- [ ] **Step 4: Add side panel styles**

```css
/* === Side Panel === */
.side-panel {
  width: 240px;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-idle,
.panel-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 12px 14px 10px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, var(--accent-muted) 0%, transparent 100%);
  flex-shrink: 0;
}
.panel-project-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 2px;
}
.panel-branch {
  font-size: 10px;
  color: var(--text3);
  font-family: 'JetBrains Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-header-detail {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 4px;
}
.panel-detail-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.4;
  flex: 1;
  min-width: 0;
}
.panel-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--text3);
  padding: 2px 5px;
  border-radius: 4px;
  line-height: 1;
  flex-shrink: 0;
  transition: color .12s;
}
.panel-close:hover { color: var(--text); }
.panel-detail-badges {
  width: 100%;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.panel-section {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.panel-section-grow {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.panel-section-title {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .6px;
  color: var(--text3);
  text-transform: uppercase;
  margin-bottom: 8px;
}

/* Stats grid */
.panel-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.stat-cell {
  background: var(--bg);
  border-radius: 6px;
  padding: 7px 8px;
  text-align: center;
}
.stat-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 3px;
}
.stat-label { font-size: 9px; color: var(--text3); }
.stat-done     { color: var(--col-done); }
.stat-progress { color: var(--col-progress); }
.stat-pct      { color: var(--accent); }
.stat-sessions { color: var(--text2); }

/* Project timeline */
.panel-timeline {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 2px;
}
.timeline-entry {
  display: flex;
  gap: 8px;
}
.timeline-bar {
  width: 2px;
  background: rgba(94,158,110,0.4);
  border-radius: 1px;
  flex-shrink: 0;
  margin-top: 3px;
}
.timeline-bar.current { background: rgba(204,107,69,0.5); }
.timeline-text { font-size: 10px; color: var(--text2); line-height: 1.4; }
.timeline-meta { font-size: 9px; color: var(--text3); font-family: monospace; margin-top: 2px; }
.timeline-empty { font-size: 11px; color: var(--text3); font-style: italic; }

/* Detail sections */
.panel-detail-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  font-size: 11px;
}
.meta-key { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: .4px; margin-bottom: 2px; }
.meta-val { color: var(--text2); }

.panel-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.tag-chip {
  font-size: 10px;
  background: rgba(255,255,255,0.05);
  color: var(--text2);
  border: 1px solid var(--border-hover);
  border-radius: 4px;
  padding: 1px 6px;
}

/* Steps */
.panel-steps { display: flex; flex-direction: column; gap: 5px; }
.step-item {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 11px;
  color: var(--text2);
  line-height: 1.4;
  cursor: pointer;
}
.step-item input[type="checkbox"] { cursor: pointer; accent-color: var(--accent); flex-shrink: 0; margin-top: 2px; }
.step-item.done { color: var(--text3); }
.step-item.done span { text-decoration: line-through; }

/* User notes */
.panel-user-notes,
.panel-claude-notes {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 8px;
}
.note-item {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 7px 9px;
  font-size: 11px;
  color: var(--text2);
  line-height: 1.5;
}
.note-meta { font-size: 9px; color: var(--text3); font-family: monospace; margin-top: 3px; }

.panel-note-input {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 7px 9px;
  color: var(--text);
  font-size: 11px;
  font-family: inherit;
  resize: vertical;
  transition: border-color .15s;
  box-sizing: border-box;
}
.panel-note-input:focus { outline: none; border-color: rgba(204,107,69,0.4); }
.panel-note-save {
  margin-top: 5px;
  background: var(--accent-muted);
  border: 1px solid rgba(204,107,69,0.3);
  color: var(--accent);
  border-radius: 5px;
  padding: 5px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: background .15s;
}
.panel-note-save:hover { background: rgba(204,107,69,0.2); }
.panel-note-error { font-size: 10px; color: #CC4444; margin-top: 4px; }

/* Tabs */
.panel-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.panel-tab {
  flex: 1;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text3);
  cursor: pointer;
  transition: color .15s;
  font-family: inherit;
}
.panel-tab:hover { color: var(--text2); }
.panel-tab.active { color: var(--accent); border-bottom-color: var(--accent); }

.panel-tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Timeline events */
.event-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 11px;
}
.event-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-top: 3px;
  flex-shrink: 0;
}
.event-dot.status_change { background: var(--col-progress); }
.event-dot.tool_call     { background: var(--text3); }
.event-text { color: var(--text2); line-height: 1.4; }
.event-time { font-size: 9px; color: var(--text3); font-family: monospace; }
```

- [ ] **Step 5: Verify CSS loads without syntax errors by opening the page in a browser**

```bash
open http://localhost:37778
```

Expected: page loads, panel visible on right, no JS console errors from CSS

- [ ] **Step 6: Commit**

```bash
git add task-viewer/hooks/server/public/styles.css
git commit -m "feat(task-viewer): add workspace, list view, and side panel CSS"
```

---

### Task 7: JS — view toggle and list view

**Files:**
- Modify: `task-viewer/hooks/server/public/app.js`

- [ ] **Step 1: Add `currentView` state and `selectedTask` state at the top of app.js, after existing state declarations**

```js
// After: let sessionFilter = false;
let currentView = localStorage.getItem('task-viewer-view') || 'kanban';
let selectedTask = null;
```

- [ ] **Step 2: Add `renderBoard()` call to also update view-toggle button state, and split render dispatch**

Replace the existing `renderBoard()` function:

```js
function renderBoard() {
  if (currentView === 'list') {
    renderListView();
  } else {
    const cols = ['backlog', 'todo', 'in_progress', 'done'];
    for (const col of cols) {
      const tasks = filterTasks(allColumns[col] || []);
      $('count-' + col).textContent = tasks.length;
      renderColumn(col, tasks);
    }
  }
}
```

- [ ] **Step 3: Add `renderListView()` function after `renderColumn()`**

```js
const LIST_COLS = [
  { id: 'backlog',     label: 'Backlog',      startCollapsed: false },
  { id: 'todo',        label: 'Todo',         startCollapsed: false },
  { id: 'in_progress', label: 'In Progress',  startCollapsed: false },
  { id: 'done',        label: 'Done',         startCollapsed: true  },
];

function renderListView() {
  const container = $('list-view');
  container.innerHTML = '';

  for (const { id, label, startCollapsed } of LIST_COLS) {
    const tasks = filterTasks(allColumns[id] || []);
    const section = document.createElement('div');
    section.className = 'list-section' + (startCollapsed ? ' collapsed' : '');
    section.dataset.col = id;

    const header = document.createElement('div');
    header.className = 'list-section-header';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.innerHTML = `
      <span>${esc(label)}</span>
      <span class="list-section-count">${tasks.length}</span>
      <span class="list-section-chevron">▶</span>
    `;
    header.addEventListener('click', () => {
      const collapsed = section.classList.toggle('collapsed');
      rows.classList.toggle('hidden', collapsed);
    });

    const rows = document.createElement('div');
    rows.className = 'list-rows' + (startCollapsed ? ' hidden' : '');

    for (const task of tasks) {
      const row = document.createElement('div');
      row.className = 'list-row' + (selectedTask?.id === task.id && selectedTask?.sessionId === task.sessionId ? ' selected' : '');
      const priorityHtml = task.priority
        ? `<span class="list-row-priority priority-${esc(task.priority)}">${esc(task.priority)}</span>`
        : '';
      row.innerHTML = `
        <span class="list-row-title">${esc(task.subject)}</span>
        ${task.component ? `<span class="list-row-comp">${esc(task.component)}</span>` : ''}
        ${priorityHtml}
      `;
      row.addEventListener('click', () => selectTask(task));
      rows.appendChild(row);
    }

    if (tasks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-row';
      empty.style.cssText = 'color:var(--text3);font-size:11px;font-style:italic;cursor:default';
      empty.textContent = 'Sem tasks';
      rows.appendChild(empty);
    }

    section.appendChild(header);
    section.appendChild(rows);
    container.appendChild(section);
  }
}
```

- [ ] **Step 4: Add `initViewToggle()` function**

```js
function initViewToggle() {
  const kanbanBtn = $('view-kanban');
  const listBtn   = $('view-list');
  const board     = $('board');
  const listView  = $('list-view');

  function applyView(view) {
    currentView = view;
    localStorage.setItem('task-viewer-view', view);
    kanbanBtn.classList.toggle('active', view === 'kanban');
    listBtn.classList.toggle('active', view === 'list');
    kanbanBtn.setAttribute('aria-pressed', String(view === 'kanban'));
    listBtn.setAttribute('aria-pressed', String(view === 'list'));
    board.classList.toggle('hidden', view === 'list');
    listView.classList.toggle('hidden', view === 'kanban');
    renderBoard();
  }

  kanbanBtn.addEventListener('click', () => applyView('kanban'));
  listBtn.addEventListener('click', () => applyView('list'));

  // Apply saved view on init
  applyView(currentView);
}
```

- [ ] **Step 5: Call `initViewToggle()` in the Boot section**

```js
// Boot section — replace:
//   initTheme();
//   initDoneCollapse();
//   connect();
//   loadInitialState();
// with:
initTheme();
initDoneCollapse();
initViewToggle();
connect();
loadInitialState();
```

- [ ] **Step 6: Verify in browser — view toggle should switch between kanban and list**

```bash
open http://localhost:37778
```

Expected: clicking `≡` shows a list grouped by column; clicking `⊞` shows the kanban board

- [ ] **Step 7: Commit**

```bash
git add task-viewer/hooks/server/public/app.js
git commit -m "feat(task-viewer): add list view with grouped collapsible sections"
```

---

### Task 8: JS — panel idle state (stats + timeline)

**Files:**
- Modify: `task-viewer/hooks/server/public/app.js`

- [ ] **Step 1: Add `loadPanelIdle()` function after `initViewToggle()`**

```js
async function loadPanelIdle() {
  try {
    // Stats from kanban data (already loaded in allColumns)
    updatePanelStats();

    // Sessions count
    const sessions = await fetch('/api/sessions').then(r => r.json());
    $('stat-sessions').textContent = sessions.length;

    // Project timeline
    const timeline = await fetch('/api/project/timeline').then(r => r.json());
    renderPanelTimeline(timeline);
  } catch { /* non-critical — panel just shows stale data */ }
}

function updatePanelStats() {
  const done   = (allColumns.done || []).length;
  const prog   = (allColumns.in_progress || []).length;
  const total  = done + prog
    + (allColumns.backlog || []).length
    + (allColumns.todo || []).length;
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0;

  $('stat-done').textContent = done;
  $('stat-progress').textContent = prog;
  $('stat-pct').textContent = pct + '%';
  // sessions count stays as-is (loaded async)
}

function renderPanelTimeline(entries) {
  const container = $('panel-timeline');
  if (!entries || entries.length === 0) {
    container.innerHTML = '<div class="timeline-empty">Nenhuma sessão registrada ainda.</div>';
    return;
  }
  container.innerHTML = '';
  entries.forEach((entry, i) => {
    const div = document.createElement('div');
    div.className = 'timeline-entry';
    const date = entry.createdAt
      ? new Date(entry.createdAt + ' UTC').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      : '—';
    const sid = entry.sessionId ? entry.sessionId.slice(0, 6) + '…' : '—';
    div.innerHTML = `
      <div class="timeline-bar ${i === 0 ? 'current' : ''}"></div>
      <div>
        <div class="timeline-text">${esc(entry.summary)}</div>
        <div class="timeline-meta">${esc(sid)} · ${esc(date)}</div>
      </div>
    `;
    container.appendChild(div);
  });
}
```

- [ ] **Step 2: Update `handleKanbanUpdate` to also refresh panel stats when data changes**

```js
function handleKanbanUpdate(columns) {
  allColumns = columns;
  updateComponentFilters(columns);
  renderBoard();
  if (!selectedTask) updatePanelStats();
}
```

- [ ] **Step 3: Update `loadInitialState` to also load the panel after kanban data arrives**

```js
async function loadInitialState() {
  try {
    const health = await fetch('/api/health').then(r => r.json());
    const name = health.projectCwd ? health.projectCwd.split('/').pop() : '—';
    $('project-name').textContent = name;
    $('panel-project-name').textContent = name;
    if (health.branch) $('panel-branch').textContent = health.branch;

    const columns = await fetch('/api/kanban').then(r => r.json());
    handleKanbanUpdate(columns);

    // Load panel idle data
    loadPanelIdle();
  } catch { /* server may not be ready yet */ }
}
```

- [ ] **Step 4: Verify idle panel shows stats**

```bash
open http://localhost:37778
```

Expected: right panel shows project name, stats grid with numbers, timeline section (empty if no sessions recorded yet)

- [ ] **Step 5: Commit**

```bash
git add task-viewer/hooks/server/public/app.js
git commit -m "feat(task-viewer): add panel idle state with stats grid and project timeline"
```

---

### Task 9: JS — panel task detail (steps, annotations, tabs)

**Files:**
- Modify: `task-viewer/hooks/server/public/app.js`

- [ ] **Step 1: Add `selectTask()` and `deselectTask()` functions**

```js
function selectTask(task) {
  selectedTask = task;
  $('panel-idle').classList.add('hidden');
  $('panel-detail').classList.remove('hidden');
  renderPanelDetail(task);
  loadTaskDetail(task);
  renderBoard(); // re-render to show selection highlight
}

function deselectTask() {
  selectedTask = null;
  $('panel-idle').classList.remove('hidden');
  $('panel-detail').classList.add('hidden');
  renderBoard();
  updatePanelStats();
}
```

- [ ] **Step 2: Add `renderPanelDetail()` — renders the static parts of the detail panel from task data**

```js
function renderPanelDetail(task) {
  // Header
  $('detail-title').textContent = task.subject || '—';

  // Badges
  const statusColors = { in_progress: 'col-progress', done: 'col-done', pending: 'text3' };
  const priorityColors = { high: 'accent', critical: 'accent', medium: 'col-progress', low: 'text3' };
  let badgesHtml = '';
  if (task.status) {
    const label = task.status.replace('_', ' ');
    badgesHtml += `<span class="priority-badge" style="background:var(--${statusColors[task.status]||'text3'}, rgba(255,255,255,.08));color:var(--${statusColors[task.status]||'text3'})">${esc(label)}</span>`;
  }
  if (task.priority) {
    badgesHtml += `<span class="priority-badge priority-${esc(task.priority)}">${esc(task.priority)}</span>`;
  }
  $('detail-badges').innerHTML = badgesHtml;

  // Metadata grid
  const metaItems = [
    task.component ? { key: 'Componente', val: task.component } : null,
    task.effort    ? { key: 'Esforço',    val: task.effort    } : null,
    task.metadata?.feature ? { key: 'Feature', val: task.metadata.feature } : null,
    task.sessionId ? { key: 'Sessão', val: task.sessionId.slice(0, 8) + '…' } : null,
  ].filter(Boolean);

  let metaHtml = metaItems.map(m => `
    <div>
      <div class="meta-key">${esc(m.key)}</div>
      <div class="meta-val">${esc(m.val)}</div>
    </div>
  `).join('');

  if (task.tags?.length) {
    metaHtml += `<div style="grid-column:1/-1">
      <div class="meta-key">Tags</div>
      <div class="panel-tags">${task.tags.map(t => `<span class="tag-chip">${esc(t)}</span>`).join('')}</div>
    </div>`;
  }
  $('detail-meta').innerHTML = metaHtml;

  // Steps — parse from description
  const steps = parseSteps(task.description || '');
  const stepsSection = $('steps-section');
  if (steps.length === 0) {
    stepsSection.classList.add('hidden');
  } else {
    stepsSection.classList.remove('hidden');
    renderSteps(steps, task);
  }

  // Clear notes and events (will be filled by loadTaskDetail)
  $('user-notes-list').innerHTML = '';
  $('claude-notes-list').innerHTML = '';
  $('tab-content-progress').innerHTML = '';
  $('tab-content-execution').innerHTML = '';
  $('note-input').value = '';
  $('note-error').classList.add('hidden');
}
```

- [ ] **Step 3: Add `parseSteps()` and `renderSteps()` helpers**

```js
function parseSteps(description) {
  const lines = description.split('\n');
  const steps = [];
  lines.forEach((line, i) => {
    const m = line.match(/^- \[([ x])\] (.+)$/);
    if (m) steps.push({ index: steps.length, lineIndex: i, checked: m[1] === 'x', text: m[2] });
  });
  return steps;
}

function renderSteps(steps, task) {
  const container = $('detail-steps');
  container.innerHTML = '';
  steps.forEach(step => {
    const item = document.createElement('label');
    item.className = 'step-item' + (step.checked ? ' done' : '');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = step.checked;
    cb.addEventListener('change', async () => {
      try {
        const resp = await fetch(`/api/tasks/${task.id}/steps`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: task.sessionId, index: step.index, checked: cb.checked }),
        });
        if (!resp.ok) { cb.checked = !cb.checked; return; }
        // Update local task description
        const data = await resp.json();
        const colTasks = allColumns[task.kanbanColumn] || [];
        const t = colTasks.find(t => t.id === task.id && t.sessionId === task.sessionId);
        if (t) t.description = data.description;
        if (selectedTask?.id === task.id) selectedTask.description = data.description;
        item.classList.toggle('done', cb.checked);
      } catch { cb.checked = !cb.checked; }
    });
    const span = document.createElement('span');
    span.textContent = step.text;
    item.appendChild(cb);
    item.appendChild(span);
    container.appendChild(item);
  });
}
```

- [ ] **Step 4: Add `loadTaskDetail()` — loads events and renders notes + timeline tabs**

```js
async function loadTaskDetail(task) {
  try {
    const events = await fetch(`/api/tasks/${task.id}/events?sessionId=${encodeURIComponent(task.sessionId)}`).then(r => r.json());
    if (!Array.isArray(events)) return;

    // User notes
    const userNotes = events.filter(e => e.type === 'user_note');
    $('user-notes-list').innerHTML = userNotes.map(e => `
      <div class="note-item">
        <div>${esc(e.content?.text || '')}</div>
        <div class="note-meta">${formatEventTime(e.createdAt)}</div>
      </div>
    `).join('') || '';

    // Claude notes
    const claudeNotes = events.filter(e => e.type === 'claude_note');
    $('claude-notes-list').innerHTML = claudeNotes.map(e => `
      <div class="note-item">
        <div>${esc(e.content?.text || '')}</div>
        <div class="note-meta">${formatEventTime(e.createdAt)} · ${esc(e.content?.tool || 'claude')}</div>
      </div>
    `).join('') || '<div style="font-size:11px;color:var(--text3);font-style:italic">Sem anotações do Claude.</div>';

    // Progress tab — status transitions
    const statusEvents = events.filter(e => e.type === 'status_change');
    $('tab-content-progress').innerHTML = statusEvents.map(e => `
      <div class="event-item">
        <div class="event-dot status_change"></div>
        <div>
          <div class="event-text">${esc(e.content?.from || '—')} → <strong>${esc(e.content?.to || '—')}</strong></div>
          <div class="event-time">${formatEventTime(e.createdAt)}</div>
        </div>
      </div>
    `).join('') || '<div style="font-size:11px;color:var(--text3);font-style:italic">Nenhuma transição registrada.</div>';

    // Execution tab — tool calls (grouped by burst: consecutive within 60s)
    const toolEvents = events.filter(e => e.type === 'tool_call');
    const bursts = groupBursts(toolEvents, 60);
    $('tab-content-execution').innerHTML = bursts.map(burst => {
      const counts = {};
      for (const e of burst) {
        counts[e.content?.tool || '?'] = (counts[e.content?.tool || '?'] || 0) + 1;
      }
      const summary = Object.entries(counts).map(([t, n]) => n > 1 ? `${t}×${n}` : t).join(', ');
      const start = formatEventTime(burst[0].createdAt);
      const end   = burst.length > 1 ? formatEventTime(burst[burst.length-1].createdAt) : null;
      return `
        <div class="event-item">
          <div class="event-dot tool_call"></div>
          <div>
            <div class="event-text">⚡ ${esc(summary)}</div>
            <div class="event-time">${esc(start)}${end ? ' – ' + esc(end) : ''}</div>
          </div>
        </div>
      `;
    }).join('') || '<div style="font-size:11px;color:var(--text3);font-style:italic">Nenhuma tool call registrada.</div>';
  } catch {
    $('tab-content-progress').innerHTML = '<div style="font-size:11px;color:var(--text3)">Não foi possível carregar os eventos.</div>';
  }
}

function formatEventTime(createdAt) {
  if (!createdAt) return '—';
  try {
    return new Date(createdAt + ' UTC').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return createdAt; }
}

function groupBursts(events, windowSeconds) {
  if (!events.length) return [];
  const bursts = [];
  let current = [events[0]];
  for (let i = 1; i < events.length; i++) {
    const prev = new Date(events[i-1].createdAt + ' UTC').getTime();
    const curr = new Date(events[i].createdAt + ' UTC').getTime();
    if ((curr - prev) / 1000 <= windowSeconds) {
      current.push(events[i]);
    } else {
      bursts.push(current);
      current = [events[i]];
    }
  }
  bursts.push(current);
  return bursts;
}
```

- [ ] **Step 5: Add tab switching logic and close button in `initTheme()` or a new `initPanel()` function**

```js
function initPanel() {
  // Close button
  $('panel-close').addEventListener('click', deselectTask);

  // Tab switching
  let activeTab = 'progress';
  document.querySelectorAll('.panel-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      document.querySelectorAll('.panel-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $('tab-content-progress').classList.toggle('hidden', activeTab !== 'progress');
      $('tab-content-execution').classList.toggle('hidden', activeTab !== 'execution');
    });
  });

  // Note save
  $('note-save').addEventListener('click', async () => {
    if (!selectedTask) return;
    const text = $('note-input').value.trim();
    if (!text) return;
    $('note-error').classList.add('hidden');
    try {
      const resp = await fetch(`/api/tasks/${selectedTask.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedTask.sessionId, text }),
      });
      if (!resp.ok) throw new Error('save failed');
      $('note-input').value = '';
      // Reload events to show new note
      loadTaskDetail(selectedTask);
    } catch {
      $('note-error').textContent = 'Erro ao salvar. Tente novamente.';
      $('note-error').classList.remove('hidden');
    }
  });
}
```

- [ ] **Step 6: Wire `selectTask` to card clicks — modify `createCard()` to call `selectTask(task)` instead of toggling `.card-detail`**

```js
function createCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card' + (selectedTask?.id === task.id && selectedTask?.sessionId === task.sessionId ? ' selected' : '');

  const priorityClass = task.priority ? 'priority-' + task.priority : '';
  const priorityHtml = task.priority
    ? `<span class="priority-badge ${priorityClass}">${esc(task.priority)}</span>`
    : '';
  const componentHtml = task.component
    ? `<span class="component-tag">${esc(task.component)}</span>`
    : '';
  const effortHtml = task.effort
    ? `<span class="effort-chip">${esc(task.effort)}</span>`
    : '';

  card.innerHTML = `
    <div class="card-header">
      <span class="card-subject">${esc(task.subject)}</span>
      <span class="card-id">#${esc(task.id)}</span>
    </div>
    ${(task.priority || task.component || task.effort) ? `<div class="card-meta">${priorityHtml}${componentHtml}${effortHtml}</div>` : ''}
  `;

  card.addEventListener('click', () => {
    if (selectedTask?.id === task.id && selectedTask?.sessionId === task.sessionId) {
      deselectTask();
    } else {
      selectTask(task);
    }
  });

  return card;
}
```

Also add `.task-card.selected` CSS (add to styles.css after `.task-card:hover`):

```css
.task-card.selected {
  border-color: rgba(204,107,69,0.4);
  background: var(--accent-muted);
}
```

- [ ] **Step 7: Add `initPanel()` to Boot section**

```js
// Boot
initTheme();
initDoneCollapse();
initViewToggle();
initPanel();
connect();
loadInitialState();
```

- [ ] **Step 8: Verify full flow in browser**

```bash
open http://localhost:37778
```

Expected:
- Clicking a kanban card shows the panel detail (header, metadata, steps if any, empty notes, tabs)
- Clicking the same card again or `✕` returns to idle state with stats
- Switching to list view, clicking a row opens the panel detail

- [ ] **Step 9: Commit**

```bash
git add task-viewer/hooks/server/public/app.js task-viewer/hooks/server/public/styles.css
git commit -m "feat(task-viewer): add task detail panel with steps, annotations, and timeline tabs"
```

---

### Task 10: Stop hook update — session_summarize in Stop prompt

**Files:**
- Modify: `task-viewer/hooks/hooks.json`

- [ ] **Step 1: Update the Stop hook prompt to include session_summarize**

Replace the existing `Stop` hook prompt with:

```json
{
  "type": "prompt",
  "prompt": "Before stopping: 1) If source code was modified this session, run gitnexus_detect_changes and briefly report affected symbols. 2) Call the MCP tool session_summarize with a 1-2 sentence summary of what was accomplished and the count of tasks moved to done. 3) Generate a short summary and POST it to http://localhost:37778/api/session-context/finalize with JSON body {sessionId, summary}. 4) Then approve stopping.",
  "timeout": 60000
}
```

- [ ] **Step 2: Verify hooks.json is valid JSON**

```bash
python3 -m json.tool task-viewer/hooks/hooks.json > /dev/null && echo "valid JSON"
```

Expected: `valid JSON`

- [ ] **Step 3: Commit**

```bash
git add task-viewer/hooks/hooks.json
git commit -m "feat(task-viewer): update Stop hook to call session_summarize MCP tool"
```

---

## Post-Implementation Checklist

- [ ] Server starts without errors: `node task-viewer/hooks/server/server.mjs`
- [ ] `GET /api/project/timeline` returns JSON array
- [ ] `GET /api/tasks/1/events?sessionId=x` returns JSON array (empty is fine)
- [ ] MCP lists `task_annotate` and `session_summarize` in tools
- [ ] Browser: view toggle switches between kanban and list
- [ ] Browser: clicking a card/row shows panel detail with correct task info
- [ ] Browser: `✕` closes detail and shows idle panel
- [ ] Browser: idle panel shows correct task counts
- [ ] `capture-tool-call.sh` is executable and has valid bash syntax
