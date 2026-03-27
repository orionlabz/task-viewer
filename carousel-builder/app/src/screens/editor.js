import { S, scheduleSave } from '../state.js';
import { api } from '../api.js';
import { navigate } from '../router.js';
import { themeStyleBlock } from '../theme.js';
import { getRenderer, LAYOUT_NAMES } from '../renderers.js';
import { fRich } from '../panel.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const SLIDE_DEFAULTS = {
  cover:   { template: 'cover',   layout: 'a', headline: '', headline_italic: '', body: '' },
  split:   { template: 'split',   layout: 'a', headline: '', headline_italic: '', body: '' },
  dark:    { template: 'dark',    layout: 'a', section_number: '', section_title: '', body: '', list_items: [], conclusion: '' },
  steps:   { template: 'steps',   layout: 'a', section_title: null, steps: [], call_to_action: '', call_to_action_italic: '' },
  overlay: { template: 'overlay', layout: 'a', section_number: '', section_title: '', headline: '', body: '' },
  cta:     { template: 'cta',     layout: 'a', headline: '', headline_italic: '', body: '', cta_text: '', cta_word: '', cta_suffix: '' },
};

const TPL_LABELS = {
  cover: 'Capa', split: 'Dividido', dark: 'Conteúdo',
  steps: 'Etapas', overlay: 'Overlay', cta: 'CTA',
};

// Placeholder slide content for picker thumbnails
const SAMPLE_SLIDES = {
  cover:   { template: 'cover',   layout: 'a', headline_html: 'Título Principal', body_html: 'Subtítulo do slide' },
  split:   { template: 'split',   layout: 'a', headline_html: 'Título', body_html: 'Texto do slide' },
  dark:    { template: 'dark',    layout: 'a', section_number: '01', section_title: 'Seção', body_html: 'Conteúdo principal.', list_items: ['Item um', 'Item dois', 'Item três'], conclusion_html: 'Conclusão' },
  steps:   { template: 'steps',   layout: 'a', section_title: null, steps: [{label:'1',text_html:'Primeiro'},{label:'2',text_html:'Segundo'},{label:'3',text_html:'Terceiro'}], call_to_action_html: 'Próximo passo' },
  overlay: { template: 'overlay', layout: 'a', section_number: '02', section_title: 'Título', headline_html: 'Headline principal', body_html: 'Texto de apoio' },
  cta:     { template: 'cta',     layout: 'a', headline_html: 'Chamada para ação', body_html: 'Descrição', cta_text: 'Comece agora', cta_word: 'Comece', cta_suffix: 'hoje' },
};

// Fields to migrate when changing template type
const FIELD_TEMPLATES = {
  headline_html:       ['cover', 'split', 'overlay', 'cta'],
  body_html:           ['cover', 'split', 'dark', 'overlay', 'cta'],
  section_number:      ['dark', 'overlay'],
  section_title:       ['dark', 'steps', 'overlay'],
  conclusion_html:     ['dark'],
  call_to_action_html: ['steps'],
  list_items:          ['dark'],
};

// ─── Legacy in-editor loading (unused after full-screen generating) ───────────
let loadingTimers = [];

// ─── Full-screen generating view ──────────────────────────────────────────────
let _genTimer = null;
let _genEntryId = 0;
let _previewTimer = null;

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const SVG_BACK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`;
const SVG_DOWNLOAD = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
const SVG_X = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
const SVG_UPLOAD = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>`;
const SVG_PNG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
const SVG_PDF = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;

function showGeneratingScreen(topic) {
  clearInterval(_genTimer);
  _genEntryId = 0;
  document.getElementById('app').innerHTML = `
    <div class="generating-screen">
      <div class="generating-inner">
        <div class="generating-label">Gerando carrossel</div>
        <div class="generating-topic">${esc(topic)}</div>
        <div class="gen-bar-wrap"><div id="gen-bar" class="gen-bar"></div></div>
        <div id="gen-log" class="gen-log"></div>
        <div id="gen-elapsed" class="gen-elapsed">0s</div>
      </div>
    </div>`;
  let secs = 0;
  _genTimer = setInterval(() => {
    secs++;
    const el = document.getElementById('gen-elapsed');
    if (el) el.textContent = secs + 's';
  }, 1000);
}

function genLog(msg, status = 'pending') {
  const log = document.getElementById('gen-log');
  if (!log) return null;
  const id = 'ge' + (_genEntryId++);
  const div = document.createElement('div');
  div.className = `gen-entry gen-${status}`;
  div.id = id;
  div.innerHTML = `<span class="gen-dot"></span><span class="gen-msg">${esc(msg)}</span>`;
  log.appendChild(div);
  requestAnimationFrame(() => requestAnimationFrame(() => div.classList.add('in')));
  log.scrollTop = log.scrollHeight;
  return id;
}

function genLogDone(id) {
  document.getElementById(id)?.classList.replace('gen-pending', 'gen-done');
}

function genLogErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.replace('gen-pending', 'gen-error');
  if (msg) el.querySelector('.gen-msg').textContent = msg;
}

function setGenBar(pct) {
  const bar = document.getElementById('gen-bar');
  if (bar) bar.style.width = pct + '%';
}

