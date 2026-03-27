// Curated list of Google Fonts suitable for editorial content
export const DISPLAY_FONTS = [
  'Playfair Display', 'Cormorant Garamond', 'Libre Baskerville',
  'Merriweather', 'Lora', 'Abril Fatface', 'DM Serif Display',
  'Bodoni Moda', 'Fraunces', 'Spectral',
];

export const BODY_FONTS = [
  'Inter', 'DM Sans', 'Plus Jakarta Sans', 'Outfit', 'Nunito Sans',
  'Source Sans 3', 'Karla', 'Mulish', 'Work Sans', 'Jost',
];

/**
 * Font picker: shows preview of fonts, loads them from Google Fonts.
 * Usage: createFontPicker({ value: 'Inter', fonts: BODY_FONTS, label: 'Fonte do corpo', onChange: fn })
 */
export function createFontPicker({ value = '', fonts = BODY_FONTS, label = '', onChange } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'font-picker-wrap';
  wrap.innerHTML = `
    <div class="field-label">${String(label).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    <div class="font-picker-list"></div>`;

  const list = wrap.querySelector('.font-picker-list');

  function loadFont(family) {
    const id = 'gf-' + family.replace(/ /g, '-');
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@400;500&display=swap`;
      document.head.appendChild(link);
    }
  }

  function render(selected) {
    list.innerHTML = fonts.map(f => `
      <button type="button" class="font-option ${f === selected ? 'active' : ''}" data-font="${f}">
        <span class="font-preview" style="font-family:'${f}',serif;">${f}</span>
      </button>`).join('');
    fonts.forEach(loadFont);
    list.querySelectorAll('.font-option').forEach(btn =>
      btn.onclick = () => { render(btn.dataset.font); onChange?.(btn.dataset.font); });
  }

  render(value);

  return { el: wrap, getValue: () => list.querySelector('.active')?.dataset.font || value };
}
