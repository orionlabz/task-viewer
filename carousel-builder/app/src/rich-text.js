/**
 * Mini rich-text editor component.
 *
 * Usage:
 *   const rt = createRichText({ value: '<em>hello</em>', onChange: (html) => ... });
 *   container.appendChild(rt.el);
 *   rt.setValue('<strong>new</strong>');
 *   rt.getValue(); // returns clean HTML
 *
 * Allowed tags: <em>, <strong>, <span class="accent">
 * Toolbar: B (bold), I (italic), A (accent color toggle)
 */
export function createRichText({ value = '', onChange, placeholder = '' } = {}) {
  const toolbar = document.createElement('div');
  toolbar.className = 'rt-toolbar';
  toolbar.innerHTML = `
    <button type="button" class="rt-btn" data-cmd="bold" title="Negrito (Ctrl+B)"><strong>B</strong></button>
    <button type="button" class="rt-btn" data-cmd="italic" title="Itálico (Ctrl+I)"><em>I</em></button>
    <button type="button" class="rt-btn rt-btn-accent" data-cmd="accent" title="Cor de destaque">A</button>`;

  const editor = document.createElement('div');
  editor.className = 'rt-editor field-input';
  editor.contentEditable = 'true';
  editor.setAttribute('data-placeholder', placeholder);
  editor.innerHTML = sanitize(value);

  const wrap = document.createElement('div');
  wrap.className = 'rt-wrap';
  wrap.appendChild(toolbar);
  wrap.appendChild(editor);

  function execCmd(cmd) {
    editor.focus();
    if (cmd === 'bold') document.execCommand('bold', false);
    else if (cmd === 'italic') document.execCommand('italic', false);
    else if (cmd === 'accent') toggleAccent();
    // Note: sanitize() in getValue() normalizes <b>/<i> → <strong>/<em>
    onChange?.(getValue());
  }

  function toggleAccent() {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);

    // Detect if the selection's common ancestor is inside an .accent span
    const ancestor = range.commonAncestorContainer;
    const accentEl = (ancestor.nodeType === 3 ? ancestor.parentElement : ancestor)
      ?.closest?.('.accent');
    if (accentEl && editor.contains(accentEl)) {
      // Unwrap the accent span
      const frag = document.createDocumentFragment();
      while (accentEl.firstChild) frag.appendChild(accentEl.firstChild);
      accentEl.replaceWith(frag);
      editor.normalize();
      return;
    }

    // Wrap selection in accent span
    const span = document.createElement('span');
    span.className = 'accent';
    try {
      range.surroundContents(span);
    } catch {
      // Selection spans multiple nodes — extract and rewrap
      span.appendChild(range.extractContents());
      range.insertNode(span);
      // Re-select the span contents to preserve visible selection
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  }

  function getValue() {
    return sanitize(editor.innerHTML);
  }

  function setValue(html) {
    editor.innerHTML = sanitize(html);
  }

  function sanitize(html) {
    // Only allow <em>, <strong>, <span class="accent">
    return (html || '')
      .replace(/<b>/gi, '<strong>').replace(/<\/b>/gi, '</strong>')
      .replace(/<i>/gi, '<em>').replace(/<\/i>/gi, '</em>')
      .replace(/<(?!\/?(?:em|strong|span)[^>]*>)[^>]+>/gi, '') // strip other tags
      .replace(/<span(?!\s+class="accent")[^>]*>/gi, '<span class="accent">'); // normalize spans
  }

  toolbar.addEventListener('mousedown', e => {
    const btn = e.target.closest('[data-cmd]');
    if (!btn) return;
    e.preventDefault(); // don't blur editor
    execCmd(btn.dataset.cmd);
  });

  editor.addEventListener('input', () => onChange?.(getValue()));

  editor.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); execCmd('bold'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); execCmd('italic'); }
  });

  return { el: wrap, getValue, setValue };
}