function stopGeneratingScreen() {
  clearInterval(_genTimer);
  _genTimer = null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function slideDoc(index) {
  const slide = S.slides[index];
  if (!slide) return `<!DOCTYPE html><html><body style="background:#111;width:1080px;height:1350px;"></body></html>`;
  const fn = getRenderer(slide);
  const body = fn(slide, S.images[index] || null, S.theme);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${themeStyleBlock(S.theme)}</head><body style="margin:0;overflow:hidden;">${body}</body></html>`;
}

// ─── Loading overlay ──────────────────────────────────────────────────────────
function startLoading(topic) {
  const overlay = document.getElementById('canvas-loading');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  const topicEl = document.getElementById('loading-topic');
  if (topicEl) topicEl.textContent = topic || '';
  const bar = document.getElementById('loading-bar');
  if (bar) bar.style.width = '0%';
  document.querySelectorAll('.loading-step').forEach(el => {
    el.classList.remove('active', 'done');
    const icon = el.querySelector('.step-icon');
    if (icon) icon.textContent = '';
  });

  let elapsed = 0;
  const elapsedEl = document.getElementById('loading-elapsed');
  if (elapsedEl) elapsedEl.textContent = '0s';
  const ticker = setInterval(() => {
    elapsed++;
    if (elapsedEl) elapsedEl.textContent = elapsed + 's';
  }, 1000);
  loadingTimers.push(ticker);

  STEP_DELAYS.forEach((delay, i) => {
    const t = setTimeout(() => {
      if (i > 0) {
        const prev = document.getElementById('step-' + (i - 1));
        if (prev) {
          prev.classList.remove('active');
          prev.classList.add('done');
          const icon = prev.querySelector('.step-icon');
          if (icon) icon.textContent = '✓';
        }
      }
      const cur = document.getElementById('step-' + i);
      if (cur) cur.classList.add('active');
      if (bar) bar.style.width = BAR_TARGETS[i] + '%';
    }, delay);
    loadingTimers.push(t);
  });
}

function stopLoading() {
  loadingTimers.forEach(t => { clearInterval(t); clearTimeout(t); });
  loadingTimers = [];
  const overlay = document.getElementById('canvas-loading');
  if (overlay) overlay.classList.add('hidden');
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderAll() {
  renderSidebar();
  renderPreview();
  renderPanel();
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.innerHTML = '';
  const countEl = document.createElement('div');
  countEl.className = 'sidebar-count';
  countEl.textContent = `${S.slides.length} slide${S.slides.length !== 1 ? 's' : ''}`;
  sidebar.appendChild(countEl);
  S.slides.forEach((slide, i) => {
    const item = document.createElement('div');
    item.className = 'thumb-item' + (i === S.active ? ' active' : '');
    item.onclick = () => setActive(i);
    const wrap = document.createElement('div');
    wrap.className = 'thumb-wrap';
    const iframe = document.createElement('iframe');
    iframe.srcdoc = slideDoc(i);
    iframe.title = 'Slide ' + (i + 1);
    const shimmer = document.createElement('div');
    shimmer.className = 'iframe-shimmer';
    wrap.appendChild(iframe);
    wrap.appendChild(shimmer);
    iframe.addEventListener('load', () => shimmer.remove(), { once: true });
    const label = document.createElement('div');
    label.className = 'thumb-label';
    label.textContent = (i + 1) + ' · ' + slide.template;
    item.appendChild(wrap);
    item.appendChild(label);
    sidebar.appendChild(item);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'btn-add-slide';
  addBtn.textContent = '+ Slide';
  addBtn.onclick = addSlide;
  sidebar.appendChild(addBtn);
}

function renderPreview() {
  const col = document.getElementById('preview-col');
  const wrap = document.getElementById('preview-wrap');
  if (!col || !wrap) return;

  const avH = col.clientHeight - 80;
  const avW = col.clientWidth - 32;
  const scale = Math.min(avH / 1350, avW / 1080, 1);
  const w = Math.round(1080 * scale);
  const h = Math.round(1350 * scale);

  // Reuse existing iframe to avoid flicker — only recreate when layout changes
  let iframe = wrap.querySelector('iframe');
  if (!iframe || wrap.dataset.pw !== String(w) || wrap.dataset.ph !== String(h)) {
    wrap.style.width      = w + 'px';
    wrap.style.height     = h + 'px';
    wrap.style.overflow   = 'hidden';
    wrap.style.flexShrink = '0';
    wrap.dataset.pw = w;
    wrap.dataset.ph = h;
    // Remove any transform overlay before clearing
    const overlay = wrap.querySelector('.img-transform-overlay');
    if (overlay) overlay.remove();
    wrap.innerHTML = '';
    iframe = document.createElement('iframe');
    iframe.style.width           = '1080px';
    iframe.style.height          = '1350px';
    iframe.style.transformOrigin = 'top left';
    iframe.style.transform       = `scale(${scale})`;
    iframe.style.border          = 'none';
    iframe.style.display         = 'block';
    iframe.title = 'Preview';
    wrap.appendChild(iframe);
    // Show shimmer until first load completes
    const shimmer = document.createElement('div');
    shimmer.className = 'iframe-shimmer';
    wrap.appendChild(shimmer);
    iframe.addEventListener('load', () => shimmer.remove(), { once: true });
  }

  // Write directly to iframe body when already loaded — avoids blank reload flash
  // Guard: only skip srcdoc if head already has the theme <style> (i.e. fully initialized)
  const iframeDoc = iframe.contentDocument;
  const activeSlide = S.slides[S.active];
  if (iframeDoc?.head?.querySelector('style') && activeSlide) {
    const fn = getRenderer(activeSlide);
    iframeDoc.body.style.margin = '0';
    iframeDoc.body.style.overflow = 'hidden';
    iframeDoc.body.innerHTML = fn(activeSlide, S.images[S.active] || null, S.theme);
  } else {
    iframe.srcdoc = slideDoc(S.active);
  }
  const counter = document.getElementById('slide-counter');
  if (counter) counter.textContent = `${S.active + 1} / ${S.slides.length}`;
}

// ─── Template + Layout Picker ─────────────────────────────────────────────────
function buildTemplatePicker(currentSlide) {
  const root = document.createElement('div');
  root.className = 'tpl-picker';

  // Header: current selection + toggle button
  const hdr = document.createElement('div');
  hdr.className = 'tpl-picker-header';

  const curLabel = document.createElement('span');
  curLabel.className = 'tpl-current-label';
  const curLayout = currentSlide.layout || 'a';
  curLabel.textContent = `${TPL_LABELS[currentSlide.template] || currentSlide.template} · ${LAYOUT_NAMES[currentSlide.template]?.[curLayout] || curLayout.toUpperCase()}`;

  const toggle = document.createElement('button');
  toggle.className = 'tpl-toggle';
  toggle.textContent = '▾ Mudar';

  hdr.appendChild(curLabel);
  hdr.appendChild(toggle);
  root.appendChild(hdr);

  // Grid
  const grid = document.createElement('div');
  grid.className = 'tpl-grid-wrap';

  Object.entries(LAYOUT_NAMES).forEach(([template, variants]) => {
    const sec = document.createElement('div');
    sec.className = 'tpl-section';

    const secLbl = document.createElement('div');
    secLbl.className = 'tpl-section-label';
    secLbl.textContent = TPL_LABELS[template] || template;
    sec.appendChild(secLbl);

    const row = document.createElement('div');
    row.className = 'tpl-row';

    Object.entries(variants).forEach(([layout, name]) => {
      const isActive = currentSlide.template === template && curLayout === layout;

      const card = document.createElement('div');
      card.className = 'tpl-card' + (isActive ? ' active' : '');
      card.title = `${TPL_LABELS[template]} · ${name}`;

      const thumb = document.createElement('div');
      thumb.className = 'tpl-thumb';
      const iframe = document.createElement('iframe');
      const sample = { ...SAMPLE_SLIDES[template], layout };
      iframe.srcdoc = `<!DOCTYPE html><html><head>${themeStyleBlock(S.theme)}</head><body style="margin:0;overflow:hidden;">${getRenderer(sample)(sample, null, S.theme)}</body></html>`;
      thumb.appendChild(iframe);
      card.appendChild(thumb);

      const ltr = document.createElement('div');
      ltr.className = 'tpl-card-ltr';
      ltr.textContent = name;
      card.appendChild(ltr);

      card.onclick = () => {
        changeTemplateLayout(template, layout);
        // Update header label inline (renderAll will re-render panel if template changed)
        curLabel.textContent = `${TPL_LABELS[template]} · ${name}`;
        // Close grid
        grid.classList.remove('open');
        toggle.textContent = '▾ Mudar';
      };

      row.appendChild(card);
    });

    sec.appendChild(row);
    grid.appendChild(sec);
  });

  toggle.onclick = () => {
    const open = grid.classList.toggle('open');
    toggle.textContent = open ? '▴ Fechar' : '▾ Mudar';
  };

  root.appendChild(grid);
  return root;
}

function changeTemplateLayout(template, layout) {
  const slide = S.slides[S.active];
  const prevLayout = slide.layout || 'a';

  if (slide.template === template && prevLayout === layout) return;

  if (slide.template === template) {
    // Same template — just swap layout, no full re-render needed
    slide.layout = layout;
    refreshThumb(S.active);
    renderPreview();
    scheduleSave();
    return;
  }

  // Template change: build new slide with migrated fields
  const next = { ...SLIDE_DEFAULTS[template], layout };
  for (const [field, supported] of Object.entries(FIELD_TEMPLATES)) {
    if (supported.includes(template) && slide[field] != null) {
      next[field] = slide[field];
    }
  }
  if (slide.img_position) next.img_position = slide.img_position;
  S.slides[S.active] = next;

  // Drop image if new template doesn't support it
  if (!['cover', 'split', 'overlay'].includes(template)) {
    delete S.images[S.active];
  }

  renderAll();
  scheduleSave();
}

function renderPanel() {
  const panel = document.getElementById('edit-panel');
  if (!panel) return;
  const slide = S.slides[S.active];
  if (!slide) { panel.innerHTML = ''; return; }

  const tpl = slide.template;
  const hasImg = ['cover', 'split', 'overlay'].includes(tpl);
  const imgSrc = S.images[S.active];
  const canDel = S.slides.length > 1;

  function fToggle(key, label, checked) {
    return `<div class="field-group field-toggle-row">
      <span class="field-label">${esc(label)}</span>
      <label class="toggle-switch">
        <input type="checkbox" data-key="${esc(key)}" data-type="boolean" ${checked ? 'checked' : ''}>
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
      </label>
    </div>`;
  }
  function fText(key, label, val) {
    return `<div class="field-group"><div class="field-label">${esc(label)}</div>
      <input class="field-input" value="${esc(val || '')}" data-key="${esc(key)}"></div>`;
  }
  function fArea(key, label, val) {
    return `<div class="field-group"><div class="field-label">${esc(label)}</div>
      <textarea class="field-textarea" data-key="${esc(key)}">${esc(val || '')}</textarea></div>`;
  }

  let html = `<div class="panel-header">
    <div class="panel-title">Slide ${S.active + 1}</div>
    ${canDel ? '<button class="btn-delete" id="btn-delete-slide">Excluir</button>' : ''}
  </div>
  <div id="tpl-picker-slot"></div>`;

  if (hasImg) {
    const suggestions = (!imgSrc && slide.img_suggestions?.length)
      ? slide.img_suggestions
      : [];
    html += `<div class="field-group"><div class="field-label">Imagem</div>
      ${imgSrc
        ? `<div class="img-preview-wrap">
             <img class="img-preview" src="${imgSrc}">
             <button class="btn-remove-img" id="btn-remove-img">Remover</button>
           </div>`
        : `<div class="drop-zone">
             <input type="file" accept="image/*" id="inp-img">
             <div class="drop-zone-icon">${SVG_UPLOAD}</div>
             <div class="drop-zone-text">Clique para fazer upload<br>JPG · PNG · WEBP</div>
           </div>`
      }
      ${suggestions.length ? `<div class="img-suggestions-label">Sugestões de imagem</div>
        <div class="img-suggestions">
          ${suggestions.map(s => `<button class="img-suggestion-chip" data-suggestion="${esc(s)}">${esc(s)}</button>`).join('')}
        </div>` : ''}
    </div>`;
    if (imgSrc) {
      html += `<div class="field-group">
        <button class="btn-adjust-img" id="btn-adjust-img">↔ Reposicionar / Zoom</button>
      </div>`;
    }
  }

  if (tpl === 'cover' || tpl === 'split') {
    html += `<div data-rich="headline_html"></div>`;
    html += `<div data-rich="body_html"></div>`;
  }
  if (tpl === 'dark') {
    html += fText('section_number', 'Número da seção', slide.section_number);
    html += fText('section_title', 'Título da seção', slide.section_title);
    html += `<div data-rich="body_html"></div>`;
    html += `<div class="field-group"><div class="field-label">Itens da lista</div>
      <div class="list-items-wrap" id="list-items-wrap">
        ${(slide.list_items || []).map((item, i) =>
          `<div class="list-item-row">
            <input class="field-input" value="${esc(item)}" data-list-idx="${i}">
            <button class="btn-remove" data-list-remove="${i}" aria-label="Remover item">${SVG_X}</button>
          </div>`
        ).join('')}
      </div>
      ${(slide.list_items || []).length < 4 ? '<button class="btn-add-item" id="btn-add-list-item">+ Adicionar</button>' : ''}
    </div>`;
    html += `<div data-rich="conclusion_html"></div>`;
  }
  if (tpl === 'steps') {
    html += fText('section_title', 'Título (opcional)', slide.section_title || '');
    html += `<div class="field-group"><div class="field-label">Etapas</div>
      <div class="steps-wrap" id="steps-wrap">
        ${(slide.steps || []).map((step, i) =>
          `<div class="step-row">
            <div class="step-row-top">
              <input class="field-input step-label-input" value="${esc(step.label)}" placeholder="Etapa ${i + 1}" data-step-idx="${i}" data-step-field="label">
              <button class="btn-remove" data-step-remove="${i}" aria-label="Remover etapa">${SVG_X}</button>
            </div>
            <div data-rich="step_text_html_${i}"></div>
            ${slide.layout === 'c' ? renderIconPicker(i, (slide.steps[i] || {}).icon) : ''}
          </div>`
        ).join('')}
      </div>
      ${(slide.steps || []).length < 4 ? '<button class="btn-add-item" id="btn-add-step">+ Etapa</button>' : ''}
    </div>`;
    html += `<div data-rich="call_to_action_html"></div>`;
  }
  if (tpl === 'overlay') {
    html += fText('section_number', 'Número da seção', slide.section_number);
    html += fText('section_title', 'Título', slide.section_title);
    html += `<div data-rich="headline_html"></div>`;
    html += `<div data-rich="body_html"></div>`;
    if (slide.layout === 'c') {
      html += fToggle('bg_blur_disabled', 'Desativar fundo desfocado', !!slide.bg_blur_disabled);
    }
  }
  if (tpl === 'cta') {
    html += `<div data-rich="headline_html"></div>`;
    html += `<div data-rich="body_html"></div>`;
    html += fText('cta_text', 'Texto do CTA', slide.cta_text);
    html += fText('cta_word', 'Palavra em destaque', slide.cta_word);
    html += fText('cta_suffix', 'Sufixo do CTA', slide.cta_suffix);
  }

  html += `<div class="refine-section">
    <div class="field-label">✦ Refinar com IA</div>
    <textarea id="refine-instr" class="field-textarea" placeholder="O que você quer mudar neste slide?" rows="3"></textarea>
    <div class="refine-actions">
      <button id="btn-refine-ok" class="btn-confirm">Refinar</button>
    </div>
  </div>`;

  panel.innerHTML = html;

  // Mount template picker
  panel.querySelector('#tpl-picker-slot')?.replaceWith(buildTemplatePicker(slide));

  // ── Mount rich-text editors over placeholder divs ─────────────────────────
  const onUpdate = () => { refreshThumb(S.active); renderPreview(); scheduleSave(); };

  const RICH_LABELS = {
    headline_html:       'Headline',
    body_html:           'Corpo',
    conclusion_html:     'Conclusão',
    call_to_action_html: 'Chamada final',
  };

  panel.querySelectorAll('[data-rich]').forEach(placeholder => {
    const key = placeholder.dataset.rich;

    // Step text fields: data-rich="step_text_html_N"
    const stepMatch = key.match(/^step_text_html_(\d+)$/);
    if (stepMatch) {
      const idx = Number(stepMatch[1]);
      const step = slide.steps?.[idx];
      if (!step) return;
      // Ensure text_html exists — migrate from plain text if needed
      if (!step.text_html && step.text) {
        step.text_html = String(step.text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      const el = fRich(step, 'text_html', 'Texto da etapa', onUpdate);
      placeholder.replaceWith(el);
      return;
    }

    // Top-level fields
    const label = RICH_LABELS[key] || key;
    const el = fRich(slide, key, label, onUpdate);
    placeholder.replaceWith(el);
  });

  // Wire up field inputs
  panel.querySelectorAll('input[data-key], textarea[data-key]').forEach(el => {
    if (el.dataset.type === 'boolean') {
      el.addEventListener('change', () => setField(el.dataset.key, el.checked));
    } else {
      el.addEventListener('input', () => setField(el.dataset.key, el.value));
    }
  });

  const delBtn = panel.querySelector('#btn-delete-slide');
  if (delBtn) delBtn.onclick = deleteSlide;

  const removeImgBtn = panel.querySelector('#btn-remove-img');
  if (removeImgBtn) removeImgBtn.onclick = removeImg;

  const inpImg = panel.querySelector('#inp-img');
  if (inpImg) inpImg.onchange = (e) => uploadImg(e);

  const dropZone = panel.querySelector('.drop-zone');
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      uploadImgFile(e.dataTransfer.files[0]);
    });
  }

  const adjustImgBtn = panel.querySelector('#btn-adjust-img');
  if (adjustImgBtn) adjustImgBtn.onclick = showImgTransformOverlay;

  panel.querySelectorAll('.img-suggestion-chip').forEach(btn => {
    btn.onclick = () => {
      navigator.clipboard.writeText(btn.dataset.suggestion).catch(() => {});
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1500);
    };
  });

  // List items
  panel.querySelectorAll('input[data-list-idx]').forEach(el => {
    el.addEventListener('input', () => setListItem(Number(el.dataset.listIdx), el.value));
  });
  panel.querySelectorAll('[data-list-remove]').forEach(btn => {
    btn.onclick = () => removeListItem(Number(btn.dataset.listRemove));
  });
  const addListBtn = panel.querySelector('#btn-add-list-item');
  if (addListBtn) addListBtn.onclick = addListItem;

  // Steps
  panel.querySelectorAll('input[data-step-idx]').forEach(el => {
    el.addEventListener('input', () => setStep(Number(el.dataset.stepIdx), el.dataset.stepField, el.value));
  });
  panel.querySelectorAll('[data-step-remove]').forEach(btn => {
    btn.onclick = () => removeStep(Number(btn.dataset.stepRemove));
  });
  const addStepBtn = panel.querySelector('#btn-add-step');
  if (addStepBtn) addStepBtn.onclick = addStep;

  // Refine
  const refineOk = panel.querySelector('#btn-refine-ok');
  if (refineOk) refineOk.onclick = doRefine;

  // Icon pickers for steps layout c
  wireIconPickers();
}

// ─── Icon picker (for steps layout c) ────────────────────────────────────────
function getLucideSVG(name, size = 48, color = '#333') {
  if (!window.lucide || !lucide.icons[name]) return null;
  const [, , children] = lucide.icons[name];
  const childSVG = children.map(([tag, a]) => {
    const attrStr = Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ');
    return `<${tag} ${attrStr}/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${childSVG}</svg>`;
}

function searchLucideIcons(query) {
  if (!window.lucide) return [];
  return Object.keys(lucide.icons)
    .filter(n => n.includes(query.toLowerCase().replace(/\s+/g, '-')))
    .slice(0, 30);
}

function renderIconPicker(stepIdx, currentIcon) {
  const svg = currentIcon?.type === 'lucide' && currentIcon.svg ? currentIcon.svg : null;
  const uploadSrc = currentIcon?.type === 'upload' ? currentIcon.src : null;
  const previewHTML = svg
    ? svg
    : uploadSrc
      ? `<img src="${uploadSrc}" style="width:18px;height:18px;object-fit:contain;">`
      : `<div style="width:18px;height:18px;border:1px dashed #333;border-radius:3px;"></div>`;

  return `<div class="icon-picker" id="icon-picker-${stepIdx}">
    <div class="field-label">Ícone</div>
    <div class="icon-current">${previewHTML}<span style="font-size:11px;color:#555;">${esc(currentIcon?.name || 'nenhum')}</span></div>
    <div class="icon-search-wrap">
      <input class="field-input icon-search-input" placeholder="buscar ícone…" data-icon-search="${stepIdx}">
    </div>
    <div id="icon-grid-${stepIdx}" class="icon-grid"></div>
    <div style="display:flex;align-items:center;gap:6px;">
      <span class="field-label" style="margin:0;">ou upload</span>
      <input type="file" accept="image/png,image/svg+xml" style="font-size:11px;color:#666;flex:1;" data-icon-upload="${stepIdx}">
    </div>
  </div>`;
}

function wireIconPickers() {
  const panel = document.getElementById('edit-panel');
  if (!panel) return;
  panel.querySelectorAll('[data-icon-search]').forEach(inp => {
    const idx = Number(inp.dataset.iconSearch);
    inp.addEventListener('input', () => renderIconGrid(idx, inp.value));
  });
  panel.querySelectorAll('[data-icon-upload]').forEach(inp => {
    const idx = Number(inp.dataset.iconUpload);
    inp.onchange = () => handleIconUpload(idx, inp);
  });
}

function renderIconGrid(stepIdx, query) {
  const grid = document.getElementById('icon-grid-' + stepIdx);
  if (!grid || !query) { if (grid) grid.innerHTML = ''; return; }
  const names = searchLucideIcons(query);
  const slide = S.slides[S.active];
  const current = slide?.steps?.[stepIdx]?.icon?.name;
  grid.innerHTML = names.map(name => {
    const svg = getLucideSVG(name, 14, '#888');
    if (!svg) return '';
    return `<button class="icon-btn${name === current ? ' selected' : ''}" title="${esc(name)}" data-icon-name="${esc(name)}" data-step-idx="${stepIdx}">${svg}</button>`;
  }).join('');
  grid.querySelectorAll('.icon-btn').forEach(btn => {
    btn.onclick = () => pickLucideIcon(Number(btn.dataset.stepIdx), btn.dataset.iconName);
  });
}

function pickLucideIcon(stepIdx, name) {
  const svg = getLucideSVG(name, 48, '#333');
  if (!svg) return;
  setStepIcon(stepIdx, { type: 'lucide', name, svg });
}

function handleIconUpload(stepIdx, input) {
  const file = input.files[0];
  if (!file) return;
  if (!['image/png', 'image/svg+xml'].includes(file.type)) return;
  const reader = new FileReader();
  reader.onload = e => {
    let src = e.target.result;
    if (file.type === 'image/svg+xml') {
      src = 'data:image/svg+xml;base64,' + btoa(
        atob(src.split(',')[1]).replace(/<script[\s\S]*?<\/script>/gi, '')
      );
    }
    setStepIcon(stepIdx, { type: 'upload', src });
  };
  reader.readAsDataURL(file);
}

function setStepIcon(stepIdx, iconData) {
  const slide = S.slides[S.active];
  if (!slide || !slide.steps || !slide.steps[stepIdx]) return;
  slide.steps[stepIdx].icon = iconData;
  refreshThumb(S.active);
  renderPreview();
  renderPanel();
  scheduleSave();
}

// ─── Image transform overlay ──────────────────────────────────────────────────
function showImgTransformOverlay() {
  const wrap = document.getElementById('preview-wrap');
  if (!wrap) return;
  const imgSrc = S.images[S.active];
  if (!imgSrc) return;
  const slide = S.slides[S.active];

  // Remove existing overlay if any
  wrap.querySelector('.img-transform-overlay')?.remove();

  const pos = { ...(slide.img_position || { x: 50, y: 50, scale: 1 }) };

  const overlay = document.createElement('div');
  overlay.className = 'img-transform-overlay';

  const img = document.createElement('img');
  img.className = 'img-transform-img';
  img.src = imgSrc;
  img.draggable = false;

  const handle = document.createElement('div');
  handle.className = 'img-transform-handle';
  handle.title = 'Arraste para zoom';
  handle.textContent = '⤡';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'img-transform-close';
  closeBtn.textContent = '✕';
  closeBtn.title = 'Fechar';

  const hint = document.createElement('div');
  hint.className = 'img-transform-hint';
  hint.textContent = 'Arraste para mover · canto inferior direito para zoom';

  overlay.appendChild(img);
  overlay.appendChild(handle);
  overlay.appendChild(closeBtn);
  overlay.appendChild(hint);
  wrap.appendChild(overlay);

  function applyPos() {
    img.style.objectPosition = `${pos.x}% ${pos.y}%`;
    img.style.transform = `scale(${pos.scale})`;
    img.style.transformOrigin = `${pos.x}% ${pos.y}%`;
  }
  applyPos();

  let dragState = null;

  overlay.addEventListener('mousedown', e => {
    if (e.target === closeBtn || e.target === handle) return;
    e.preventDefault();
    dragState = { type: 'pan', x0: e.clientX, y0: e.clientY, px0: pos.x, py0: pos.y };
    overlay.classList.add('dragging');
  });

  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    e.stopPropagation();
    dragState = { type: 'scale', y0: e.clientY, s0: pos.scale };
  });

  function onMove(e) {
    if (!dragState) return;
    const rect = wrap.getBoundingClientRect();
    if (dragState.type === 'pan') {
      const dx = (e.clientX - dragState.x0) / rect.width * 100;
      const dy = (e.clientY - dragState.y0) / rect.height * 100;
      pos.x = Math.max(0, Math.min(100, dragState.px0 - dx * (pos.scale - 0.6)));
      pos.y = Math.max(0, Math.min(100, dragState.py0 - dy * (pos.scale - 0.6)));
    } else {
      const dy = (dragState.y0 - e.clientY) / 120;
      pos.scale = Math.max(1, Math.min(5, dragState.s0 + dy));
    }
    applyPos(); // instant visual feedback via overlay
    slide.img_position = { x: Math.round(pos.x * 10) / 10, y: Math.round(pos.y * 10) / 10, scale: Math.round(pos.scale * 100) / 100 };
  }

  function onUp() {
    if (!dragState) return;
    dragState = null;
    overlay.classList.remove('dragging');
    // Update iframe and thumbnail once drag ends
    refreshThumb(S.active);
    renderPreview();
    scheduleSave();
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);

  closeBtn.onclick = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    overlay.remove();
  };
}

// ─── Export ───────────────────────────────────────────────────────────────────
async function exportPDF() {
  const win = window.open('', '_blank', 'width=1200,height=900');
  if (!win) { alert('Popup bloqueado. Permita popups para exportar.'); return; }

  const { themeStyleBlock: tsb } = await import('../theme.js');
  const { getRenderer: gr } = await import('../renderers.js');

  const slidesHTML = S.slides.map((slide, i) => {
    const fn = gr(slide);
    return `<div class="sp">${fn(slide, S.images[i] || null, S.theme)}</div>`;
  }).join('\n');

  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${esc(S.carousel?.title || 'Carrossel')}</title>
${tsb(S.theme)}
<style>
@page { size: 1080px 1350px; margin: 0; }
*, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
html, body { margin: 0; padding: 0; background: #000; }
.sp { width: 1080px; height: 1350px; overflow: hidden; break-after: page; }
</style></head><body>${slidesHTML}
<script>document.fonts.ready.then(()=>window.print());<\/script>
</body></html>`);
  win.document.close();
}

