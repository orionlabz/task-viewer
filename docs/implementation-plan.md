# Task Viewer Plugin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o plugin task-viewer que exibe um dashboard Kanban em tempo real com tasks do Claude Code e planos/specs do Superpowers, iniciando automaticamente via hooks.

**Architecture:** Plugin Claude Code com Express server + WebSocket para push updates. Chokidar monitora arquivos de tasks (JSON) e planos/specs (markdown). Frontend vanilla JS renderiza kanban + progress bars com tema Aurora.

**Tech Stack:** Node.js, Express 4, ws 8, chokidar 4, open 10, vanilla HTML/CSS/JS

**Spec:** `~/.claude/plugins/marketplaces/paulojalowyj/docs/design-spec.md`

**Desvios intencionais do spec:**
- Specs e plans sao enviados juntos num unico evento `specs:update` (linked tree) ao inves de eventos separados `specs:update` + `plans:update`
- Historico usa REST endpoints (`/api/history`) ao inves de evento WS `history:load`, pois lazy-loading via HTTP e mais eficiente

**Plugin root:** `~/.claude/plugins/marketplaces/paulojalowyj/task-viewer/`

---

## File Map

### Plugin Manifest & Config
- Create: `marketplace.json` (marketplace root)
- Create: `task-viewer/.claude-plugin/plugin.json`
- Create: `task-viewer/hooks/hooks.json`

### Server
- Create: `task-viewer/hooks/server/package.json`
- Create: `task-viewer/hooks/server/server.mjs` — Express + WebSocket server, lifecycle
- Create: `task-viewer/hooks/server/watchers.mjs` — chokidar file watchers (tasks, specs, plans, sessions)
- Create: `task-viewer/hooks/server/parsers.mjs` — JSON task parser, markdown spec/plan parser, session discovery

### Frontend
- Create: `task-viewer/hooks/server/public/index.html` — dashboard HTML structure
- Create: `task-viewer/hooks/server/public/styles.css` — Aurora theme (OKLch colors, Inter/Aleo/IBM Plex Mono)
- Create: `task-viewer/hooks/server/public/app.js` — WebSocket client, DOM rendering, state management

### Skill & Docs
- Create: `task-viewer/skills/task-viewer/SKILL.md`
- Create: `task-viewer/README.md`
- Create: `README.md` (marketplace root)
- Create: `LICENSE`

---

### Task 1: Plugin scaffold and manifests

**Files:**
- Create: `marketplace.json`
- Create: `task-viewer/.claude-plugin/plugin.json`
- Create: `task-viewer/hooks/hooks.json`
- Create: `task-viewer/hooks/server/package.json`

- [ ] **Step 1: Create marketplace.json**

```json
{
  "name": "superpower-kanban",
  "description": "Real-time task visualization plugins for Claude Code",
  "owner": {
    "name": "OrionLabz"
  },
  "plugins": [
    {
      "name": "task-viewer",
      "description": "Real-time task visualization dashboard for Claude Code sessions with Superpowers plan tracking",
      "version": "0.1.0",
      "source": "./task-viewer",
      "author": {
        "name": "Paulo Jalowyj"
      }
    }
  ]
}
```

- [ ] **Step 2: Create plugin.json**

```json
{
  "name": "task-viewer",
  "description": "Real-time Kanban dashboard that visualizes Claude Code tasks and Superpowers plans. Auto-starts with sessions on localhost:37778."
}
```

- [ ] **Step 3: Create hooks.json**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "PROJECT_CWD=\"$PWD\" && HASH=$(echo -n \"$PROJECT_CWD\" | if command -v md5 >/dev/null 2>&1; then md5 -q; else md5sum | cut -d' ' -f1; fi) && cd \"${CLAUDE_PLUGIN_ROOT}/hooks/server\" && ([ -d node_modules ] || npm install --silent) && PROJECT_CWD=\"$PROJECT_CWD\" nohup node server.mjs > /tmp/task-viewer-$HASH.log 2>&1 & echo $! > /tmp/task-viewer-$HASH.pid",
            "timeout": 30000,
            "statusMessage": "Starting Task Viewer..."
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "HASH=$(echo -n \"$PWD\" | if command -v md5 >/dev/null 2>&1; then md5 -q; else md5sum | cut -d' ' -f1; fi) && if [ -f /tmp/task-viewer-$HASH.pid ]; then kill $(cat /tmp/task-viewer-$HASH.pid) 2>/dev/null; rm -f /tmp/task-viewer-$HASH.pid; fi",
            "timeout": 5000,
            "statusMessage": "Stopping Task Viewer..."
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 4: Create package.json**

```json
{
  "name": "task-viewer-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node server.mjs"
  },
  "dependencies": {
    "chokidar": "^4",
    "express": "^4",
    "open": "^10",
    "ws": "^8"
  }
}
```

- [ ] **Step 5: Install dependencies**

Run: `cd ~/.claude/plugins/marketplaces/paulojalowyj/task-viewer/hooks/server && npm install`
Expected: `node_modules` created, `package-lock.json` generated

- [ ] **Step 6: Add node_modules to .gitignore**

