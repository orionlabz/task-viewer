// === State ===
let ws = null;
let reconnectDelay = 1000;
const MAX_RECONNECT = 30000;
let allColumns = { backlog: [], todo: [], in_progress: [], done: [] };
let currentSessionId = null;
let activeComponents = new Set();
let sessionFilter = false;
let currentView = localStorage.getItem('task-viewer-view') || 'kanban';
let selectedTask = null;

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
  if (!selectedTask) updatePanelStats();
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
    const rows = document.createElement('div');
    rows.className = 'list-rows' + (startCollapsed ? ' hidden' : '');

    header.addEventListener('click', () => {
      const collapsed = section.classList.toggle('collapsed');
      rows.classList.toggle('hidden', collapsed);
    });

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

// === Init ===
async function loadInitialState() {
  try {
    // Load project info
    const health = await fetch('/api/health').then(r => r.json());
    const name = health.projectCwd ? health.projectCwd.split('/').pop() : '—';
    $('project-name').textContent = name;
    $('panel-project-name').textContent = name;
    if (health.branch) $('panel-branch').textContent = health.branch;

    // Load kanban data
    const columns = await fetch('/api/kanban').then(r => r.json());
    handleKanbanUpdate(columns);

    // Load panel idle data
    loadPanelIdle();
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

// === View Toggle ===
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

// === Panel Idle State ===
async function loadPanelIdle() {
  try {
    // Stats from kanban data (already loaded in allColumns)
    updatePanelStats();

    // Sessions count
    const sessions = await fetch('/api/sessions').then(r => r.json());
    $('stat-sessions').textContent = Array.isArray(sessions) ? sessions.length : '—';

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

// === Panel Detail ===
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
    const prevTs = events[i-1].createdAt ? new Date(events[i-1].createdAt + ' UTC').getTime() : NaN;
    const currTs = events[i].createdAt   ? new Date(events[i].createdAt   + ' UTC').getTime() : NaN;
    const withinWindow = !isNaN(prevTs) && !isNaN(currTs) && (currTs - prevTs) / 1000 <= windowSeconds;
    if (withinWindow || isNaN(prevTs) || isNaN(currTs)) {
      current.push(events[i]);
    } else {
      bursts.push(current);
      current = [events[i]];
    }
  }
  bursts.push(current);
  return bursts;
}

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

// === Theme ===
function updateThemeIcon() {
  const btn = $('theme-toggle');
  if (btn) btn.textContent = document.body.classList.contains('light') ? '☽' : '☀';
}
function initTheme() {
  const saved = localStorage.getItem('task-viewer-theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  if (saved === 'light' || (!saved && prefersLight)) document.body.classList.add('light');
  updateThemeIcon();
  $('current-session-only').addEventListener('change', e => {
    sessionFilter = e.target.checked;
    renderBoard();
  });
  $('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('task-viewer-theme', document.body.classList.contains('light') ? 'light' : 'dark');
    updateThemeIcon();
  });
}

// === Boot ===
initTheme();
initDoneCollapse();
initViewToggle();
initPanel();
connect();
loadInitialState();
