/**
 * Color picker: swatch preview + hex input.
 * Usage: createColorPicker({ value: '#CCFF00', label: 'Destaque', onChange: (hex) => ... })
 */
export function createColorPicker({ value = '#000000', label = '', onChange } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'color-picker-wrap';
  wrap.innerHTML = `
    <div class="color-picker-row">
      <label class="field-label" style="flex:1;">${escLabel(label)}</label>
      <div class="color-swatch-wrap">
        <input type="color" class="color-native" value="${value}" title="${escLabel(label)}">
        <div class="color-swatch" style="background:${value};"></div>
      </div>
      <input type="text" class="field-input color-hex" value="${value}" maxlength="7" style="width:80px;">
    </div>`;

  const native = wrap.querySelector('.color-native');
  const swatch = wrap.querySelector('.color-swatch');
  const hex = wrap.querySelector('.color-hex');

  function update(color) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return;
    native.value = color;
    swatch.style.background = color;
    hex.value = color;
    onChange?.(color);
  }

  native.addEventListener('input', () => update(native.value));
  hex.addEventListener('input', () => update(hex.value));
  hex.addEventListener('blur', () => { if (!/^#[0-9a-f]{6}$/i.test(hex.value)) hex.value = value; });

  return { el: wrap, getValue: () => hex.value, setValue: (c) => update(c) };
}

function escLabel(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