Create `task-viewer/hooks/server/.gitignore`:
```
node_modules/
```

- [ ] **Step 7: Commit**

```bash
cd ~/.claude/plugins/marketplaces/paulojalowyj
git add marketplace.json task-viewer/.claude-plugin/plugin.json task-viewer/hooks/hooks.json task-viewer/hooks/server/package.json task-viewer/hooks/server/package-lock.json task-viewer/hooks/server/.gitignore
git commit -m "feat: scaffold plugin structure and manifests"
```

---

### Task 2: Parsers — task JSON, spec/plan markdown, session discovery

**Files:**
- Create: `task-viewer/hooks/server/parsers.mjs`

- [ ] **Step 1: Write parseTask function**

Reads a single task JSON file and returns the parsed object. Handles file-not-found and malformed JSON gracefully.

```javascript
import { readFile, readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';

const CLAUDE_DIR = join(homedir(), '.claude');

export async function parseTask(jsonPath) {
  try {
    const content = await readFile(jsonPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Write loadSessionTasks function**

Loads all tasks from a session directory.

```javascript
export async function loadSessionTasks(sessionId) {
  const dir = join(CLAUDE_DIR, 'tasks', sessionId);
  try {
    const files = await readdir(dir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('.'));
    const tasks = await Promise.all(
      jsonFiles.map(f => parseTask(join(dir, f)))
    );
    return tasks.filter(t => t !== null && t.status !== 'deleted');
  } catch {
    return [];
  }
}
```

- [ ] **Step 3: Write parseSpec function**

Extracts title, date, and topic slug from a spec markdown filename and heading.

```javascript
export async function parseSpec(mdPath) {
  try {
    const content = await readFile(mdPath, 'utf-8');
    const filename = basename(mdPath);
    // Pattern: YYYY-MM-DD-<topic>-design.md
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+?)-design\.md$/);
    if (!match) return null;

    const [, date, topic] = match;
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : topic;

    return { filename, date, topic, title, path: mdPath };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Write parsePlan function**

Extracts tasks and steps with checkbox state from a plan markdown file.

```javascript
export async function parsePlan(mdPath) {
  try {
    const content = await readFile(mdPath, 'utf-8');
    const filename = basename(mdPath);
    // Pattern: YYYY-MM-DD-<topic>.md
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
    if (!match) return null;

    const [, date, topic] = match;
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : topic;

    const tasks = [];
    let currentTask = null;

    for (const line of content.split('\n')) {
      const taskMatch = line.match(/^###\s+Task\s+(\d+):\s*(.+)/);
      if (taskMatch) {
        currentTask = {
          id: parseInt(taskMatch[1]),
          title: taskMatch[2].trim(),
          steps: [],
        };
        tasks.push(currentTask);
        continue;
      }

      if (currentTask) {
        const stepMatch = line.match(/^- \[([ x])\]\s+\*\*Step\s+\d+:\s*(.+?)\*\*/);
        if (stepMatch) {
          currentTask.steps.push({
            done: stepMatch[1] === 'x',
            title: stepMatch[2].trim(),
          });
        }
      }
    }

    // Calculate progress
    for (const task of tasks) {
      const total = task.steps.length;
      const done = task.steps.filter(s => s.done).length;
      task.progress = total > 0 ? Math.round((done / total) * 100) : 0;
    }

    const allSteps = tasks.flatMap(t => t.steps);
    const totalSteps = allSteps.length;
    const doneSteps = allSteps.filter(s => s.done).length;
    const progress = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

    return { filename, date, topic, title, tasks, progress, path: mdPath };
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: Write linkSpecsAndPlans function**

Links specs to plans by shared topic slug.

```javascript
export function linkSpecsAndPlans(specs, plans) {
  const plansByTopic = new Map();
  for (const plan of plans) {
    plansByTopic.set(plan.topic, plan);
  }

  const linked = [];
  const usedPlanTopics = new Set();

  for (const spec of specs) {
    const plan = plansByTopic.get(spec.topic) || null;
    if (plan) usedPlanTopics.add(spec.topic);
    linked.push({ spec, plan });
  }

  // Standalone plans (no matching spec)
  for (const plan of plans) {
    if (!usedPlanTopics.has(plan.topic)) {
      linked.push({ spec: null, plan });
    }
  }

  return linked;
}
```

- [ ] **Step 6: Write session discovery functions**

```javascript
export async function findActiveSessions(projectCwd) {
  const sessionsDir = join(CLAUDE_DIR, 'sessions');
  try {
    const files = await readdir(sessionsDir);
    const sessions = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const content = await readFile(join(sessionsDir, file), 'utf-8');
        const session = JSON.parse(content);
        if (session.cwd === projectCwd && session.sessionId) {
          sessions.push(session);
        }
      } catch { /* skip malformed */ }
    }
    return sessions;
  } catch {
    return [];
  }
}

