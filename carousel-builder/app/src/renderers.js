function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Render HTML fields: stored as HTML strings, rendered directly (with plain text fallback)
function h(html) { return html || ''; }

export function getRenderer(slide) {
  const layout = slide.layout || 'a';
  const tpl = RENDERERS[slide.template];
  return tpl?.[layout] ?? tpl?.['a'] ?? RENDERERS.dark.a;
}

export const LAYOUT_NAMES = {
  cover:   { a: 'Ancorado', b: 'Editorial', c: 'Linha de corte' },
  dark:    { a: 'Stacked',  b: 'Nº fundo',  c: '2 colunas' },
  steps:   { a: 'Lista',    b: 'Numerado',  c: 'Ícones' },
  overlay: { a: 'Foto topo', b: 'Full-bleed', c: 'Foto topo + fundo blur' },
  split:   { a: 'Padrão' },
  cta:     { a: 'Headline', c: 'Centrado' },
};

const PF  = (t) => `font-family:'${t?.font_display || 'Playfair Display'}',serif;`;
const INT = (t) => `font-family:'${t?.font_body || 'Inter'}',sans-serif;`;
const UI  = (t) => `font-family:'${t?.font_ui || 'JetBrains Mono'}',monospace;`;

// Typographic scale helpers — scales proportionally from theme base values
const hs  = (t, px) => Math.round((+(t?.font_size_headline) || 72) * px / 72);
const bs  = (t, px) => Math.round((+(t?.font_size_body)     || 36) * px / 36);
const lhH = (t)     => +(t?.line_height_headline) || 1.05;
const lhB = (t)     => +(t?.line_height_body)     || 1.5;

function imgPos(slide) {
  const p = slide.img_position;
  if (!p) return '';
  const x = p.x ?? 50, y = p.y ?? 50, s = p.scale ?? 1;
  return `object-position:${x}% ${y}%;transform:scale(${s});transform-origin:${x}% ${y}%;`;
}

function navBar(t) {
  const nav_left  = t?.nav_left  || 'CATEGORIA';
  const nav_right = t?.nav_right || 'SÉRIE';
  return `<div style="${UI(t)}display:flex;align-items:center;gap:22px;font-size:22px;letter-spacing:.18em;color:#303030;text-transform:uppercase;margin-bottom:96px;">
    <span>${esc(nav_left)}</span>
    <div style="flex:1;height:1px;background:#1e1e1e;"></div>
    <span>${esc(nav_right)}</span>
  </div>`;
}

function footerBar(t) {
  const brand_symbol = t?.brand_symbol || '⬥';
  const brand_name   = t?.brand_name   || 'Marca';
  return `<div style="${UI(t)}display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:36px;">
    <span style="font-size:28px;color:#252525;">${esc(brand_symbol)} ${esc(brand_name)}</span>
    <span style="font-size:22px;letter-spacing:.14em;color:#252525;text-transform:uppercase;">${esc(brand_name.toUpperCase())}</span>
  </div>`;
}

