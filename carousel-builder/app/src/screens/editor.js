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

// ─── Loading state ────────────────────────────────────────────────────────────
const STEP_DELAYS = [0, 2000, 8000, 20000];
const BAR_TARGETS  = [12, 30, 55, 80];
let loadingTimers = [];

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
  S.slides.forEach((slide, i) => {
    const item = document.createElement('div');
    item.className = 'thumb-item' + (i === S.active ? ' active' : '');
    item.onclick = () => setActive(i);
    const wrap = document.createElement('div');
    wrap.className = 'thumb-wrap';
    const iframe = document.createElement('iframe');
    iframe.srcdoc = slideDoc(i);
    iframe.title = 'Slide ' + (i + 1);
    wrap.appendChild(iframe);
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
  wrap.style.width    = w + 'px';
  wrap.style.height   = h + 'px';
  wrap.style.overflow = 'hidden';
  wrap.style.flexShrink = '0';
  wrap.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.style.width           = '1080px';
  iframe.style.height          = '1350px';
  iframe.style.transformOrigin = 'top left';
  iframe.style.transform       = `scale(${scale})`;
  iframe.style.border          = 'none';
  iframe.style.display         = 'block';
  iframe.srcdoc = slideDoc(S.active);
  iframe.title  = 'Preview';
  wrap.appendChild(iframe);

  const slide = S.slides[S.active];
  const pillsEl = document.getElementById('layout-pills');
  if (slide && pillsEl) {
    const variants = LAYOUT_NAMES[slide.template] || {};
    const currentLayout = slide.layout || 'a';
    pillsEl.innerHTML = Object.entries(variants).map(([key, name]) =>
      `<button class="pill${key === currentLayout ? ' active' : ''}" data-layout="${esc(key)}">${esc(name)}</button>`
    ).join('');
    pillsEl.querySelectorAll('.pill').forEach(btn => {
      btn.onclick = () => changeLayout(btn.dataset.layout);
    });
  }
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

  function fText(key, label, val) {
    return `<div class="field-group"><div class="field-label">${esc(label)}</div>
      <input class="field-input" value="${esc(val || '')}" data-key="${esc(key)}"></div>`;
  }
  function fArea(key, label, val) {
    return `<div class="field-group"><div class="field-label">${esc(label)}</div>
      <textarea class="field-textarea" data-key="${esc(key)}">${esc(val || '')}</textarea></div>`;
  }

  let html = `<div class="panel-header">
    <div class="panel-title">Slide ${S.active + 1} · ${esc(tpl)}</div>
    ${canDel ? '<button class="btn-delete" id="btn-delete-slide">Excluir</button>' : ''}
  </div>`;

  if (hasImg) {
    html += `<div class="field-group"><div class="field-label">Imagem</div>
      ${imgSrc
        ? `<div class="img-preview-wrap">
             <img class="img-preview" src="${imgSrc}">
             <button class="btn-remove-img" id="btn-remove-img">Remover</button>
           </div>`
        : `<div class="drop-zone">
             <input type="file" accept="image/*" id="inp-img">
             <div class="drop-zone-icon">⊕</div>
             <div class="drop-zone-text">Clique para fazer upload<br>JPG · PNG · WEBP</div>
           </div>`
      }
    </div>`;
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
            <button class="btn-remove" data-list-remove="${i}">×</button>
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
              <button class="btn-remove" data-step-remove="${i}">×</button>
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
  }
  if (tpl === 'cta') {
    html += `<div data-rich="headline_html"></div>`;
    html += `<div data-rich="body_html"></div>`;
    html += fText('cta_text', 'Texto do CTA', slide.cta_text);
    html += fText('cta_word', 'Palavra em destaque', slide.cta_word);
    html += fText('cta_suffix', 'Sufixo do CTA', slide.cta_suffix);
  }

  html += `<div class="refine-section">
    <button class="btn-refine" id="btn-refine-toggle">✦ Refinar com IA</button>
    <div id="refine-wrap" class="refine-input-wrap">
      <textarea id="refine-instr" class="field-textarea" placeholder="O que você quer mudar neste slide?" rows="3"></textarea>
      <div class="refine-actions">
        <button id="btn-refine-ok" class="btn-confirm">Refinar</button>
        <button id="btn-refine-cancel" class="btn-cancel">Cancelar</button>
      </div>
    </div>
  </div>`;

  panel.innerHTML = html;

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
    el.addEventListener('input', () => setField(el.dataset.key, el.value));
  });

  const delBtn = panel.querySelector('#btn-delete-slide');
  if (delBtn) delBtn.onclick = deleteSlide;

  const removeImgBtn = panel.querySelector('#btn-remove-img');
  if (removeImgBtn) removeImgBtn.onclick = removeImg;

  const inpImg = panel.querySelector('#inp-img');
  if (inpImg) inpImg.onchange = (e) => uploadImg(e);

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
  const refineToggle = panel.querySelector('#btn-refine-toggle');
  if (refineToggle) refineToggle.onclick = () => {
    const wrap = document.getElementById('refine-wrap');
    if (wrap) wrap.classList.toggle('open');
  };
  const refineOk = panel.querySelector('#btn-refine-ok');
  if (refineOk) refineOk.onclick = doRefine;
  const refineCancel = panel.querySelector('#btn-refine-cancel');
  if (refineCancel) refineCancel.onclick = () => {
    const wrap = document.getElementById('refine-wrap');
    if (wrap) wrap.classList.remove('open');
  };

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

// ─── Slide mutations ──────────────────────────────────────────────────────────
function setActive(i) {
  S.active = i;
  renderAll();
}

function setField(key, val) {
  S.slides[S.active][key] = val;
  refreshThumb(S.active);
  renderPreview();
  scheduleSave();
}

function setListItem(i, val) {
  S.slides[S.active].list_items[i] = val;
  refreshThumb(S.active);
  renderPreview();
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
  renderPreview();
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

function changeLayout(layout) {
  if (!S.slides[S.active]) return;
  S.slides[S.active].layout = layout;
  refreshThumb(S.active);
  renderPreview();
  renderPanel();
  scheduleSave();
}

function uploadImg(event) {
  const file = event.target.files[0];
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
  if (iframe) iframe.srcdoc = slideDoc(index);
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
    S.slides[S.active] = refined;
    if (prevLayout && !S.slides[S.active].layout) {
      S.slides[S.active].layout = prevLayout;
    }
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
        <button class="header-btn" id="btn-back">← Projetos</button>
        <div id="editor-topic" class="editor-topic"></div>
        <div id="saved-dot" class="saved-dot"></div>
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
          <div id="layout-pills" class="template-pills"></div>
        </div>
        <div class="edit-panel" id="edit-panel"></div>
      </div>
    </div>`;

  document.getElementById('btn-back').onclick = () =>
    navigate('project', { projectId: S.projectId });

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
          <input id="modal-topic" class="form-input" type="text" placeholder="Ex: Por que criadores digitais fracassam nos primeiros 90 dias">
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
  const carousel = await api.carousels.create(S.projectId, brief.topic);
  S.carouselId = carousel.id;
  await navigate('editor', { projectId: S.projectId, carouselId: carousel.id });
  startLoading(brief.topic);
  try {
    const result = await api.generate(brief);
    S.slides = result.slides || [];
    S.images = {};
    renderAll();
    scheduleSave();
  } catch (e) {
    alert('Erro ao gerar: ' + e.message);
    navigate('project', { projectId: S.projectId });
  } finally {
    stopLoading();
  }
}
