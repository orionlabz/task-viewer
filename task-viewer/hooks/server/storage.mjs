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
    owner TEXT,
    blocks TEXT,
    blocked_by TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (id, session_id)
  );
  CREATE INDEX IF NOT EXISTS idx_tasks_session ON tasks(session_id);
`);

// Incremental migrations for existing databases
const columns = db.prepare(`PRAGMA table_info(tasks)`).all().map(c => c.name);
if (!columns.includes('owner')) {
  db.exec(`ALTER TABLE tasks ADD COLUMN owner TEXT`);
}
if (!columns.includes('metadata')) {
  db.exec(`ALTER TABLE tasks ADD COLUMN metadata TEXT`);
}
if (!columns.includes('kanban_column')) {
  db.exec(`ALTER TABLE tasks ADD COLUMN kanban_column TEXT NOT NULL DEFAULT 'backlog'`);
  db.exec(`UPDATE tasks SET kanban_column = 'in_progress' WHERE status = 'in_progress'`);
  db.exec(`UPDATE tasks SET kanban_column = 'done' WHERE status = 'completed'`);
}
if (!columns.includes('priority')) {
  db.exec(`ALTER TABLE tasks ADD COLUMN priority TEXT`);
}
if (!columns.includes('effort')) {
  db.exec(`ALTER TABLE tasks ADD COLUMN effort TEXT`);
}
if (!columns.includes('component')) {
  db.exec(`ALTER TABLE tasks ADD COLUMN component TEXT`);
}
if (!columns.includes('tags')) {
  db.exec(`ALTER TABLE tasks ADD COLUMN tags TEXT`);
}

// Indexes for new columns
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tasks_kanban ON tasks(kanban_column);
  CREATE INDEX IF NOT EXISTS idx_tasks_component ON tasks(component);
  CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
`);

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

