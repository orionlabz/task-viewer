import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { WatcherManager } from './watchers.mjs';
import { discoverProjectSessions } from './parsers.mjs';
import {
  upsertSession,
  upsertTask,
  getSession,
  getSessionTasks,
  listSessions,
  finalizeSession,
} from './storage.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 37778;
const PROJECT_CWD = process.env.PROJECT_CWD || process.cwd();

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Explicit index route — serve-static 1.16.x doesn't auto-resolve / to index.html
app.get('/', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// --- Session persistence & task endpoints ---

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

wss.on('connection', async () => {
  await watchers.emitCurrentState();
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

async function shutdown() {
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