// Pre-render an image to canvas simulating object-fit:cover + img_position + scale
async function preRenderImageForExport(imgSrc, imgPosition, containerW, containerH) {
  const img = new Image();
  img.src = imgSrc;
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; }).catch(() => null);
  if (!img.naturalWidth) return null;

  const { x = 50, y = 50, scale = 1 } = imgPosition || {};
  const canvas = document.createElement('canvas');
  canvas.width = containerW;
  canvas.height = containerH;
  const ctx = canvas.getContext('2d');

  // object-fit: cover → scale to fill container, then apply user scale
  const coverScale = Math.max(containerW / img.naturalWidth, containerH / img.naturalHeight) * scale;
  const drawW = img.naturalWidth * coverScale;
  const drawH = img.naturalHeight * coverScale;

  // object-position: x% y%
  const drawX = (containerW - drawW) * (x / 100);
  const drawY = (containerH - drawH) * (y / 100);

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  return canvas.toDataURL('image/png');
}

async function exportPNG() {
  if (!window.html2canvas) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload = res;
      s.onerror = () => rej(new Error('Falha ao carregar html2canvas'));
      document.head.appendChild(s);
    }).catch(() => { alert('Não foi possível carregar o exportador. Verifique sua conexão.'); });
    if (!window.html2canvas) return;
  }

  for (let i = 0; i < S.slides.length; i++) {
    const imgSrc = S.images[i];
    const slide = S.slides[i];

    // Pre-render background image with correct crop/position/scale before html2canvas sees it
    const preRendered = imgSrc
      ? await preRenderImageForExport(imgSrc, slide.img_position, 1080, 1350)
      : null;

    // Render slide in a full-size iframe so CSS vars, fonts and layouts are correct
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-1200px;top:0;width:1080px;height:1350px;border:none;';
    iframe.srcdoc = slideDoc(i);
    document.body.appendChild(iframe);

    await new Promise(res => {
      iframe.onload = () => setTimeout(res, 400);
      setTimeout(res, 2000); // failsafe
    });

    // Replace object-fit:cover images with the pre-rendered canvas version
    if (preRendered && iframe.contentDocument) {
      iframe.contentDocument.querySelectorAll('img').forEach(img => {
        if (img.style.objectFit === 'cover') {
          const filter = img.style.filter;
          img.src = preRendered;
          img.style.cssText = `width:100%;height:100%;display:block;${filter ? 'filter:' + filter + ';' : ''}`;
        }
      });
      // Let the replaced image render
      await new Promise(r => setTimeout(r, 100));
    }

    const canvas = await window.html2canvas(iframe.contentDocument.body, {
      width: 1080,
      height: 1350,
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });

    document.body.removeChild(iframe);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `slide-${String(i + 1).padStart(2, '0')}.png`;
    a.click();

    await new Promise(r => setTimeout(r, 200));
  }
}

