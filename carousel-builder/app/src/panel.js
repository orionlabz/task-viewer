import { createRichText } from './rich-text.js';

/**
 * Migrate legacy plain-text slide fields into the corresponding HTML field.
 * Used when a slide was created before rich-text was introduced.
 */
export function migratePlainToHtml(slide, htmlField) {
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const map = {
    headline_html:       () => slide.headline
      ? (esc(slide.headline) + (slide.headline_italic ? ' <em>' + esc(slide.headline_italic) + '</em>' : ''))
      : '',
    body_html:           () => esc(slide.body || ''),
    conclusion_html:     () => esc(slide.conclusion || ''),
    call_to_action_html: () => slide.call_to_action
      ? (esc(slide.call_to_action) + (slide.call_to_action_italic ? ' <em>' + esc(slide.call_to_action_italic) + '</em>' : ''))
      : '',
  };
  return map[htmlField]?.() || '';
}

/**
 * Create a labelled rich-text form group for the given field.
 *
 * @param {object} slide    - The slide object (mutated on change).
 * @param {string} fieldName - The html field name (e.g. 'headline_html').
 * @param {string} label    - Human-readable label shown above the editor.
 * @param {Function} onUpdate - Called after each change (trigger preview + save).
 * @returns {HTMLElement}   - A .form-group div ready to insert into the DOM.
 */
export function fRich(slide, fieldName, label, onUpdate) {
  const wrap = document.createElement('div');
  wrap.className = 'form-group';

  const lbl = document.createElement('div');
  lbl.className = 'field-label';
  lbl.textContent = label;
  wrap.appendChild(lbl);

  const rt = createRichText({
    value: slide[fieldName] || migratePlainToHtml(slide, fieldName) || '',
    placeholder: label,
    onChange: html => {
      slide[fieldName] = html;
      onUpdate();
    },
  });
  wrap.appendChild(rt.el);

  return wrap;
}
