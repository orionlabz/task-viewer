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

function shutdown() {
  console.log('Shutting down Task Viewer...');
  watchers.close().then(() => {
    server.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 3000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