export async function discoverProjectSessions(projectCwd) {
  const sessions = await findActiveSessions(projectCwd);
  const result = [];
  for (const session of sessions) {
    const tasksDir = join(CLAUDE_DIR, 'tasks', session.sessionId);
    try {
      const files = await readdir(tasksDir);
      const taskCount = files.filter(f => f.endsWith('.json') && !f.startsWith('.')).length;
      if (taskCount > 0) {
        result.push({
          sessionId: session.sessionId,
          pid: session.pid,
          startedAt: session.startedAt,
          taskCount,
        });
      }
    } catch { /* no tasks dir */ }
  }
  return result.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
}
```

- [ ] **Step 7: Write loadAllSpecs and loadAllPlans helpers**

```javascript
export async function loadAllSpecs(projectCwd) {
  const dir = join(projectCwd, 'docs', 'superpowers', 'specs');
  try {
    const files = await readdir(dir);
    const specs = await Promise.all(
      files.filter(f => f.endsWith('.md')).map(f => parseSpec(join(dir, f)))
    );
    return specs.filter(s => s !== null);
  } catch {
    return [];
  }
}

export async function loadAllPlans(projectCwd) {
  const dir = join(projectCwd, 'docs', 'superpowers', 'plans');
  try {
    const files = await readdir(dir);
    const plans = await Promise.all(
      files.filter(f => f.endsWith('.md')).map(f => parsePlan(join(dir, f)))
    );
    return plans.filter(p => p !== null);
  } catch {
    return [];
  }
}
```

- [ ] **Step 8: Test parsers manually**

Run: `cd ~/.claude/plugins/marketplaces/paulojalowyj/task-viewer/hooks/server && node -e "import('./parsers.mjs').then(async m => { const plans = await m.loadAllPlans('$PWD/../../../../../Projetos/siderea/aurora'); console.log(JSON.stringify(plans, null, 2)); })"`
Expected: Parsed plan output with tasks and progress percentages

- [ ] **Step 9: Commit**

```bash
cd ~/.claude/plugins/marketplaces/paulojalowyj
git add task-viewer/hooks/server/parsers.mjs
git commit -m "feat: add task/spec/plan parsers and session discovery"
```

---

### Task 3: File watchers

**Files:**
- Create: `task-viewer/hooks/server/watchers.mjs`

- [ ] **Step 1: Write WatcherManager class**

Manages all four chokidar watchers with debouncing and dynamic session switching.

```javascript
import chokidar from 'chokidar';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  loadSessionTasks,
  loadAllSpecs,
  loadAllPlans,
  linkSpecsAndPlans,
  findActiveSessions,
} from './parsers.mjs';

const CLAUDE_DIR = join(homedir(), '.claude');

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export class WatcherManager {
  constructor(projectCwd, onUpdate) {
    this.projectCwd = projectCwd;
    this.onUpdate = onUpdate;
    this.activeSessionId = null;
    this.watchers = [];
  }

  async start() {
    // Find initial active session (sorted by startedAt)
    const sessions = await discoverProjectSessions(this.projectCwd);
    if (sessions.length > 0) {
      this.activeSessionId = sessions[0].sessionId; // most recent
    }

    // 1. Task watcher (started when session found)
    if (this.activeSessionId) {
      this._watchTasks(this.activeSessionId);
    }

    // 2. Spec watcher
    const specsDir = join(this.projectCwd, 'docs', 'superpowers', 'specs');
    this._watch(specsDir, '*.md', debounce(() => this._emitSpecsPlans(), 200));

    // 3. Plan watcher
    const plansDir = join(this.projectCwd, 'docs', 'superpowers', 'plans');
    this._watch(plansDir, '*.md', debounce(() => this._emitSpecsPlans(), 200));

    // 4. Session watcher
    const sessionsDir = join(CLAUDE_DIR, 'sessions');
    this._watch(sessionsDir, '*.json', debounce(() => this._checkNewSession(), 200));

    // Emit initial state
    await this._emitTasks();
    await this._emitSpecsPlans();
  }

  _watch(dir, pattern, handler) {
    const watcher = chokidar.watch(join(dir, pattern), {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100 },
    });
    watcher.on('add', handler).on('change', handler).on('unlink', handler);
    this.watchers.push(watcher);
    return watcher;
  }

  _watchTasks(sessionId) {
    const dir = join(CLAUDE_DIR, 'tasks', sessionId);
    const handler = debounce(() => this._emitTasks(), 200);
    // Remove existing task watcher if any
    if (this._taskWatcher) {
      this._taskWatcher.close();
      this.watchers = this.watchers.filter(w => w !== this._taskWatcher);
    }
    this._taskWatcher = this._watch(dir, '*.json', handler);
  }

  async _checkNewSession() {
    const sessions = await discoverProjectSessions(this.projectCwd);
    if (sessions.length === 0) return;

    const latest = sessions[0]; // most recent (sorted by startedAt desc)
    if (latest.sessionId !== this.activeSessionId) {
      this.activeSessionId = latest.sessionId;
      this._watchTasks(this.activeSessionId);
      this.onUpdate('session:change', { sessionId: this.activeSessionId });
      await this._emitTasks();
    }
  }

  async _emitTasks() {
    if (!this.activeSessionId) {
      this.onUpdate('tasks:update', { tasks: [], sessionId: null });
      return;
    }
    const tasks = await loadSessionTasks(this.activeSessionId);
    this.onUpdate('tasks:update', { tasks, sessionId: this.activeSessionId });
  }

  async _emitSpecsPlans() {
    const specs = await loadAllSpecs(this.projectCwd);
    const plans = await loadAllPlans(this.projectCwd);
    const linked = linkSpecsAndPlans(specs, plans);
    this.onUpdate('specs:update', { linked });
  }

  async emitCurrentState() {
    await this._emitTasks();
    await this._emitSpecsPlans();
  }

  async close() {
    await Promise.all(this.watchers.map(w => w.close()));
    this.watchers = [];
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/.claude/plugins/marketplaces/paulojalowyj
git add task-viewer/hooks/server/watchers.mjs
git commit -m "feat: add file watchers with debounce and session switching"
```

---

### Task 4: Express + WebSocket server

**Files:**
- Create: `task-viewer/hooks/server/server.mjs`

- [ ] **Step 1: Write server with Express static serving and WebSocket**

```javascript
import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import open from 'open';
import { WatcherManager } from './watchers.mjs';
import { discoverProjectSessions, loadSessionTasks } from './parsers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 37778;
const PROJECT_CWD = process.env.PROJECT_CWD || process.cwd();

const app = express();
app.use(express.static(join(__dirname, 'public')));

// REST endpoint for history (lazy loading)
app.get('/api/history', async (req, res) => {
  const sessions = await discoverProjectSessions(PROJECT_CWD);
  res.json(sessions);
});

app.get('/api/history/:sessionId', async (req, res) => {
  const tasks = await loadSessionTasks(req.params.sessionId);
  res.json(tasks);
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Broadcast to all connected clients
function broadcast(type, data) {
  const msg = JSON.stringify({ type, data });
  for (const client of wss.clients) {
    if (client.readyState === 1) { // OPEN
      client.send(msg);
    }
  }
}

// Heartbeat
setInterval(() => {
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'heartbeat' }));
    }
  }
}, 30000);

