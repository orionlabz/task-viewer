import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import open from 'open';
import { WatcherManager } from './watchers.mjs';
import { discoverProjectSessions, loadSessionTasks } from './parsers.mjs';
import {
  updateSessionClaudeMem,
  updateTaskClaudeMem,
  finalizeSession,
  listSessions,
  readSession,
  updateSessionTasks,
  getOrCreateSession,
} from './storage.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 37778;
const PROJECT_CWD = process.env.PROJECT_CWD || process.cwd();

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// --- Session persistence & claude-mem endpoints ---

app.post('/api/session-context', async (req, res) => {
  try {
    const { sessionId, projectCwd, claudeMem } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    const session = await updateSessionClaudeMem(sessionId, projectCwd, claudeMem);
    broadcast('claudemem:update', { sessionId, claudeMem });
    res.json({ ok: true, session });
  } catch (err) {
    console.error('POST /api/session-context error:', err);
    res.status(500).json({ error: 'failed to update session context' });
  }
});

app.post('/api/session-context/task', async (req, res) => {
  try {
    const { sessionId, taskId, claudeMem } = req.body;
    if (!sessionId || !taskId) return res.status(400).json({ error: 'sessionId and taskId required' });
    const session = await updateTaskClaudeMem(sessionId, taskId, claudeMem);
    if (!session) return res.status(404).json({ error: 'session not found' });
    broadcast('claudemem:update', { sessionId, taskId, claudeMem });
    res.json({ ok: true, session });
  } catch (err) {
    console.error('POST /api/session-context/task error:', err);
    res.status(500).json({ error: 'failed to update task context' });
  }
});

app.post('/api/session-context/finalize', async (req, res) => {
  try {
    const { sessionId, summary } = req.body || {};
    const sid = sessionId || watchers.activeSessionId;
    if (!sid) return res.status(400).json({ error: 'no active session to finalize' });
    // Snapshot current tasks before finalizing
    const tasks = await loadSessionTasks(sid);
    if (tasks.length > 0) {
      await updateSessionTasks(sid, tasks, PROJECT_CWD);
    }
    const session = await finalizeSession(sid, summary || null);
    res.json({ ok: true, session });
  } catch (err) {
    console.error('POST /api/session-context/finalize error:', err);
    res.status(500).json({ error: 'failed to finalize session' });
  }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const nativeSessions = await discoverProjectSessions(PROJECT_CWD);
    const enrichedSessions = await listSessions();
    const enrichedMap = new Map();
    for (const s of enrichedSessions) enrichedMap.set(s.sessionId, s);

    const merged = nativeSessions.map(ns => {
      const enriched = enrichedMap.get(ns.sessionId);
      return {
        ...ns,
        summary: enriched?.summary || null,
        endedAt: enriched?.endedAt || null,
        hasClaudeMem: !!(enriched?.claudeMem?.timeline?.length || enriched?.claudeMem?.observations?.length),
      };
    });
    res.json(merged);
  } catch (err) {
    console.error('GET /api/sessions error:', err);
    res.status(500).json({ error: 'failed to list sessions' });
  }
});

app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const enriched = await readSession(req.params.sessionId);
    if (!enriched) {
      // Fallback: load from native tasks
      const tasks = await loadSessionTasks(req.params.sessionId);
      return res.json({ sessionId: req.params.sessionId, tasks, claudeMem: null });
    }
    res.json(enriched);
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

watchers.start().catch(err => {
  console.error('Failed to start watchers:', err);
});

async function shutdown() {
  console.log('Shutting down Task Viewer...');
  // Persist final task state
  if (watchers.activeSessionId) {
    try {
      const tasks = await loadSessionTasks(watchers.activeSessionId);
      if (tasks.length > 0) {
        await updateSessionTasks(watchers.activeSessionId, tasks, PROJECT_CWD);
      }
      await finalizeSession(watchers.activeSessionId, null);
    } catch (err) {
      console.error('Failed to persist final state:', err);
    }
  }
  watchers.close().then(() => {
    server.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 3000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