// ─── Slide mutations ──────────────────────────────────────────────────────────
function setActive(i) {
  S.active = i;
  document.querySelector('.img-transform-overlay')?.remove();
  // Update active class without rebuilding sidebar iframes
  document.querySelectorAll('.thumb-item').forEach((el, idx) => {
    el.classList.toggle('active', idx === i);
  });
  renderPreview();
  renderPanel();
}

function setField(key, val) {
  S.slides[S.active][key] = val;
  refreshThumb(S.active);
  clearTimeout(_previewTimer);
  _previewTimer = setTimeout(renderPreview, 150);
  scheduleSave();
}

function setListItem(i, val) {
  S.slides[S.active].list_items[i] = val;
  refreshThumb(S.active);
  clearTimeout(_previewTimer);
  _previewTimer = setTimeout(renderPreview, 150);
  scheduleSave();
}

function addListItem() {
  if ((S.slides[S.active].list_items || []).length >= 4) return;
  S.slides[S.active].list_items = [...(S.slides[S.active].list_items || []), ''];
  renderPanel();
  renderPreview();
  scheduleSave();
}

function removeListItem(i) {
  S.slides[S.active].list_items.splice(i, 1);
  renderPanel();
  renderPreview();
  scheduleSave();
}

function setStep(i, field, val) {
  S.slides[S.active].steps[i][field] = val;
  refreshThumb(S.active);
  clearTimeout(_previewTimer);
  _previewTimer = setTimeout(renderPreview, 150);
  scheduleSave();
}