// Start watchers
const watchers = new WatcherManager(PROJECT_CWD, (type, data) => {
  broadcast(type, data);
});

// WebSocket connection — send initial state
wss.on('connection', async () => {
  await watchers.emitCurrentState();
});

// Start server
let browserOpened = false;

server.listen(PORT, () => {
  console.log(`Task Viewer running at http://localhost:${PORT}`);
  console.log(`Watching project: ${PROJECT_CWD}`);

  if (!browserOpened) {
    browserOpened = true;
    open(`http://localhost:${PORT}`).catch(() => {});
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use. Exiting.`);
    process.exit(1);
  }
  throw err;
});

// Start file watchers
watchers.start().catch(err => {
  console.error('Failed to start watchers:', err);
});

// Graceful shutdown
function shutdown() {
  console.log('Shutting down Task Viewer...');
  watchers.close().then(() => {
    server.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 3000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

- [ ] **Step 2: Test server starts and serves**

Run: `cd ~/.claude/plugins/marketplaces/paulojalowyj/task-viewer/hooks/server && PROJECT_CWD=/Users/paulojalowyj/Projetos/siderea/aurora timeout 5 node server.mjs 2>&1 || true`
Expected: "Task Viewer running at http://localhost:37778" + "Watching project: ..."

- [ ] **Step 3: Commit**

```bash
cd ~/.claude/plugins/marketplaces/paulojalowyj
git add task-viewer/hooks/server/server.mjs
git commit -m "feat: add Express + WebSocket server with lifecycle management"
```

---

### Task 5: Frontend — HTML structure

**Files:**
- Create: `task-viewer/hooks/server/public/index.html`

- [ ] **Step 1: Write dashboard HTML**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Viewer — Claude Code</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Aleo:wght@400;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Connection banner -->
  <div id="connection-banner" class="connection-banner hidden">
    <span class="connection-dot"></span>
    <span>Reconnecting...</span>
  </div>

  <!-- Header -->
  <header class="header">
    <div class="header-left">
      <h1 class="header-title">Aurora Task Viewer</h1>
      <span class="header-subtitle">Siderea Academy</span>
    </div>
    <div class="header-right">
      <span id="session-id" class="session-id">No active session</span>
      <span id="status-dot" class="status-dot offline"></span>
    </div>
  </header>

  <main class="main">
    <!-- Active Session Kanban -->
    <section id="kanban-section" class="section">
      <h2 class="section-title">Active Session</h2>
      <div id="kanban-no-session" class="empty-state">
        <p>Waiting for Claude Code session...</p>
      </div>
      <div id="kanban-no-tasks" class="empty-state hidden">
        <p>No tasks yet — Claude will create them as it works</p>
      </div>
      <div id="kanban" class="kanban hidden">
        <div class="kanban-column">
          <div class="column-header">
            <span class="column-title">Pending</span>
            <span id="count-pending" class="column-count">0</span>
          </div>
          <div id="col-pending" class="column-cards"></div>
        </div>
        <div class="kanban-column">
          <div class="column-header">
            <span class="column-title">In Progress</span>
            <span id="count-in_progress" class="column-count">0</span>
          </div>
          <div id="col-in_progress" class="column-cards"></div>
        </div>
        <div class="kanban-column">
          <div class="column-header">
            <span class="column-title">Completed</span>
            <span id="count-completed" class="column-count">0</span>
          </div>
          <div id="col-completed" class="column-cards"></div>
        </div>
      </div>
    </section>

    <!-- Specs & Plans -->
    <section id="specs-section" class="section hidden">
      <h2 class="section-title">Specs & Plans</h2>
      <div id="specs-list" class="specs-list"></div>
    </section>

    <!-- History -->
    <section id="history-section" class="section">
      <h2 class="section-title">Session History</h2>
      <div id="history-empty" class="empty-state">
        <p>No previous sessions found</p>
      </div>
      <div id="history-list" class="history-list hidden"></div>
    </section>
  </main>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
cd ~/.claude/plugins/marketplaces/paulojalowyj
git add task-viewer/hooks/server/public/index.html
git commit -m "feat: add dashboard HTML structure"
```

---

### Task 6: Frontend — Aurora theme CSS

**Files:**
- Create: `task-viewer/hooks/server/public/styles.css`

- [ ] **Step 1: Write Aurora-themed CSS**

```css
/* Aurora Theme — OKLch Color System */
:root {
  --bg: oklch(0.1487 0.0102 268.43);
  --fg: oklch(0.985 0.002 247.839);
  --primary: oklch(0.541 0.281 293.009);
  --primary-fg: oklch(0.985 0.002 247.839);
  --card: oklch(0.1933 0.0206 268.43);
  --card-border: oklch(0.278 0.033 256.848);
  --muted: oklch(0.373 0.034 259.733);
  --destructive: oklch(0.637 0.237 25.331);
  --success: oklch(0.55 0.17 145);
  --radius: 18px;
  --radius-sm: 14px;
  --radius-xl: 22px;
  --font-sans: 'Inter', ui-sans-serif, sans-serif;
  --font-serif: 'Aleo', ui-serif, serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--fg);
  line-height: 1.6;
  min-height: 100vh;
}

.hidden { display: none !important; }

/* Connection Banner */
.connection-banner {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: var(--destructive); color: var(--fg);
  padding: 8px 16px; text-align: center;
  font-family: var(--font-mono); font-size: 13px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.connection-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--fg); animation: pulse 1.5s infinite;
}

/* Header */
.header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 32px; border-bottom: 1px solid var(--card-border);
}
.header-title {
  font-family: var(--font-serif); font-size: 24px; font-weight: 700;
}
.header-subtitle {
  font-size: 13px; color: var(--muted); margin-left: 12px;
}
.header-right { display: flex; align-items: center; gap: 10px; }
.session-id {
  font-family: var(--font-mono); font-size: 12px; color: var(--muted);
}
.status-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
.status-dot.online { background: var(--success); }
.status-dot.offline { background: var(--destructive); }

/* Main */
.main { padding: 24px 32px; max-width: 1400px; margin: 0 auto; }

/* Sections */
.section { margin-bottom: 32px; }
.section-title {
  font-family: var(--font-serif); font-size: 18px; font-weight: 700;
  margin-bottom: 16px; color: var(--fg);
}

/* Empty States */
.empty-state {
  text-align: center; padding: 40px 20px; color: var(--muted);
  font-size: 14px;
}
.empty-state p { animation: pulse 2s infinite; }

/* Kanban */
.kanban { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.kanban-column {
  background: var(--card); border-radius: var(--radius);
  padding: 16px; min-height: 200px;
}
.column-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px; padding-bottom: 8px;
  border-bottom: 1px solid var(--card-border);
}
.column-title {
  font-family: var(--font-mono); font-size: 12px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted);
}
.column-count {
  font-family: var(--font-mono); font-size: 12px;
  background: var(--card-border); color: var(--fg);
  padding: 2px 8px; border-radius: 10px;
}
.column-cards { display: flex; flex-direction: column; gap: 8px; }

/* Task Card */
.task-card {
  background: var(--bg); border: 1px solid var(--card-border);
  border-radius: var(--radius-sm); padding: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.task-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px oklch(0 0 0 / 0.3);
}
.task-card-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 6px;
}
.task-id {
  font-family: var(--font-mono); font-size: 11px; color: var(--muted);
}
.task-subject { font-size: 14px; font-weight: 500; }
.task-desc {
  font-size: 12px; color: var(--muted); margin-top: 4px;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.task-active-form {
  display: inline-block; margin-top: 6px;
  font-family: var(--font-mono); font-size: 11px;
  color: var(--primary); background: oklch(0.541 0.281 293.009 / 0.15);
  padding: 2px 8px; border-radius: 8px;
}
.task-deps {
  margin-top: 6px; font-family: var(--font-mono); font-size: 10px;
  color: var(--muted);
}
.task-card.in-progress { border-color: var(--primary); }
.task-card.in-progress .task-id { color: var(--primary); }
.task-card.completed { opacity: 0.7; }
.task-card.completed .task-subject { text-decoration: line-through; }

/* Specs & Plans */
.specs-list { display: flex; flex-direction: column; gap: 12px; }
.spec-group {
  background: var(--card); border-radius: var(--radius); padding: 16px;
}
.spec-header {
  display: flex; align-items: center; gap: 10px; cursor: pointer;
  user-select: none;
}
.spec-icon { font-size: 16px; }
.spec-title { font-weight: 600; font-size: 15px; }
.spec-date {
  font-family: var(--font-mono); font-size: 11px; color: var(--muted);
}
.spec-no-plan {
  font-size: 12px; color: var(--muted); font-style: italic; margin-left: 8px;
}
.spec-body { margin-top: 12px; padding-left: 26px; }

.plan-item { margin-bottom: 12px; }
.plan-header {
  display: flex; align-items: center; gap: 10px; cursor: pointer;
  user-select: none; margin-bottom: 6px;
}
.plan-title { font-size: 14px; font-weight: 500; }
.plan-progress-text {
  font-family: var(--font-mono); font-size: 12px; color: var(--muted);
}

/* Progress Bar */
.progress-bar {
  height: 6px; background: var(--card-border); border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%; background: var(--primary); border-radius: 3px;
  transition: width 0.3s ease;
}
.progress-fill.complete { background: var(--success); }

/* Plan Tasks */
.plan-tasks { padding-left: 16px; margin-top: 8px; }
.plan-task {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 0; font-size: 13px;
}
.plan-task-title { flex: 1; }
.plan-task-progress {
  font-family: var(--font-mono); font-size: 11px; color: var(--muted);
  min-width: 40px; text-align: right;
}
.plan-task .progress-bar { flex: 0 0 80px; }

/* Plan Steps */
.plan-steps { padding-left: 24px; margin-top: 4px; }
.plan-step {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--muted); padding: 2px 0;
}
.plan-step-check {
  width: 14px; height: 14px; border: 1.5px solid var(--card-border);
  border-radius: 3px; flex-shrink: 0; display: flex;
  align-items: center; justify-content: center; font-size: 10px;
}
.plan-step-check.done {
  background: var(--success); border-color: var(--success); color: var(--bg);
}

/* History */
.history-list { display: flex; flex-direction: column; gap: 8px; }
.history-item {
  background: var(--card); border-radius: var(--radius-sm); overflow: hidden;
}
.history-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; cursor: pointer; user-select: none;
}
.history-header:hover { background: oklch(0.22 0.02 268.43); }
.history-chevron {
  transition: transform 0.2s; font-size: 12px; color: var(--muted);
}
.history-chevron.open { transform: rotate(90deg); }
.history-date {
  font-family: var(--font-mono); font-size: 12px; color: var(--muted);
}
.history-meta { font-size: 13px; }
.history-task-count {
  font-family: var(--font-mono); font-size: 11px; color: var(--muted);
}
.history-body { padding: 0 16px 16px; }
.history-kanban {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;
}
.history-col-title {
  font-family: var(--font-mono); font-size: 10px; color: var(--muted);
  text-transform: uppercase; margin-bottom: 4px;
}
.history-task {
  font-size: 12px; padding: 6px 8px; background: var(--bg);
  border-radius: 6px; margin-bottom: 4px;
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Responsive */
@media (max-width: 768px) {
  .kanban { grid-template-columns: 1fr; }
  .header { flex-direction: column; gap: 8px; align-items: flex-start; }
  .main { padding: 16px; }
  .history-kanban { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/.claude/plugins/marketplaces/paulojalowyj
git add task-viewer/hooks/server/public/styles.css
git commit -m "feat: add Aurora-themed CSS with OKLch colors and animations"
```

---

### Task 7: Frontend — JavaScript client

**Files:**
- Create: `task-viewer/hooks/server/public/app.js`

- [ ] **Step 1: Write complete client-side JavaScript**

```javascript
// === State ===
let ws = null;
let reconnectDelay = 1000;
const MAX_RECONNECT = 30000;
let currentSessionId = null;

// === DOM refs ===
const $ = (id) => document.getElementById(id);
const banner = $('connection-banner');
const statusDot = $('status-dot');
const sessionIdEl = $('session-id');
const kanbanEl = $('kanban');
const kanbanNoSession = $('kanban-no-session');
const kanbanNoTasks = $('kanban-no-tasks');
const specsSection = $('specs-section');
const specsList = $('specs-list');
const historyEmpty = $('history-empty');
const historyList = $('history-list');

// === WebSocket ===
function connect() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}`);

  ws.onopen = () => {
    reconnectDelay = 1000;
    banner.classList.add('hidden');
    statusDot.className = 'status-dot online';
  };

  ws.onclose = () => {
    statusDot.className = 'status-dot offline';
    banner.classList.remove('hidden');
    setTimeout(connect, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT);
  };

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    switch (msg.type) {
      case 'tasks:update': handleTasks(msg.data); break;
      case 'specs:update': handleSpecs(msg.data); break;
      case 'session:change': handleSessionChange(msg.data); break;
      case 'heartbeat': break;
    }
  };
}

