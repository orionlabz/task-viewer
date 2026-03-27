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

    // Case 1: selection is entirely inside a single .accent span
    const ancestor = range.commonAncestorContainer;
    const directAccent = (ancestor.nodeType === 3 ? ancestor.parentElement : ancestor)
      ?.closest?.('.accent');
    if (directAccent && editor.contains(directAccent)) {
      const frag = document.createDocumentFragment();
      while (directAccent.firstChild) frag.appendChild(directAccent.firstChild);
      directAccent.replaceWith(frag);
      editor.normalize();
      return;
    }

    // Case 2: selection contains .accent spans — remove them all
    const preview = range.cloneContents();
    if (preview.querySelector('.accent')) {
      const extracted = range.extractContents();
      const tmp = document.createElement('div');
      tmp.appendChild(extracted);
      tmp.querySelectorAll('.accent').forEach(el => {
        const nodes = [...el.childNodes];
        el.replaceWith(...nodes);
      });
      // Re-insert cleaned content
      const cleaned = document.createDocumentFragment();
      while (tmp.firstChild) cleaned.appendChild(tmp.firstChild);
      range.insertNode(cleaned);
      editor.normalize();
      return;
    }

    // Case 3: no accent — wrap selection in accent span
    const span = document.createElement('span');
    span.className = 'accent';
    try {
      range.surroundContents(span);
    } catch {
      span.appendChild(range.extractContents());
      range.insertNode(span);
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
    // Only allow <em>, <strong>, <span class="accent">, <br>
    return (html || '')
      .replace(/\n/g, '<br>') // pre-wrap mode inserts \n text nodes; normalize to <br>
      .replace(/<b>/gi, '<strong>').replace(/<\/b>/gi, '</strong>')
      .replace(/<i>/gi, '<em>').replace(/<\/i>/gi, '</em>')
      // Normalize block elements (Chrome's Enter inserts <div>) to <br>
      .replace(/<\/div>/gi, '<br>').replace(/<div[^>]*>/gi, '')
      .replace(/<(?!\/?(?:em|strong|span|br)[^>]*>)[^>]+>/gi, '') // strip other tags
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
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertLineBreak');
      onChange?.(getValue());
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); execCmd('bold'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); execCmd('italic'); }
  });

  return { el: wrap, getValue, setValue };
}