function addStep() {
  const steps = S.slides[S.active].steps || [];
  if (steps.length >= 4) return;
  steps.push({ label: 'Etapa ' + (steps.length + 1), text: '' });
  S.slides[S.active].steps = steps;
  renderPanel();
  renderPreview();
  scheduleSave();
}

function removeStep(i) {
  S.slides[S.active].steps.splice(i, 1);
  renderPanel();
  renderPreview();
  scheduleSave();
}

function deleteSlide() {
  if (S.slides.length <= 1) return;
  S.slides.splice(S.active, 1);
  // Remap images after deletion
  const newImages = {};
  Object.keys(S.images).forEach(k => {
    const idx = Number(k);
    if (idx < S.active) newImages[idx] = S.images[idx];
    else if (idx > S.active) newImages[idx - 1] = S.images[idx];
  });
  S.images = newImages;
  S.active = Math.min(S.active, S.slides.length - 1);
  renderAll();
  scheduleSave();
}

function addSlide() {
  S.slides.splice(S.active + 1, 0, { ...SLIDE_DEFAULTS.dark });
  setActive(S.active + 1);
  scheduleSave();
}


function uploadImgFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    S.images[S.active] = e.target.result;
    renderPanel();
    refreshThumb(S.active);
    renderPreview();
    scheduleSave();
  };
  reader.readAsDataURL(file);
}