// === Task Handlers ===
function handleTasks({ tasks, sessionId }) {
  currentSessionId = sessionId;
  sessionIdEl.textContent = sessionId
    ? `Session: ${sessionId.slice(0, 8)}...`
    : 'No active session';

  if (!sessionId) {
    kanbanNoSession.classList.remove('hidden');
    kanbanNoTasks.classList.add('hidden');
    kanbanEl.classList.add('hidden');
    return;
  }

  kanbanNoSession.classList.add('hidden');

  if (tasks.length === 0) {
    kanbanNoTasks.classList.remove('hidden');
    kanbanEl.classList.add('hidden');
    return;
  }

  kanbanNoTasks.classList.add('hidden');
  kanbanEl.classList.remove('hidden');
  renderKanban(tasks);
}

function handleSessionChange({ sessionId }) {
  currentSessionId = sessionId;
  sessionIdEl.textContent = `Session: ${sessionId.slice(0, 8)}...`;
}

// === Kanban Renderer ===
function renderKanban(tasks) {
  const groups = { pending: [], in_progress: [], completed: [] };
  for (const task of tasks) {
    if (groups[task.status]) groups[task.status].push(task);
  }

  for (const [status, items] of Object.entries(groups)) {
    const col = $(`col-${status}`);
    const count = $(`count-${status}`);
    count.textContent = items.length;
    col.innerHTML = '';
    for (const task of items) {
      col.appendChild(createTaskCard(task, status));
    }
  }
}

