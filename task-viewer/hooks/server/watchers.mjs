import chokidar from 'chokidar';
import { readFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, basename, dirname } from 'node:path';
import { discoverProjectSessions } from './parsers.mjs';
import { upsertSession, upsertTask, listKanban } from './storage.mjs';

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
    // Discover which session is active for this project
    const sessions = await discoverProjectSessions(this.projectCwd);
    if (sessions.length > 0) {
      this.activeSessionId = sessions[0].sessionId;
      upsertSession(this.activeSessionId, this.projectCwd);
    }

    // Watch for new Claude Code sessions
    const sessionsDir = join(CLAUDE_DIR, 'sessions');
    this._watch(sessionsDir, '*.json', debounce(() => this._checkNewSession(), 200));

    // Watch ALL task dirs for json changes — handles sessionId mismatches
    const tasksDir = join(CLAUDE_DIR, 'tasks');
    this._watch(tasksDir, '**/*.json', debounce((path) => this._onTaskFileChanged(path), 150));

    // Initial load: scan all task dirs for the most recent one with files
    await this._initialTaskLoad();
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

  async _onTaskFileChanged(filePath) {
    // Extract sessionId from path: ~/.claude/tasks/{sessionId}/{taskId}.json
    if (!filePath || typeof filePath !== 'string') return;
    const sessionId = basename(dirname(filePath));
    if (!sessionId || sessionId === 'tasks') return;

    // Update active session if this is a new one
    if (sessionId !== this.activeSessionId) {
      this.activeSessionId = sessionId;
      upsertSession(sessionId, this.projectCwd);
      this.onUpdate('session:change', { sessionId });
    }

    await this._syncTasksFromDisk(sessionId);
  }

  async _initialTaskLoad() {
    // Only sync sessions that belong to this project — never steal sessions from other projects
    const sessions = await discoverProjectSessions(this.projectCwd);
    if (sessions.length === 0) {
      this.onUpdate('kanban:update', { columns: { backlog: [], todo: [], in_progress: [], done: [] } });
      return;
    }
    this.activeSessionId = sessions[0].sessionId;
    upsertSession(this.activeSessionId, this.projectCwd);
    for (const s of sessions) {
      await this._syncTasksFromDisk(s.sessionId);
    }
  }

  async _syncTasksFromDisk(sessionId) {
    const tasksDir = join(CLAUDE_DIR, 'tasks', sessionId);
    try {
      const files = await readdir(tasksDir);
      const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('.'));

      for (const file of jsonFiles) {
        try {
          const content = await readFile(join(tasksDir, file), 'utf-8');
          const task = JSON.parse(content);
          upsertTask(sessionId, {
            id: task.id || basename(file, '.json'),
            subject: task.subject || '',
            description: task.description || '',
            status: task.status || 'pending',
            activeForm: task.activeForm || '',
            owner: task.owner || '',
            blocks: task.blocks || [],
            blockedBy: task.blockedBy || [],
            metadata: task.metadata || null,
          });
        } catch { /* skip malformed */ }
      }

      const columns = listKanban(this.projectCwd);
      this.onUpdate('kanban:update', { columns });
    } catch { /* tasks dir may not exist yet */ }
  }

  async _checkNewSession() {
    const sessions = await discoverProjectSessions(this.projectCwd);
    if (sessions.length === 0) return;
    const latest = sessions[0];
    if (latest.sessionId !== this.activeSessionId) {
      this.activeSessionId = latest.sessionId;
      upsertSession(this.activeSessionId, this.projectCwd);
      this.onUpdate('session:change', { sessionId: this.activeSessionId });
    }
  }

  async emitCurrentState() {
    if (this.activeSessionId) {
      await this._syncTasksFromDisk(this.activeSessionId);
    } else {
      await this._initialTaskLoad();
    }
  }

  async close() {
    await Promise.all(this.watchers.map(w => w.close()));
    this.watchers = [];
  }
}