export const RENDERERS = {
  cover: {
    a(slide, img, t) {
      const bg = img
        ? `<div style="position:absolute;inset:0;"><img src="${img}" style="width:100%;height:100%;object-fit:cover;${imgPos(slide)}filter:saturate(0.6);"><div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.97) 0%,rgba(0,0,0,.6) 42%,transparent 72%);"></div></div>`
        : `<div style="position:absolute;inset:0;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>`;
      const brand_symbol = t?.brand_symbol || '⬥';
      const brand_name   = t?.brand_name   || 'Marca';
      const headline = h(slide.headline_html || (slide.headline ? esc(slide.headline) + (slide.headline_italic ? ' <em>' + esc(slide.headline_italic) + '</em>' : '') : ''));
      const body = h(slide.body_html || esc(slide.body || ''));
      return `<div style="position:relative;width:1080px;height:1350px;overflow:hidden;background:#000;">
        ${bg}
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:54px 76px 80px;">
          <div style="${UI(t)}font-size:22px;color:#fff;opacity:.9;">${esc(brand_symbol)} ${esc(brand_name)}</div>
          <div style="flex:1;"></div>
          <div style="${PF(t)}font-size:${hs(t,84)}px;line-height:${lhH(t)};font-weight:400;color:#fff;margin-bottom:28px;">
            ${headline}
          </div>
          <div style="${INT(t)}font-size:${bs(t,36)}px;color:#777;line-height:${lhB(t)};">${body}</div>
        </div>
      </div>`;
    },

    b(slide, img, t) {
      const bg = img
        ? `<div style="position:absolute;inset:0;"><img src="${img}" style="width:100%;height:100%;object-fit:cover;${imgPos(slide)}filter:saturate(0.6);"><div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.97) 0%,rgba(0,0,0,.6) 42%,transparent 72%);"></div></div>`
        : `<div style="position:absolute;inset:0;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>`;
      const brand_symbol = t?.brand_symbol || '⬥';
      const brand_name   = t?.brand_name   || 'Marca';
      const nav_left     = t?.nav_left     || 'CATEGORIA';
      const headline = h(slide.headline_html || (slide.headline ? esc(slide.headline) + (slide.headline_italic ? ' <em>' + esc(slide.headline_italic) + '</em>' : '') : ''));
      const body = h(slide.body_html || esc(slide.body || ''));
      return `<div style="position:relative;width:1080px;height:1350px;overflow:hidden;background:#000;">
        ${bg}
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:54px 76px 80px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:auto;">
            <div style="${UI(t)}font-size:22px;color:#fff;opacity:.9;">${esc(brand_symbol)} ${esc(brand_name)}</div>
          </div>
          <div style="display:flex;flex-direction:column;">
            <div style="${UI(t)}font-size:18px;letter-spacing:.18em;color:#333;text-transform:uppercase;margin-bottom:24px;">${esc(nav_left)}</div>
            <div style="${PF(t)}font-size:${hs(t,84)}px;line-height:${lhH(t)};font-weight:400;color:#fff;margin-bottom:28px;">
              ${headline}
            </div>
            <div style="width:80px;height:1px;background:#2a2a2a;margin-bottom:28px;"></div>
            <div style="${INT(t)}font-size:${bs(t,36)}px;color:#666;line-height:${lhB(t)};">${body}</div>
          </div>
        </div>
      </div>`;
    },

    c(slide, img, t) {
      const bg = img
        ? `<div style="position:absolute;inset:0;"><img src="${img}" style="width:100%;height:100%;object-fit:cover;${imgPos(slide)}filter:saturate(0.6);"><div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.97) 0%,rgba(0,0,0,.7) 55%,rgba(0,0,0,.3) 100%);"></div></div>`
        : `<div style="position:absolute;inset:0;background:#050505;"></div>`;
      const brand_symbol = t?.brand_symbol || '⬥';
      const brand_name   = t?.brand_name   || 'Marca';
      const nav_left     = t?.nav_left     || 'CATEGORIA';
      const nav_right    = t?.nav_right    || 'SÉRIE';
      const headline = h(slide.headline_html || (slide.headline ? esc(slide.headline) + (slide.headline_italic ? ' <em>' + esc(slide.headline_italic) + '</em>' : '') : ''));
      const body = h(slide.body_html || esc(slide.body || ''));
      return `<div style="position:relative;width:1080px;height:1350px;overflow:hidden;background:#000;">
        ${bg}
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:54px 76px 80px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;">
            <div style="${UI(t)}font-size:22px;color:#fff;opacity:.85;">${esc(brand_symbol)} ${esc(brand_name)}</div>
            <div style="${UI(t)}font-size:18px;letter-spacing:.18em;color:#2a2a2a;text-transform:uppercase;">${esc(nav_right)}</div>
          </div>
          <div style="width:100%;height:1px;background:linear-gradient(to right,#fff,transparent);margin-bottom:48px;"></div>
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
            <div style="${PF(t)}font-size:${hs(t,84)}px;line-height:${lhH(t)};font-weight:400;color:#fff;margin-bottom:28px;">
              ${headline}
            </div>
            <div style="${INT(t)}font-size:${bs(t,36)}px;color:#666;line-height:${lhB(t)};">${body}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="${UI(t)}font-size:18px;letter-spacing:.18em;color:#252525;text-transform:uppercase;">${esc(nav_left)}</div>
          </div>
        </div>
      </div>`;
    },
  },

  split: {
    a(slide, img, t) {
      const col = img
        ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;${imgPos(slide)}filter:grayscale(90%) contrast(1.05);">`
        : `<div style="width:100%;height:100%;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>`;
      const headline = h(slide.headline_html || (slide.headline ? esc(slide.headline) + (slide.headline_italic ? ' <em>' + esc(slide.headline_italic) + '</em>' : '') : ''));
      const body = h(slide.body_html || esc(slide.body || ''));
      return `<div style="width:1080px;height:1350px;display:flex;background:#000;">
        <div style="flex:0 0 52%;display:flex;flex-direction:column;padding:54px 52px 60px 76px;">
          ${navBar(t)}
          <div style="${PF(t)}font-size:${hs(t,62)}px;line-height:${lhH(t)};font-weight:400;color:#fff;margin-bottom:28px;">
            ${headline}
          </div>
          <div style="${INT(t)}font-size:${bs(t,36)}px;color:#777;line-height:${lhB(t)};margin-bottom:auto;">${body}</div>
          ${footerBar(t)}
        </div>
        <div style="flex:0 0 48%;overflow:hidden;">${col}</div>
      </div>`;
    },
  },

  dark: {
    a(slide, img, t) {
      const items = (slide.list_items || []).map(item =>
        `<div style="display:flex;gap:16px;margin-bottom:16px;">
          <span style="${INT(t)}color:#555;font-size:${bs(t,36)}px;flex-shrink:0;">·</span>
          <span style="${INT(t)}font-size:${bs(t,36)}px;color:#666;line-height:${lhB(t)};">${esc(item)}</span>
         </div>`
      ).join('');
      const body = h(slide.body_html || esc(slide.body || ''));
      const conclusion = h(slide.conclusion_html || esc(slide.conclusion || ''));
      return `<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 60px;">
        ${navBar(t)}
        <div style="${UI(t)}font-size:22px;letter-spacing:.18em;color:#333;text-transform:uppercase;margin-bottom:16px;">${esc(slide.section_number)}</div>
        <div style="${PF(t)}font-size:${hs(t,62)}px;line-height:${lhH(t)};font-weight:400;color:#fff;margin-bottom:36px;">${esc(slide.section_title)}</div>
        <div style="${INT(t)}font-size:${bs(t,36)}px;color:#666;line-height:${lhB(t)};margin-bottom:32px;">${body}</div>
        <div style="margin-bottom:24px;">${items}</div>
        <div style="${INT(t)}font-size:${bs(t,36)}px;color:#555;line-height:${lhB(t)};margin-bottom:auto;">${conclusion}</div>
        ${footerBar(t)}
      </div>`;
    },

    b(slide, img, t) {
      const items = (slide.list_items || []).map(item =>
        `<div style="display:flex;gap:28px;margin-bottom:22px;align-items:baseline;">
          <div style="width:20px;height:1px;background:#2a2a2a;flex-shrink:0;margin-top:14px;"></div>
          <span style="${INT(t)}font-size:${bs(t,36)}px;color:#3a3a3a;line-height:${lhB(t)};">${esc(item)}</span>
         </div>`
      ).join('');
      const nav_left     = t?.nav_left     || 'CATEGORIA';
      const nav_right    = t?.nav_right    || 'SÉRIE';
      const brand_symbol = t?.brand_symbol || '⬥';
      const brand_name   = t?.brand_name   || 'Marca';
      const body = h(slide.body_html || esc(slide.body || ''));
      const conclusion = h(slide.conclusion_html || esc(slide.conclusion || ''));
      return `<div style="width:1080px;height:1350px;background:#060606;display:flex;flex-direction:column;padding:54px 76px 80px;position:relative;overflow:hidden;">
        <div style="${PF(t)}position:absolute;top:-20px;right:40px;font-size:480px;color:#111;line-height:1;user-select:none;pointer-events:none;letter-spacing:-.02em;">${esc(slide.section_number||'')}</div>
        <div style="display:flex;align-items:center;gap:22px;font-size:0;padding-bottom:40px;position:relative;">
          <span style="${UI(t)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${esc(nav_left)}</span>
          <div style="flex:1;height:1px;background:#1e1e1e;"></div>
          <span style="${UI(t)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${esc(nav_right)}</span>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;position:relative;">
          <div style="${UI(t)}font-size:18px;letter-spacing:.22em;color:#2e2e2e;text-transform:uppercase;margin-bottom:24px;">Seção ${esc(slide.section_number||'')}</div>
          <div style="${PF(t)}font-size:${hs(t,72)}px;line-height:${lhH(t)};font-weight:400;color:#e8e8e8;margin-bottom:40px;">${esc(slide.section_title)}</div>
          <div style="${INT(t)}font-size:${bs(t,36)}px;color:#505050;line-height:${lhB(t)};margin-bottom:48px;">${body}</div>
          <div style="margin-bottom:0;">${items}</div>
          <div style="margin-top:auto;padding-top:32px;">
            <div style="${PF(t)}font-size:${bs(t,36)}px;color:#2e2e2e;line-height:${lhB(t)};font-style:italic;">${conclusion}</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:36px;">
          <span style="${UI(t)}font-size:22px;color:#1e1e1e;">${esc(brand_symbol)} ${esc(brand_name)}</span>
          <span style="${UI(t)}font-size:18px;letter-spacing:.14em;color:#1a1a1a;text-transform:uppercase;">${esc(brand_name)}</span>
        </div>
      </div>`;
    },

    c(slide, img, t) {
      const items = (slide.list_items || []).map(item =>
        `<div style="display:flex;gap:28px;margin-bottom:22px;align-items:baseline;">
          <span style="${INT(t)}color:#555;font-size:${bs(t,36)}px;flex-shrink:0;">·</span>
          <span style="${INT(t)}font-size:${bs(t,36)}px;color:#666;line-height:${lhB(t)};">${esc(item)}</span>
         </div>`
      ).join('');
      const nav_left     = t?.nav_left     || 'CATEGORIA';
      const nav_right    = t?.nav_right    || 'SÉRIE';
      const brand_symbol = t?.brand_symbol || '⬥';
      const brand_name   = t?.brand_name   || 'Marca';
      const body = h(slide.body_html || esc(slide.body || ''));
      const conclusion = h(slide.conclusion_html || esc(slide.conclusion || ''));
      return `<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 80px;">
        <div style="display:flex;align-items:center;gap:22px;margin-bottom:48px;">
          <span style="${UI(t)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${esc(nav_left)}</span>
          <div style="flex:1;height:1px;background:#1e1e1e;"></div>
          <span style="${UI(t)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${esc(nav_right)}</span>
        </div>
        <div style="display:flex;gap:52px;align-items:flex-start;margin-bottom:52px;border-top:1px solid #1a1a1a;padding-top:36px;">
          <div style="flex:0 0 160px;">
            <div style="${UI(t)}font-size:14px;letter-spacing:.18em;color:#2a2a2a;text-transform:uppercase;margin-bottom:8px;">Seção</div>
            <div style="${PF(t)}font-size:120px;color:#161616;line-height:1;letter-spacing:-.02em;">${esc(slide.section_number||'')}</div>
          </div>
          <div style="flex:1;padding-top:8px;">
            <div style="${PF(t)}font-size:${hs(t,62)}px;line-height:${lhH(t)};font-weight:400;color:#fff;">${esc(slide.section_title)}</div>
          </div>
        </div>
        <div style="${INT(t)}font-size:${bs(t,36)}px;color:#666;line-height:${lhB(t)};margin-bottom:32px;">${body}</div>
        <div style="margin-bottom:24px;">${items}</div>
        <div style="${INT(t)}font-size:${bs(t,36)}px;color:#3a3a3a;line-height:${lhB(t)};margin-bottom:auto;">${conclusion}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:36px;">
          <span style="${UI(t)}font-size:22px;color:#252525;">${esc(brand_symbol)} ${esc(brand_name)}</span>
          <span style="${UI(t)}font-size:22px;letter-spacing:.14em;color:#252525;text-transform:uppercase;">${esc(brand_name)}</span>
        </div>
      </div>`;
    },
  },

  steps: {
    a(slide, img, t) {
      const steps = (slide.steps || []).map(s =>
        `<div style="margin-bottom:24px;">
          <span style="${INT(t)}font-size:${bs(t,36)}px;font-weight:500;color:#fff;">${esc(s.label)}:</span>
          <span style="${INT(t)}font-size:${bs(t,36)}px;color:#666;"> ${h(s.text_html || esc(s.text || ''))}</span>
         </div>`
      ).join('');
      const cta = h(slide.call_to_action_html || (slide.call_to_action ? esc(slide.call_to_action) + (slide.call_to_action_italic ? ' <em>' + esc(slide.call_to_action_italic) + '</em>' : '') : ''));
      return `<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 60px;">
        ${navBar(t)}
        ${slide.section_title ? `<div style="${PF(t)}font-size:${hs(t,48)}px;font-weight:400;color:#fff;margin-bottom:36px;">${esc(slide.section_title)}</div>` : ''}
        <div style="flex:1;">${steps}</div>
        <div style="${PF(t)}font-size:${hs(t,62)}px;font-weight:400;color:#fff;line-height:${lhH(t)};margin-bottom:auto;">
          ${cta}
        </div>
        ${footerBar(t)}
      </div>`;
    },

    b(slide, img, t) {
      const steps = (slide.steps || []).map(s =>
        `<div style="display:flex;align-items:baseline;gap:36px;margin-bottom:32px;">
          <span style="${PF(t)}font-size:100px;color:#161616;line-height:1;flex-shrink:0;width:100px;">${esc(s.label.match(/\d+/)?.[0] || '')}</span>
          <div style="flex:1;">
            <div style="${UI(t)}font-size:22px;font-weight:500;color:#aaa;letter-spacing:.06em;margin-bottom:6px;">${esc(s.label.replace(/^\d+[:,.]?\s*/,''))}</div>
            <div style="${INT(t)}font-size:${bs(t,32)}px;color:#444;line-height:${lhB(t)};">${h(s.text_html || esc(s.text || ''))}</div>
          </div>
        </div>`
      ).join('');
      const nav_left     = t?.nav_left     || 'CATEGORIA';
      const nav_right    = t?.nav_right    || 'SÉRIE';
      const brand_symbol = t?.brand_symbol || '⬥';
      const brand_name   = t?.brand_name   || 'Marca';
      const cta = h(slide.call_to_action_html || (slide.call_to_action ? esc(slide.call_to_action) + (slide.call_to_action_italic ? ' <em>' + esc(slide.call_to_action_italic) + '</em>' : '') : ''));
      return `<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 80px;">
        <div style="display:flex;align-items:center;gap:22px;margin-bottom:48px;">
          <span style="${UI(t)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${esc(nav_left)}</span>
          <div style="flex:1;height:1px;background:#1e1e1e;"></div>
          <span style="${UI(t)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${esc(nav_right)}</span>
        </div>
        ${slide.section_title ? `<div style="${UI(t)}font-size:18px;letter-spacing:.2em;color:#2a2a2a;text-transform:uppercase;margin-bottom:48px;">${esc(slide.section_title)}</div>` : ''}
        <div style="flex:1;">${steps}</div>
        <div style="${PF(t)}font-size:${hs(t,62)}px;font-weight:400;color:#fff;line-height:${lhH(t)};margin-bottom:auto;padding-top:24px;">
          ${cta}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:36px;">
          <span style="${UI(t)}font-size:22px;color:#252525;">${esc(brand_symbol)} ${esc(brand_name)}</span>
          <span style="${UI(t)}font-size:22px;letter-spacing:.14em;color:#252525;text-transform:uppercase;">${esc(brand_name)}</span>
        </div>
      </div>`;
    },

    c(slide, img, t) {
      const steps = slide.steps || [];
      const nav_left  = t?.nav_left  || 'CATEGORIA';
      const nav_right = t?.nav_right || 'SÉRIE';
      const cards = steps.slice(0, 4).map(s => {
        let iconHTML = `<div style="width:48px;height:48px;border-radius:50%;border:1px solid #1e1e1e;margin-bottom:20px;"></div>`;
        if (s.icon) {
          if (s.icon.type === 'lucide' && s.icon.svg) {
            iconHTML = `<div style="margin-bottom:20px;">${s.icon.svg}</div>`;
          } else if (s.icon.type === 'upload' && s.icon.src) {
            iconHTML = `<img src="${esc(s.icon.src)}" style="width:48px;height:48px;object-fit:contain;margin-bottom:20px;">`;
          }
        }
        return `<div style="background:#0d0d0d;border-radius:12px;padding:40px 36px;display:flex;flex-direction:column;">
          ${iconHTML}
          <div style="${UI(t)}font-size:20px;color:#888;font-weight:500;letter-spacing:.04em;margin-bottom:12px;">${esc(s.label.replace(/^\d+[:,.]?\s*/,''))}</div>
          <div style="${INT(t)}font-size:${bs(t,30)}px;color:#3a3a3a;line-height:${lhB(t)};">${h(s.text_html || esc(s.text || ''))}</div>
        </div>`;
      }).join('');
      const cta = h(slide.call_to_action_html || (slide.call_to_action ? esc(slide.call_to_action) + (slide.call_to_action_italic ? ' <em>' + esc(slide.call_to_action_italic) + '</em>' : '') : ''));
      return `<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 80px;">
        <div style="display:flex;align-items:center;gap:22px;margin-bottom:48px;">
          <span style="${UI(t)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${esc(nav_left)}</span>
          <div style="flex:1;height:1px;background:#1e1e1e;"></div>
          <span style="${UI(t)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${esc(nav_right)}</span>
        </div>
        <div style="${PF(t)}font-size:${hs(t,52)}px;font-weight:400;color:#fff;line-height:${lhH(t)};margin-bottom:40px;">${esc(slide.section_title||'')}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;flex:1;">${cards}</div>
        <div style="${PF(t)}font-size:${hs(t,48)}px;font-weight:400;color:#fff;line-height:${lhH(t)};padding-top:32px;">
          ${cta}
        </div>
      </div>`;
    },
  },

  overlay: {
    a(slide, img, t) {
      const photo = img
        ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;${imgPos(slide)}">`
        : `<div style="width:100%;height:100%;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>`;
      const headline = h(slide.headline_html || esc(slide.headline || ''));
      const body = h(slide.body_html || esc(slide.body || ''));
      return `<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;position:relative;">
        <div style="height:680px;overflow:hidden;flex-shrink:0;">
          ${photo}
        </div>
        <div style="position:absolute;left:0;right:0;top:296px;height:400px;background:linear-gradient(to bottom,transparent 0%,rgba(0,0,0,.5) 45%,rgba(0,0,0,.85) 72%,#000 100%);pointer-events:none;z-index:1;"></div>
        <div style="flex:1;padding:32px 62px 60px;display:flex;flex-direction:column;position:relative;z-index:2;">
          <div style="${UI(t)}display:flex;align-items:center;gap:22px;font-size:22px;letter-spacing:.18em;color:#303030;text-transform:uppercase;margin-bottom:36px;">
            <span>${esc(slide.section_number)}</span>
            <div style="flex:1;height:1px;background:#1e1e1e;"></div>
            <span>${esc(t?.nav_right || 'SÉRIE')}</span>
          </div>
          <div style="${UI(t)}font-size:22px;letter-spacing:.18em;color:#333;text-transform:uppercase;margin-bottom:12px;">${esc(t?.nav_left || 'CATEGORIA')}</div>
          <div style="${PF(t)}font-size:${hs(t,62)}px;font-weight:400;color:#fff;line-height:${lhH(t)};margin-bottom:24px;">${esc(slide.section_title)}</div>
          ${headline ? `<div style="${PF(t)}font-size:${hs(t,42)}px;font-weight:400;font-style:italic;color:#aaa;line-height:${lhH(t)};margin-bottom:40px;">${headline}</div>` : ''}
          <div style="${INT(t)}font-size:${bs(t,32)}px;color:#666;line-height:${lhB(t)};margin-bottom:auto;">${body}</div>
          ${footerBar(t)}
        </div>
      </div>`;
    },

    b(slide, img, t) {
      const photo = img
        ? `<img src="${img}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;${imgPos(slide)}">`
        : `<div style="position:absolute;inset:0;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>`;
      const brand_symbol = t?.brand_symbol || '⬥';
      const brand_name   = t?.brand_name   || 'Marca';
      const nav_left     = t?.nav_left     || 'CATEGORIA';
      const nav_right    = t?.nav_right    || 'SÉRIE';
      const headline = h(slide.headline_html || (slide.headline ? esc(slide.headline) + (slide.headline_italic ? ' <em>' + esc(slide.headline_italic) + '</em>' : '') : ''));
      const body = h(slide.body_html || esc(slide.body || ''));
      return `<div style="width:1080px;height:1350px;background:#000;position:relative;overflow:hidden;">
        ${photo}
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.97) 0%,rgba(0,0,0,.75) 40%,rgba(0,0,0,.2) 70%,transparent 100%);"></div>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:54px 76px 80px;">
          <div style="display:flex;align-items:center;gap:22px;">
            <span style="${UI(t)}font-size:18px;letter-spacing:.18em;color:rgba(255,255,255,.18);text-transform:uppercase;">${esc(nav_left)}</span>
            <div style="flex:1;height:1px;background:rgba(255,255,255,.06);"></div>
            <span style="${UI(t)}font-size:18px;letter-spacing:.18em;color:rgba(255,255,255,.18);text-transform:uppercase;">${esc(nav_right)}</span>
          </div>
          <div style="flex:1;"></div>
          <div style="${UI(t)}font-size:18px;letter-spacing:.18em;color:#3a3a3a;text-transform:uppercase;margin-bottom:20px;">${esc(slide.section_number)} — ${esc(slide.section_title)}</div>
          <div style="${PF(t)}font-size:${hs(t,72)}px;line-height:${lhH(t)};font-weight:400;color:#fff;margin-bottom:28px;">
            ${headline}
          </div>
          <div style="${INT(t)}font-size:${bs(t,36)}px;color:#666;line-height:${lhB(t)};margin-bottom:36px;">${body}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="${UI(t)}font-size:22px;color:#1e1e1e;">${esc(brand_symbol)} ${esc(brand_name)}</span>
            <span style="${UI(t)}font-size:22px;letter-spacing:.14em;color:#1a1a1a;text-transform:uppercase;">${esc(brand_name)}</span>
          </div>
        </div>
      </div>`;
    },

    c(slide, img, t) {
      const photoBg = slide.bg_blur_disabled ? '' : (img
        ? `<img src="${img}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(18px);opacity:0.22;transform:scale(1.06);transform-origin:center;">`
        : `<div style="position:absolute;inset:0;background:linear-gradient(160deg,#1a2228,#0d1418);"></div>`);
      const photoFg = img
        ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;${imgPos(slide)}">`
        : `<div style="width:100%;height:100%;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>`;
      const headline = h(slide.headline_html || esc(slide.headline || ''));
      const body = h(slide.body_html || esc(slide.body || ''));
      return `<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:14px 14px 0;position:relative;">
        <div style="position:absolute;inset:0;overflow:hidden;">
          ${photoBg}
        </div>
        <div style="height:680px;border-radius:18px;overflow:hidden;flex-shrink:0;position:relative;z-index:1;">
          ${photoFg}
        </div>
        <div style="flex:1;padding:32px 62px 60px;display:flex;flex-direction:column;position:relative;z-index:2;">
          <div style="${UI(t)}display:flex;align-items:center;gap:22px;font-size:22px;letter-spacing:.18em;color:#303030;text-transform:uppercase;margin-bottom:36px;">
            <span>${esc(slide.section_number)}</span>
            <div style="flex:1;height:1px;background:#1e1e1e;"></div>
            <span>${esc(t?.nav_right || 'SÉRIE')}</span>
          </div>
          <div style="${UI(t)}font-size:22px;letter-spacing:.18em;color:#444;text-transform:uppercase;margin-bottom:12px;">${esc(t?.nav_left || 'CATEGORIA')}</div>
          <div style="${PF(t)}font-size:${hs(t,62)}px;font-weight:400;color:#fff;line-height:${lhH(t)};margin-bottom:24px;">${esc(slide.section_title)}</div>
          ${headline ? `<div style="${PF(t)}font-size:${hs(t,42)}px;font-weight:400;font-style:italic;color:#aaa;line-height:${lhH(t)};margin-bottom:40px;">${headline}</div>` : ''}
          <div style="${INT(t)}font-size:${bs(t,32)}px;color:#666;line-height:${lhB(t)};margin-bottom:auto;">${body}</div>
          ${footerBar(t)}
        </div>
      </div>`;
    },
  },

  cta: {
    a(slide, img, t) {
      const brand_symbol = t?.brand_symbol || '⬥';
      const brand_name   = t?.brand_name   || 'Marca';
      const headline = h(slide.headline_html || (slide.headline ? esc(slide.headline) + (slide.headline_italic ? ' <em>' + esc(slide.headline_italic) + '</em>' : '') : ''));
      const body = h(slide.body_html || esc(slide.body || ''));
      return `<div style="width:1080px;height:1350px;background:#000;border:1px solid #161616;display:flex;flex-direction:column;padding:54px 76px 80px;">
        <div style="${UI(t)}font-size:22px;color:#fff;margin-bottom:auto;">${esc(brand_symbol)} ${esc(brand_name)}</div>
        <div style="${PF(t)}font-size:${hs(t,84)}px;line-height:${lhH(t)};font-weight:400;font-style:italic;color:#fff;margin-bottom:40px;">
          ${headline}
        </div>
        <div style="${INT(t)}font-size:${bs(t,36)}px;color:#444;line-height:${lhB(t)};margin-bottom:60px;">${body}</div>
        <div style="${INT(t)}font-size:${bs(t,36)}px;color:#fff;line-height:${lhB(t)};">
          ${esc(slide.cta_text)}
          <span style="text-decoration:underline;text-underline-offset:4px;">${esc(slide.cta_word)}</span>
          ${esc(slide.cta_suffix)}
        </div>
      </div>`;
    },

    c(slide, img, t) {
      const brand_symbol = t?.brand_symbol || '⬥';
      const brand_name   = t?.brand_name   || 'Marca';
      const headline = h(slide.headline_html || (slide.headline ? esc(slide.headline) + (slide.headline_italic ? ' <em>' + esc(slide.headline_italic) + '</em>' : '') : ''));
      const body = h(slide.body_html || esc(slide.body || ''));
      return `<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 96px;text-align:center;">
        <div style="${UI(t)}font-size:22px;color:#252525;letter-spacing:.18em;margin-bottom:60px;">${esc(brand_symbol)} ${esc(brand_name)}</div>
        <div style="${PF(t)}font-size:${hs(t,84)}px;line-height:${lhH(t)};font-weight:400;color:#fff;margin-bottom:36px;">
          ${headline}
        </div>
        <div style="width:80px;height:1px;background:#1c1c1c;margin-bottom:36px;"></div>
        <div style="${INT(t)}font-size:${bs(t,36)}px;color:#3a3a3a;line-height:${lhB(t)};margin-bottom:60px;">${body}</div>
        <div style="border:1px solid #2a2a2a;border-radius:9999px;padding:24px 60px;display:inline-block;">
          <div style="${INT(t)}font-size:${bs(t,30)}px;color:#555;letter-spacing:.04em;line-height:${lhB(t)};">
            ${esc(slide.cta_text)} <span style="color:#fff;font-weight:500;">${esc(slide.cta_word)}</span> ${esc(slide.cta_suffix)}
          </div>
        </div>
      </div>`;
    },
  },
};
