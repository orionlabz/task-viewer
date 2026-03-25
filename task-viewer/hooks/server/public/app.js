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

  const deps = [];
  if (task.blocks?.length) deps.push(`blocks: ${task.blocks.map(b => '#' + b).join(', ')}`);
  if (task.blockedBy?.length) deps.push(`blocked by: ${task.blockedBy.map(b => '#' + b).join(', ')}`);
  if (deps.length) {
    html += `<div class="task-deps">${deps.join(' | ')}</div>`;
  }

  // Detail panel (hidden by default)
  html += `<div class="task-detail hidden" data-detail>`;
  html += `<div class="task-detail-label">Status</div>`;
  html += `<div class="task-detail-value"><span class="task-detail-status ${task.status}">${task.status.replace('_', ' ')}</span></div>`;
  if (task.description) {
    html += `<div class="task-detail-label">Full Description</div>`;
    html += `<div class="task-detail-value">${esc(task.description)}</div>`;
  }
  if (task.activeForm) {
    html += `<div class="task-detail-label">Active Form</div>`;
    html += `<div class="task-detail-value">${esc(task.activeForm)}</div>`;
  }
  if (task.blocks?.length) {
    html += `<div class="task-detail-label">Blocks</div>`;
    html += `<div class="task-detail-value">${task.blocks.map(b => '#' + b).join(', ')}</div>`;
  }
  if (task.blockedBy?.length) {
    html += `<div class="task-detail-label">Blocked By</div>`;
    html += `<div class="task-detail-value">${task.blockedBy.map(b => '#' + b).join(', ')}</div>`;
  }
  html += `</div>`;

  card.innerHTML = html;

  // Click to expand/collapse
  card.addEventListener('click', () => {
    const detail = card.querySelector('[data-detail]');
    const isExpanded = card.classList.contains('expanded');
    // Collapse all other cards
    document.querySelectorAll('.task-card.expanded').forEach(c => {
      if (c !== card) {
        c.classList.remove('expanded');
        c.querySelector('[data-detail]')?.classList.add('hidden');
      }
    });
    card.classList.toggle('expanded', !isExpanded);
    detail.classList.toggle('hidden', isExpanded);
  });

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

// === Theme Toggle ===
function initTheme() {
  const saved = localStorage.getItem('task-viewer-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.body.classList.add('dark');
  }
  updateThemeIcon();
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('task-viewer-theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = $('theme-toggle');
  if (btn) btn.textContent = document.body.classList.contains('dark') ? '\u2600' : '\u263E';
}

$('theme-toggle')?.addEventListener('click', toggleTheme);

// === Init ===
initTheme();
connect();
loadHistory();