function uploadImg(event) {
  uploadImgFile(event.target.files[0]);
}

function removeImg() {
  delete S.images[S.active];
  renderPanel();
  refreshThumb(S.active);
  renderPreview();
  scheduleSave();
}

function refreshThumb(index) {
  const items = document.querySelectorAll('.thumb-item');
  const item = items[index];
  if (!item) return;
  const iframe = item.querySelector('iframe');
  if (!iframe) return;
  const iframeDoc = iframe.contentDocument;
  const slide = S.slides[index];
  if (iframeDoc?.head?.querySelector('style') && slide) {
    const fn = getRenderer(slide);
    iframeDoc.body.style.margin = '0';
    iframeDoc.body.style.overflow = 'hidden';
    iframeDoc.body.innerHTML = fn(slide, S.images[index] || null, S.theme);
  } else {
    iframe.srcdoc = slideDoc(index);
  }
}

// ─── Refine with AI ───────────────────────────────────────────────────────────
async function doRefine() {
  const instrEl = document.getElementById('refine-instr');
  const instr = instrEl?.value.trim();
  if (!instr) return;
  const btn = document.getElementById('btn-refine-ok');
  if (btn) { btn.textContent = '…'; btn.disabled = true; }
  try {
    const refined = await api.refine(S.slides[S.active], instr);
    const prevLayout = S.slides[S.active].layout;
    const prevImgPos = S.slides[S.active].img_position;
    S.slides[S.active] = refined;
    if (prevLayout && !S.slides[S.active].layout) S.slides[S.active].layout = prevLayout;
    if (prevImgPos) S.slides[S.active].img_position = prevImgPos;
    renderAll();
    scheduleSave();
  } catch (e) {
    alert('Erro ao refinar: ' + e.message);
  } finally {
    if (btn) { btn.textContent = 'Refinar'; btn.disabled = false; }
  }
}

