import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';
import { WatcherManager } from './watchers.mjs';
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 37778;
const PROJECT_CWD = process.env.PROJECT_CWD || process.cwd();

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  let branch = '—';
  try { branch = execSync('git -C . rev-parse --abbrev-ref HEAD', { cwd: PROJECT_CWD, timeout: 2000 }).toString().trim(); } catch {}
  res.json({ status: 'ok', projectCwd: PROJECT_CWD, port: PORT, branch });
});

app.use(express.static(join(__dirname, 'public')));

// Explicit index route — serve-static 1.16.x doesn't auto-resolve / to index.html
app.get('/', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// --- Session persistence & task endpoints ---

app.post('/api/tasks', (req, res) => {
  try {
    const { sessionId, taskId, toolName, subject, description, status, activeForm, kanban_column } = req.body;
    if (!sessionId || !taskId) return res.status(400).json({ error: 'sessionId and taskId required' });

    // Auto-create session if needed
    upsertSession(sessionId, PROJECT_CWD);

    // Upsert the task
    upsertTask(sessionId, { id: taskId, subject, description, status, activeForm, kanban_column });

    // Auto emit status_change event
    if (status) {
      const last = getLastStatusEvent(taskId, sessionId);
      if (!last || last.to !== status) {
        insertTaskEvent(taskId, sessionId, 'status_change', { from: last?.to || null, to: status });
      }
    }

    // Broadcast updated kanban
    const columns = listKanban(PROJECT_CWD);
    broadcast('kanban:update', { columns });

    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    res.status(500).json({ error: 'failed to sync task' });
  }
});

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

app.get('/api/features', (_req, res) => {
  try {
    const features = listKanban(PROJECT_CWD);
    res.json(features);
  } catch (err) {
    console.error('GET /api/features error:', err);
    res.status(500).json({ error: 'failed to list features' });
  }
});

app.get('/api/kanban', (_req, res) => {
  try {
    const columns = listKanban(PROJECT_CWD);
    res.json(columns);
  } catch (err) {
    console.error('GET /api/kanban error:', err);
    res.status(500).json({ error: 'failed to list kanban' });
  }
});

app.post('/api/kanban-notify', (_req, res) => {
  try {
    const columns = listKanban(PROJECT_CWD);
    broadcast('kanban:update', { columns });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'notify failed' });
  }
});

app.get('/api/sessions', (_req, res) => {
  try {
    const sessions = listSessions(PROJECT_CWD);
    res.json(sessions);
  } catch (err) {
    console.error('GET /api/sessions error:', err);
    res.status(500).json({ error: 'failed to list sessions' });
  }
});

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

app.get('/api/project/timeline', (_req, res) => {
  try {
    const timeline = getProjectTimeline(PROJECT_CWD);
    res.json(timeline);
  } catch (err) {
    console.error('GET /api/project/timeline error:', err);
    res.status(500).json({ error: 'failed to load timeline' });
  }
});

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

const server = createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(type, data) {
  const msg = JSON.stringify({ type, data });
  for (const client of wss.clients) {
    if (client.readyState === 1) { client.send(msg); }
  }
}

setInterval(() => {
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'heartbeat' }));
    }
  }
}, 30000);

const watchers = new WatcherManager(PROJECT_CWD, (type, data) => {
  broadcast(type, data);
});

wss.on('connection', async (ws) => {
  try {
    await watchers.emitCurrentState();
  } catch (err) {
    console.error('Failed to emit state on connection:', err);
  }
});

server.listen(PORT, () => {
  console.log(`Task Viewer running at http://localhost:${PORT}`);
  console.log(`Watching project: ${PROJECT_CWD}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use. Exiting.`);
    process.exit(1);
  }
  throw err;
});

watchers.start().catch(err => {
  console.error('Failed to start watchers:', err);
});

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('Shutting down Task Viewer...');
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

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