function createTaskCard(task, status) {
  const card = document.createElement('div');
  card.className = `task-card ${status === 'in_progress' ? 'in-progress' : status}`;

  let html = `
    <div class="task-card-header">
      <span class="task-subject">${esc(task.subject)}</span>
      <span class="task-id">#${task.id}</span>
    </div>`;

  if (task.description) {
    html += `<div class="task-desc">${esc(task.description)}</div>`;
  }

  if (status === 'in_progress' && task.activeForm) {
    html += `<span class="task-active-form">${esc(task.activeForm)}</span>`;
  }

  // Dependency indicators
  const deps = [];
  if (task.blocks?.length) deps.push(`blocks: ${task.blocks.map(b => '#' + b).join(', ')}`);
  if (task.blockedBy?.length) deps.push(`blocked by: ${task.blockedBy.map(b => '#' + b).join(', ')}`);
  if (deps.length) {
    html += `<div class="task-deps">${deps.join(' | ')}</div>`;
  }

  card.innerHTML = html;
  return card;
}

// === Specs & Plans Renderer ===
function handleSpecs({ linked }) {
  if (!linked || linked.length === 0) {
    specsSection.classList.add('hidden');
    return;
  }

  specsSection.classList.remove('hidden');
  specsList.innerHTML = '';

  for (const item of linked) {
    specsList.appendChild(createSpecGroup(item));
  }
}

