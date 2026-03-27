import { S } from '../state.js';
import { api } from '../api.js';
import { navigate } from '../router.js';
import { createColorPicker } from '../color-picker.js';
import { createFontPicker, DISPLAY_FONTS, BODY_FONTS } from '../font-picker.js';

let currentTheme = null;
let returnScreen = 'home';
let colorPickers = {};
let fontPickers = {};

export async function mountThemeEditor() {
  returnScreen = S.screen === 'project' ? 'project' : 'home';

  // Load theme: if project context, load project's resolved theme; else load global
  if (S.context === 'project' && S.projectId) {
    currentTheme = { ...await api.projects.theme(S.projectId) };
  } else {
    currentTheme = { ...await api.themes.global() };
  }

  const esc = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  document.getElementById('app').innerHTML = `
    <div class="screen-theme">
      <header class="app-header">
        <button class="btn-text" id="btn-back-theme">← Voltar</button>
        <span class="app-logo">Tema</span>
        <div style="display:flex;gap:8px;align-items:center;">
          ${S.context === 'project' ? '<button class="btn-text" id="btn-use-global">Usar tema global</button>' : ''}
          <button class="btn-primary" id="btn-save-theme">Salvar</button>
        </div>
      </header>
      <main class="theme-main">
        <div class="theme-columns">
          <div class="theme-col">
            <section class="theme-section">
              <h3 class="theme-section-title">Identidade da marca</h3>
              <div class="form-group">
                <label class="form-label">Nome da marca</label>
                <input class="form-input" id="t-brand-name" value="${esc(currentTheme.brand_name || '')}">
              </div>
              <div class="form-group">
                <label class="form-label">Símbolo (emoji/char)</label>
                <input class="form-input" id="t-brand-symbol" value="${esc(currentTheme.brand_symbol || '⬥')}" style="width:80px;">
              </div>
              <div class="form-group">
                <label class="form-label">Logotipo escuro (PNG/SVG)</label>
                <div class="brand-upload-row">
                  ${currentTheme.brand_logo_dark ? `<img src="${currentTheme.brand_logo_dark}" class="brand-preview" alt="Logo escuro">` : '<div class="brand-preview-empty">sem logo</div>'}
                  <input type="file" accept="image/png,image/svg+xml" id="upload-logo-dark" class="upload-input">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Logotipo claro (PNG/SVG)</label>
                <div class="brand-upload-row">
                  ${currentTheme.brand_logo_light ? `<img src="${currentTheme.brand_logo_light}" class="brand-preview brand-preview-dark" alt="Logo claro">` : '<div class="brand-preview-empty">sem logo</div>'}
                  <input type="file" accept="image/png,image/svg+xml" id="upload-logo-light" class="upload-input">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Nav esquerdo</label>
                <input class="form-input" id="t-nav-left" value="${esc(currentTheme.nav_left || 'CATEGORIA')}">
              </div>
              <div class="form-group">
                <label class="form-label">Nav direito</label>
                <input class="form-input" id="t-nav-right" value="${esc(currentTheme.nav_right || 'SÉRIE')}">
              </div>
            </section>
          </div>

          <div class="theme-col">
            <section class="theme-section">
              <h3 class="theme-section-title">Fontes</h3>
              <div class="form-group" id="picker-font-display"></div>
              <div class="form-group" id="picker-font-body"></div>
            </section>
            <section class="theme-section">
              <h3 class="theme-section-title">Cores</h3>
              <div id="color-pickers" class="color-pickers-grid"></div>
            </section>
          </div>

          <div class="theme-col theme-preview-col">
            <section class="theme-section">
              <h3 class="theme-section-title">Prévia</h3>
              <iframe id="theme-preview-frame" class="theme-preview-frame"></iframe>
            </section>
          </div>
        </div>
      </main>
    </div>`;

  // Font pickers
  const fpDisplay = createFontPicker({ value: currentTheme.font_display, fonts: DISPLAY_FONTS, label: 'Fonte de títulos', onChange: v => { currentTheme.font_display = v; updatePreview(); } });
  document.getElementById('picker-font-display').appendChild(fpDisplay.el);
  fontPickers.display = fpDisplay;

  const fpBody = createFontPicker({ value: currentTheme.font_body, fonts: BODY_FONTS, label: 'Fonte do corpo', onChange: v => { currentTheme.font_body = v; updatePreview(); } });
  document.getElementById('picker-font-body').appendChild(fpBody.el);
  fontPickers.body = fpBody;

  // Color pickers
  const colorFields = [
    { key: 'color_bg',        label: 'Fundo' },
    { key: 'color_text',      label: 'Texto principal' },
    { key: 'color_emphasis',  label: 'Cor de destaque' },
    { key: 'color_secondary', label: 'Texto secundário' },
    { key: 'color_detail',    label: 'Detalhes' },
    { key: 'color_border',    label: 'Bordas' },
  ];
  const colorGrid = document.getElementById('color-pickers');
  colorFields.forEach(({ key, label }) => {
    const cp = createColorPicker({ value: currentTheme[key] || '#000000', label, onChange: v => { currentTheme[key] = v; updatePreview(); } });
    colorGrid.appendChild(cp.el);
    colorPickers[key] = cp;
  });

  // Brand uploads
  document.getElementById('upload-logo-dark').onchange = e => uploadBrand(e.target.files[0], 'dark');
  document.getElementById('upload-logo-light').onchange = e => uploadBrand(e.target.files[0], 'light');

  // Actions
  document.getElementById('btn-back-theme').onclick = () => navigate(returnScreen, S.projectId ? { projectId: S.projectId } : {});
  document.getElementById('btn-save-theme').onclick = saveTheme;
  document.getElementById('btn-use-global')?.addEventListener('click', useGlobalTheme);

  updatePreview();
}