// ─── Mount / Unmount ──────────────────────────────────────────────────────────
export function mountEditor() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="screen-editor">
      <header class="editor-header">
        <button class="header-btn" id="btn-back">${SVG_BACK} Projetos</button>
        <div id="editor-topic" class="editor-topic"></div>
        <div class="header-actions">
          <div id="save-indicator" class="save-indicator"><span class="save-indicator-dot"></span>Salvo</div>
          <div class="export-dropdown">
            <button class="header-btn btn-export-toggle" id="btn-export-toggle">${SVG_DOWNLOAD} Exportar ▾</button>
            <div class="export-menu" id="export-menu">
              <div class="export-menu-item" id="menu-export-png">${SVG_PNG} PNG por slide</div>
              <div class="export-menu-divider"></div>
              <div class="export-menu-item" id="menu-export-pdf">${SVG_PDF} PDF</div>
            </div>
          </div>
        </div>
      </header>
      <div class="editor-body">
        <div class="sidebar" id="sidebar"></div>
        <div class="preview-col" id="preview-col">
          <div id="canvas-loading" class="canvas-loading hidden">
            <div class="loading-card">
              <div class="loading-header">
                <div class="loading-title">Gerando carrossel</div>
                <div id="loading-topic" class="loading-topic"></div>
              </div>
              <div class="loading-bar-wrap">
                <div id="loading-bar" class="loading-bar"></div>
              </div>
              <div class="loading-steps">
                <div class="loading-step" id="step-0"><div class="step-icon"></div><div class="step-label">Analisando tema</div></div>
                <div class="loading-step" id="step-1"><div class="step-icon"></div><div class="step-label">Estruturando narrativa</div></div>
                <div class="loading-step" id="step-2"><div class="step-icon"></div><div class="step-label">Criando os slides</div></div>
                <div class="loading-step" id="step-3"><div class="step-icon"></div><div class="step-label">Refinando conteúdo</div></div>
              </div>
              <div id="loading-elapsed" class="loading-elapsed">0s</div>
            </div>
          </div>
          <div id="preview-wrap" class="preview-frame-wrap"></div>
          <div id="slide-counter" class="slide-counter"></div>
        </div>
        <div class="edit-panel" id="edit-panel"></div>
      </div>
    </div>`;

  document.getElementById('btn-back').onclick = () =>
    navigate('project', { projectId: S.projectId });

  const exportMenu = document.getElementById('export-menu');
  document.getElementById('btn-export-toggle').onclick = (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('open');
  };
  document.getElementById('menu-export-png').onclick = () => { exportMenu.classList.remove('open'); exportPNG(); };
  document.getElementById('menu-export-pdf').onclick = () => { exportMenu.classList.remove('open'); exportPDF(); };
  document.addEventListener('click', () => exportMenu.classList.remove('open'));

  if (S.carousel) {
    document.getElementById('editor-topic').textContent = S.carousel.title || '';
  }

  if (S.slides.length > 0) {
    renderAll();
  }
}

export function unmountEditor() {
  stopLoading();
}

// ─── New carousel modal ───────────────────────────────────────────────────────
export function showNewCarouselModal() {
  document.getElementById('new-carousel-modal')?.remove();

  let slideCount = 8;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'new-carousel-modal';

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">Novo carrossel</div>
        <button class="header-btn" id="modal-close">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Tema / assunto</label>
          <textarea id="modal-topic" class="form-textarea" placeholder="Ex: Por que criadores digitais fracassam nos primeiros 90 dias" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Audiência</label>
          <input id="modal-audience" class="form-input" type="text" placeholder="Ex: Criadores digitais brasileiros">
        </div>
        <div class="form-group">
          <label class="form-label">CTA final</label>
          <input id="modal-cta" class="form-input" type="text" placeholder="Ex: Salve este post e aplique hoje">
        </div>
        <div class="form-group">
          <label class="form-label">Número de slides</label>
          <div class="counter-row">
            <button type="button" class="counter-btn" id="modal-count-dec">−</button>
            <span id="modal-count-val" class="counter-val">${slideCount}</span>
            <button type="button" class="counter-btn" id="modal-count-inc">+</button>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-primary" id="modal-submit">Gerar carrossel</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  overlay.querySelector('#modal-close').onclick = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('#modal-count-dec').onclick = () => {
    slideCount = Math.max(3, slideCount - 1);
    overlay.querySelector('#modal-count-val').textContent = slideCount;
  };
  overlay.querySelector('#modal-count-inc').onclick = () => {
    slideCount = Math.min(15, slideCount + 1);
    overlay.querySelector('#modal-count-val').textContent = slideCount;
  };

  overlay.querySelector('#modal-submit').onclick = async () => {
    const topic = overlay.querySelector('#modal-topic').value.trim();
    if (!topic) {
      overlay.querySelector('#modal-topic').focus();
      return;
    }
    const brief = {
      topic,
      audience: overlay.querySelector('#modal-audience').value.trim(),
      cta: overlay.querySelector('#modal-cta').value.trim(),
      slideCount,
    };
    overlay.remove();
    await generateAndOpen(brief);
  };
}

// ─── Generate and open ────────────────────────────────────────────────────────
export async function generateAndOpen(brief) {
  // Show full-screen loading immediately — no blank screen gap
  showGeneratingScreen(brief.topic);
  setGenBar(5);

  const phaseTimers = [];

  try {
    // Step 1: create carousel record in DB
    const id1 = genLog('Criando carrossel…');
    const carousel = await api.carousels.create(S.projectId, brief.topic);
    S.carouselId = carousel.id;
    genLogDone(id1);
    setGenBar(15);

    // Step 2: AI generation — schedule cosmetic sub-phase messages
    const id2 = genLog('Conectando ao Claude…');
    setGenBar(18);
    phaseTimers.push(setTimeout(() => { genLogDone(id2); genLog('Analisando tema…'); setGenBar(30); }, 3000));
    phaseTimers.push(setTimeout(() => { genLog('Estruturando narrativa…'); setGenBar(45); }, 9000));
    phaseTimers.push(setTimeout(() => { genLog('Criando os slides…'); setGenBar(60); }, 20000));
    phaseTimers.push(setTimeout(() => { genLog('Refinando conteúdo…'); setGenBar(72); }, 35000));

    const result = await api.generate(brief);
    phaseTimers.forEach(clearTimeout);
    setGenBar(85);
    genLog(`${result.slides?.length || 0} slides gerados`, 'done');

    // Step 3: mount editor
    genLog('Carregando editor…');
    setGenBar(92);

    // Pre-set slides so mountEditor sees them (router will overwrite, re-set after navigate)
    const slides = result.slides || [];
    S.slides = slides;
    S.images = {};
    await navigate('editor', { projectId: S.projectId, carouselId: carousel.id });
    // Router reloaded carousel from DB (empty slides_json). Restore generated slides.
    S.slides = slides;
    S.images = {};

    stopGeneratingScreen();
    setGenBar(100);
    renderAll();
    scheduleSave();

  } catch (e) {
    phaseTimers.forEach(clearTimeout);
    genLog('Erro: ' + e.message, 'error');
    stopGeneratingScreen();
    setTimeout(() => navigate('project', { projectId: S.projectId }), 2500);
  }
}