function createSpecGroup({ spec, plan }) {
  const group = document.createElement('div');
  group.className = 'spec-group';

  const title = spec ? spec.title : plan.title;
  const date = spec ? spec.date : plan.date;
  const icon = spec ? '\u{1F4C4}' : '\u{1F4CB}';

  let headerHtml = `
    <div class="spec-header" onclick="this.parentElement.querySelector('.spec-body')?.classList.toggle('hidden')">
      <span class="spec-icon">${icon}</span>
      <span class="spec-title">${esc(title)}</span>
      <span class="spec-date">${date}</span>`;

  if (spec && !plan) {
    headerHtml += `<span class="spec-no-plan">(plan not yet created)</span>`;
  }
  headerHtml += `</div>`;

  let bodyHtml = '';
  if (plan) {
    bodyHtml = `<div class="spec-body hidden">`;
    bodyHtml += `<div class="plan-item">
      <div class="plan-header" onclick="this.parentElement.querySelector('.plan-tasks')?.classList.toggle('hidden')">
        <span class="plan-title">${esc(plan.title)}</span>
        <span class="plan-progress-text">${plan.progress}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${plan.progress === 100 ? 'complete' : ''}" style="width: ${plan.progress}%"></div>
      </div>
      <div class="plan-tasks hidden">`;

    for (const task of plan.tasks) {
      bodyHtml += `
        <div class="plan-task" onclick="this.querySelector('.plan-steps')?.classList.toggle('hidden')">
          <span class="plan-task-title">${esc(task.title)}</span>
          <div class="progress-bar"><div class="progress-fill ${task.progress === 100 ? 'complete' : ''}" style="width: ${task.progress}%"></div></div>
          <span class="plan-task-progress">${task.progress}%</span>
        </div>
        <div class="plan-steps hidden">
          ${task.steps.map(s => `
            <div class="plan-step">
              <span class="plan-step-check ${s.done ? 'done' : ''}">${s.done ? '\u2713' : ''}</span>
              <span>${esc(s.title)}</span>
            </div>
          `).join('')}
        </div>`;
    }
    bodyHtml += `</div></div></div>`;
  }

  group.innerHTML = headerHtml + bodyHtml;
  return group;
}

// === History ===
async function loadHistory() {
  try {
    const res = await fetch('/api/history');
    const sessions = await res.json();
    renderHistory(sessions);
  } catch { /* ignore */ }
}