// --- Prepared statements ---
const stmts = {
  upsertSession: db.prepare(`
    INSERT INTO sessions (id, project_cwd, started_at)
    VALUES (@id, @projectCwd, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      project_cwd = COALESCE(NULLIF(@projectCwd, ''), sessions.project_cwd)
  `),

  upsertTask: db.prepare(`
    INSERT INTO tasks (id, session_id, subject, description, status, active_form, owner, blocks, blocked_by, metadata, kanban_column, priority, effort, component, tags, updated_at)
    VALUES (@id, @sessionId, @subject, @description, @status, @activeForm, @owner, @blocks, @blockedBy, @metadata, @kanbanColumn, @priority, @effort, @component, @tags, datetime('now'))
    ON CONFLICT(id, session_id) DO UPDATE SET
      subject = COALESCE(NULLIF(excluded.subject, ''), tasks.subject),
      description = COALESCE(NULLIF(excluded.description, ''), tasks.description),
      status = COALESCE(NULLIF(excluded.status, ''), tasks.status),
      active_form = COALESCE(NULLIF(excluded.active_form, ''), tasks.active_form),
      owner = COALESCE(NULLIF(excluded.owner, ''), tasks.owner),
      blocks = COALESCE(NULLIF(excluded.blocks, ''), tasks.blocks),
      blocked_by = COALESCE(NULLIF(excluded.blocked_by, ''), tasks.blocked_by),
      metadata = COALESCE(NULLIF(excluded.metadata, ''), tasks.metadata),
      kanban_column = COALESCE(NULLIF(excluded.kanban_column, ''), tasks.kanban_column),
      priority = COALESCE(NULLIF(excluded.priority, ''), tasks.priority),
      effort = COALESCE(NULLIF(excluded.effort, ''), tasks.effort),
      component = COALESCE(NULLIF(excluded.component, ''), tasks.component),
      tags = COALESCE(NULLIF(excluded.tags, ''), tasks.tags),
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

  allProjectTasks: db.prepare(`
    SELECT t.*, s.project_cwd FROM tasks t
    JOIN sessions s ON s.id = t.session_id
    WHERE s.project_cwd = ?
    ORDER BY t.updated_at DESC
  `),

  enrichTask: db.prepare(`
    UPDATE tasks SET
      kanban_column = COALESCE(NULLIF(@kanbanColumn, ''), kanban_column),
      priority = COALESCE(NULLIF(@priority, ''), priority),
      effort = COALESCE(NULLIF(@effort, ''), effort),
      component = COALESCE(NULLIF(@component, ''), component),
      tags = COALESCE(NULLIF(@tags, ''), tags),
      metadata = COALESCE(NULLIF(@metadata, ''), metadata),
      updated_at = datetime('now')
    WHERE id = @id AND session_id = @sessionId
  `),

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
    owner: taskData.owner || '',
    blocks: taskData.blocks ? JSON.stringify(taskData.blocks) : '',
    blockedBy: taskData.blockedBy ? JSON.stringify(taskData.blockedBy) : '',
    metadata: taskData.metadata ? JSON.stringify(taskData.metadata) : '',
    kanbanColumn: taskData.kanban_column || '',
    priority: taskData.priority || '',
    effort: taskData.effort || '',
    component: taskData.component || '',
    tags: taskData.tags ? JSON.stringify(taskData.tags) : '',
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
    id: row.id,
    subject: row.subject,
    description: row.description,
    status: row.status,
    kanbanColumn: row.kanban_column || 'backlog',
    priority: row.priority || null,
    effort: row.effort || null,
    component: row.component || null,
    tags: row.tags ? JSON.parse(row.tags) : [],
    activeForm: row.active_form,
    owner: row.owner || null,
    blocks: row.blocks ? JSON.parse(row.blocks) : [],
    blockedBy: row.blocked_by ? JSON.parse(row.blocked_by) : [],
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
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

export function listFeatures(projectCwd) {
  const rows = stmts.allProjectTasks.all(projectCwd);
  const features = new Map();

  for (const row of rows) {
    const meta = row.metadata ? JSON.parse(row.metadata) : null;
    const featureName = meta?.feature || null;
    const task = {
      id: row.id,
      subject: row.subject,
      description: row.description,
      status: row.status,
      activeForm: row.active_form,
      owner: row.owner || null,
      blocks: row.blocks ? JSON.parse(row.blocks) : [],
      blockedBy: row.blocked_by ? JSON.parse(row.blocked_by) : [],
      metadata: meta,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sessionId: row.session_id,
    };

    if (!features.has(featureName)) {
      features.set(featureName, { name: featureName, tasks: [] });
    }
    features.get(featureName).tasks.push(task);
  }

  // Compute progress for each feature
  const result = [];
  for (const [, feature] of features) {
    const total = feature.tasks.length;
    const completed = feature.tasks.filter(t => t.status === 'completed').length;
    const inProgress = feature.tasks.filter(t => t.status === 'in_progress').length;
    const status = completed === total ? 'completed'
      : inProgress > 0 || completed > 0 ? 'in_progress'
      : 'pending';
    result.push({ ...feature, total, completed, inProgress, status });
  }

  // Named features first (sorted by most recent update), ungrouped last
  result.sort((a, b) => {
    if (a.name === null && b.name !== null) return 1;
    if (a.name !== null && b.name === null) return -1;
    // By status: in_progress first, then pending, then completed
    const statusOrder = { in_progress: 0, pending: 1, completed: 2 };
    return (statusOrder[a.status] ?? 1) - (statusOrder[b.status] ?? 1);
  });

  return result;
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

export function listKanban(projectCwd) {
  const rows = stmts.allProjectTasks.all(projectCwd);
  const columns = { backlog: [], todo: [], in_progress: [], done: [] };

  for (const row of rows) {
    const col = row.kanban_column || 'backlog';
    if (!columns[col]) columns[col] = [];
    columns[col].push({
      id: row.id,
      subject: row.subject,
      description: row.description,
      status: row.status,
      kanbanColumn: row.kanban_column,
      priority: row.priority || null,
      effort: row.effort || null,
      component: row.component || null,
      tags: row.tags ? JSON.parse(row.tags) : [],
      activeForm: row.active_form,
      owner: row.owner || null,
      blocks: row.blocks ? JSON.parse(row.blocks) : [],
      blockedBy: row.blocked_by ? JSON.parse(row.blocked_by) : [],
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sessionId: row.session_id,
    });
  }

  return columns;
}

export function enrichTask(taskId, sessionId, fields) {
  stmts.enrichTask.run({
    id: taskId,
    sessionId,
    kanbanColumn: fields.kanban_column || '',
    priority: fields.priority || '',
    effort: fields.effort || '',
    component: fields.component || '',
    tags: fields.tags ? JSON.stringify(fields.tags) : '',
    metadata: fields.metadata ? JSON.stringify(fields.metadata) : '',
  });
  return stmts.getSession.get(sessionId) ? getSessionTasks(sessionId).find(t => t.id === taskId) : null;
}

export function moveTask(taskId, sessionId, column) {
  const VALID_COLUMNS = new Set(['backlog', 'todo', 'in_progress', 'done']);
  if (!VALID_COLUMNS.has(column)) throw new Error(`Invalid kanban column: "${column}". Valid values: backlog, todo, in_progress, done`);
  const result = db.prepare(`
    UPDATE tasks SET kanban_column = ?, updated_at = datetime('now')
    WHERE id = ? AND session_id = ?
  `).run(column, taskId, sessionId);
  if (result.changes === 0) return null;
  return getSessionTasks(sessionId).find(t => t.id === taskId) || null;
}

export function getDashboard(projectCwd) {
  const columns = listKanban(projectCwd);
  const allTasks = [...columns.backlog, ...columns.todo, ...columns.in_progress, ...columns.done];
  const total = allTasks.length;
  const completed = columns.done.length;

  const byComponent = {};
  const byPriority = {};
  for (const t of allTasks) {
    if (t.component) byComponent[t.component] = (byComponent[t.component] || 0) + 1;
    if (t.priority) byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
  }

  return {
    projectCwd,
    columns: {
      backlog: { count: columns.backlog.length, tasks: columns.backlog },
      todo: { count: columns.todo.length, tasks: columns.todo },
      in_progress: { count: columns.in_progress.length, tasks: columns.in_progress },
      done: { count: columns.done.length, tasks: columns.done },
    },
    metrics: {
      totalTasks: total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) / 100 : 0,
      byComponent,
      byPriority,
    },
  };
}

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

export function getLastStatusEvent(taskId, sessionId) {
  const row = stmts.getLastEventStatus.get({ taskId, sessionId });
  if (!row) return null;
  try { return JSON.parse(row.content); } catch { return null; }
}
