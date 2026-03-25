// === State ===
let ws = null;
let reconnectDelay = 1000;
const MAX_RECONNECT = 30000;
let allColumns = { backlog: [], todo: [], in_progress: [], done: [] };
let currentSessionId = null;
let activeComponents = new Set();
let sessionFilter = false;

// === DOM ===
const $ = id => document.getElementById(id);

// === Helpers ===
function esc(str) {
  if (!str) return '';
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

function shortSession(id) {
  return id ? id.slice(0, 8) + '…' : '—';
}

// === WebSocket ===
function connect() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}`);

  ws.onopen = () => {
    reconnectDelay = 1000;
    $('connection-banner').classList.add('hidden');
    $('status-dot').className = 'status-dot online';
  };

  ws.onclose = () => {
    $('status-dot').className = 'status-dot';
    $('connection-banner').classList.remove('hidden');
    setTimeout(connect, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT);
  };

  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'kanban:update') handleKanbanUpdate(msg.data.columns);
    if (msg.type === 'session:change') handleSessionChange(msg.data);
  };
}

// === Handlers ===
function handleSessionChange({ sessionId }) {
  currentSessionId = sessionId;
  $('session-id').textContent = 'Session: ' + shortSession(sessionId);
}

function handleKanbanUpdate(columns) {
  allColumns = columns;
  updateComponentFilters(columns);
  renderBoard();
}

// === Filters ===
function updateComponentFilters(columns) {
  const allTasks = [...(columns.backlog||[]), ...(columns.todo||[]), ...(columns.in_progress||[]), ...(columns.done||[])];
  const components = [...new Set(allTasks.map(t => t.component).filter(Boolean))].sort();

  const container = $('component-filters');
  const existing = new Set([...container.querySelectorAll('.component-chip')].map(c => c.dataset.comp));
  const updated = new Set(components);

  // Add new chips
  for (const comp of components) {
    if (!existing.has(comp)) {
      const chip = document.createElement('button');
      chip.className = 'component-chip' + (activeComponents.has(comp) ? ' active' : '');
      chip.dataset.comp = comp;
      chip.textContent = comp;
      chip.addEventListener('click', () => toggleComponent(comp, chip));
      container.appendChild(chip);
    }
  }
  // Remove stale chips
  for (const chip of container.querySelectorAll('.component-chip')) {
    if (!updated.has(chip.dataset.comp)) chip.remove();
  }
}

function toggleComponent(comp, chipEl) {
  if (activeComponents.has(comp)) {
    activeComponents.delete(comp);
    chipEl.classList.remove('active');
  } else {
    activeComponents.add(comp);
    chipEl.classList.add('active');
  }
  renderBoard();
}

function filterTasks(tasks) {
  let result = tasks;
  if (sessionFilter && currentSessionId) {
    result = result.filter(t => t.sessionId === currentSessionId);
  }
  if (activeComponents.size > 0) {
    result = result.filter(t => activeComponents.has(t.component));
  }
  return result;
}

// === Board Rendering ===
function renderBoard() {
  const cols = ['backlog', 'todo', 'in_progress', 'done'];
  for (const col of cols) {
    const tasks = filterTasks(allColumns[col] || []);
    $('count-' + col).textContent = tasks.length;
    renderColumn(col, tasks);
  }
}

function renderColumn(col, tasks) {
  const body = $('cards-' + col);
  body.innerHTML = '';
  if (tasks.length === 0) {
    body.innerHTML = '<div class="empty-state">No tasks here</div>';
    return;
  }
  for (const task of tasks) {
    body.appendChild(createCard(task));
  }
}

function createCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';

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
    <div class="card-detail hidden">
      ${task.description ? `<div class="detail-field"><span class="detail-label">Description</span><span class="detail-value">${esc(task.description)}</span></div>` : ''}
      ${task.activeForm ? `<div class="detail-field"><span class="detail-label">Active</span><span class="active-form">${esc(task.activeForm)}</span></div>` : ''}
      ${task.metadata?.feature ? `<div class="detail-field"><span class="detail-label">Feature</span><span class="detail-value">${esc(task.metadata.feature)}</span></div>` : ''}
      ${task.tags?.length ? `<div class="detail-field"><span class="detail-label">Tags</span><span class="detail-value">${task.tags.map(t => esc(t)).join(', ')}</span></div>` : ''}
      <div class="detail-field"><span class="detail-label">Session</span><span class="detail-value" style="font-family:monospace;font-size:11px">${shortSession(task.sessionId)}</span></div>
      <div class="detail-field"><span class="detail-label">Updated</span><span class="detail-value">${task.updatedAt ? new Date(task.updatedAt + ' UTC').toLocaleString() : '—'}</span></div>
    </div>
  `;

  card.addEventListener('click', () => {
    const detail = card.querySelector('.card-detail');
    const expanded = !detail.classList.contains('hidden');
    detail.classList.toggle('hidden', expanded);
    card.classList.toggle('expanded', !expanded);
  });

  return card;
}

// === Init ===
async function loadInitialState() {
  try {
    // Load project info
    const health = await fetch('/api/health').then(r => r.json());
    const name = health.projectCwd ? health.projectCwd.split('/').pop() : '—';
    $('project-name').textContent = name;

    // Load kanban data
    const columns = await fetch('/api/kanban').then(r => r.json());
    handleKanbanUpdate(columns);
  } catch { /* server may not be ready yet */ }
}

// === Done column collapse ===
function initDoneCollapse() {
  const header = $('done-header');
  const body = $('cards-done');
  const col = $('col-done');

  header.addEventListener('click', () => {
    const isCollapsed = col.classList.contains('collapsed');
    col.classList.toggle('collapsed', !isCollapsed);
    body.classList.toggle('hidden', !isCollapsed);
    header.setAttribute('aria-expanded', String(isCollapsed));
  });

  header.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); header.click(); }
  });
}

// === Session filter toggle ===
$('current-session-only').addEventListener('change', e => {
  sessionFilter = e.target.checked;
  renderBoard();
});

// === Theme ===
function initTheme() {
  const saved = localStorage.getItem('task-viewer-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) document.body.classList.add('dark');
  updateThemeIcon();
}
function updateThemeIcon() {
  const btn = $('theme-toggle');
  if (btn) btn.textContent = document.body.classList.contains('dark') ? '☀' : '☽';
}
$('theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('task-viewer-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  updateThemeIcon();
});

// === Boot ===
initTheme();
initDoneCollapse();
connect();
loadInitialState();