function renderHistory(sessions) {
  if (!sessions || sessions.length === 0) {
    historyEmpty.classList.remove('hidden');
    historyList.classList.add('hidden');
    return;
  }

  historyEmpty.classList.add('hidden');
  historyList.classList.remove('hidden');
  historyList.innerHTML = '';

  for (const session of sessions) {
    // Skip current active session
    if (session.sessionId === currentSessionId) continue;

    const item = document.createElement('div');
    item.className = 'history-item';

    const date = session.startedAt
      ? new Date(session.startedAt).toLocaleString()
      : 'Unknown date';

    item.innerHTML = `
      <div class="history-header" onclick="toggleHistory(this, '${session.sessionId}')">
        <div>
          <span class="history-chevron">\u25B8</span>
          <span class="history-date">${date}</span>
          <span class="history-task-count">${session.taskCount} tasks</span>
        </div>
        <span class="history-meta">${session.sessionId.slice(0, 8)}...</span>
      </div>
      <div class="history-body hidden" id="history-${session.sessionId}"></div>`;

    historyList.appendChild(item);
  }
}

async function toggleHistory(header, sessionId) {
  const chevron = header.querySelector('.history-chevron');
  const body = $(`history-${sessionId}`);
  const isOpen = !body.classList.contains('hidden');

  if (isOpen) {
    body.classList.add('hidden');
    chevron.classList.remove('open');
    return;
  }

  chevron.classList.add('open');
  body.classList.remove('hidden');

  // Load tasks if not already loaded
  if (!body.dataset.loaded) {
    body.innerHTML = '<p style="color: var(--muted); font-size: 12px; padding: 8px;">Loading...</p>';
    try {
      const res = await fetch(`/api/history/${sessionId}`);
      const tasks = await res.json();
      body.innerHTML = renderHistoryKanban(tasks);
      body.dataset.loaded = 'true';
    } catch {
      body.innerHTML = '<p style="color: var(--destructive); font-size: 12px;">Failed to load</p>';
    }
  }
}
// Make toggleHistory available globally for onclick
window.toggleHistory = toggleHistory;

function renderHistoryKanban(tasks) {
  const groups = { pending: [], in_progress: [], completed: [] };
  for (const task of tasks) {
    if (groups[task.status]) groups[task.status].push(task);
  }

  let html = '<div class="history-kanban">';
  for (const [status, items] of Object.entries(groups)) {
    const label = status.replace('_', ' ');
    html += `<div>
      <div class="history-col-title">${label} (${items.length})</div>
      ${items.map(t => `<div class="history-task">${esc(t.subject)}</div>`).join('')}
    </div>`;
  }
  return html + '</div>';
}

// === Helpers ===
function esc(str) {
  if (!str) return '';
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

// === Init ===
connect();
loadHistory();
```

- [ ] **Step 5: Commit**

```bash
cd ~/.claude/plugins/marketplaces/paulojalowyj
git add task-viewer/hooks/server/public/app.js
git commit -m "feat: add client-side JS with WebSocket, kanban, specs, and history rendering"
```

---

### Task 8: Skill and documentation

**Files:**
- Create: `task-viewer/skills/task-viewer/SKILL.md`
- Create: `task-viewer/README.md`
- Create: `README.md` (marketplace root)
- Create: `LICENSE`

- [ ] **Step 1: Create SKILL.md**

Skill for diagnostics: checks if server is running, shows URL, helps troubleshoot.

- [ ] **Step 2: Create task-viewer/README.md**

Plugin README with: overview, features, automatic behavior, manual usage, troubleshooting.

- [ ] **Step 3: Create marketplace README.md**

Root README for the `superpower-kanban` marketplace with installation instructions.

- [ ] **Step 4: Create LICENSE**

MIT license.

- [ ] **Step 5: Commit**

```bash
cd ~/.claude/plugins/marketplaces/paulojalowyj
git add task-viewer/skills/task-viewer/SKILL.md task-viewer/README.md README.md LICENSE
git commit -m "feat: add skill, documentation, and license"
```

---

### Task 9: Integration test and push

- [ ] **Step 1: Start server manually and verify dashboard loads**

Run: `cd ~/.claude/plugins/marketplaces/paulojalowyj/task-viewer/hooks/server && PROJECT_CWD=/Users/paulojalowyj/Projetos/siderea/aurora node server.mjs &`

Open: `http://localhost:37778`
Expected: Dashboard loads with Aurora theme, shows current tasks from active session, shows specs/plans from Aurora project

- [ ] **Step 2: Verify real-time updates**

Create a test task file and verify it appears in the dashboard within ~200ms.

- [ ] **Step 3: Stop test server**

```bash
kill %1
```

- [ ] **Step 4: Update spec in plugin repo and push**

```bash
cd ~/.claude/plugins/marketplaces/paulojalowyj
cp /Users/paulojalowyj/Projetos/siderea/aurora/docs/superpowers/specs/2026-03-24-task-viewer-plugin-design.md docs/design-spec.md
git add docs/design-spec.md
git commit -m "docs: update design spec to final version"
git push origin main
```