async function uploadBrand(file, variant) {
  if (!file) return;
  try {
    const { url } = await api.uploadBrand(file);
    if (variant === 'dark') currentTheme.brand_logo_dark = url;
    else currentTheme.brand_logo_light = url;
    updatePreview();
  } catch (e) {
    alert('Erro ao fazer upload: ' + e.message);
  }
}

async function updatePreview() {
  const frame = document.getElementById('theme-preview-frame');
  if (!frame) return;
  const [{ themeStyleBlock }, { RENDERERS }] = await Promise.all([
    import('../theme.js'),
    import('../renderers.js'),
  ]);
  const slide = { template: 'dark', layout: 'a', section_number: '01', section_title: 'Prévia do tema', body_html: 'Assim ficará o conteúdo dos seus slides.', list_items: ['Item um', 'Item dois'], conclusion_html: 'Sua conclusão aqui.' };
  const fn = RENDERERS.dark.a;
  const body = fn(slide, null, currentTheme);
  frame.srcdoc = `<!DOCTYPE html><html><head>${themeStyleBlock(currentTheme)}</head><body style="margin:0;overflow:hidden;">${body}</body></html>`;
}

async function saveTheme() {
  // Read text fields
  currentTheme.brand_name = document.getElementById('t-brand-name').value.trim();
  currentTheme.brand_symbol = document.getElementById('t-brand-symbol').value.trim();
  currentTheme.nav_left = document.getElementById('t-nav-left').value.trim();
  currentTheme.nav_right = document.getElementById('t-nav-right').value.trim();

  try {
    await api.themes.update(currentTheme.id, currentTheme);

    // If editing project theme, update project.theme_id
    if (S.context === 'project' && S.projectId) {
      await api.projects.update(S.projectId, { theme_id: currentTheme.id });
    }

    navigate(returnScreen, S.projectId ? { projectId: S.projectId } : {});
  } catch (e) {
    alert('Erro ao salvar tema: ' + e.message);
  }
}

async function useGlobalTheme() {
  if (!confirm('Remover tema personalizado do projeto e usar o tema global?')) return;
  await api.projects.update(S.projectId, { theme_id: null });
  navigate('project', { projectId: S.projectId });
}

export function unmountThemeEditor() {
  colorPickers = {};
  fontPickers = {};
  currentTheme = null;
}
