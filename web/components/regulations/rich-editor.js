/**
 * Lightweight contenteditable rich editor for institutional regulations.
 * Produces sanitized HTML consumed by the document reader.
 */

const BUTTONS = [
  { cmd: 'formatBlock', value: 'H2', label: 'H2', title: 'Encabezado 2' },
  { cmd: 'formatBlock', value: 'H3', label: 'H3', title: 'Encabezado 3' },
  { cmd: 'bold', label: 'B', title: 'Negrita', className: 'font-bold' },
  { cmd: 'italic', label: 'I', title: 'Cursiva', className: 'italic' },
  { cmd: 'underline', label: 'U', title: 'Subrayado', className: 'underline' },
  { cmd: 'insertUnorderedList', label: '• Lista', title: 'Lista' },
  { cmd: 'insertOrderedList', label: '1. Lista', title: 'Lista numerada' },
  { cmd: 'formatBlock', value: 'BLOCKQUOTE', label: 'Cita', title: 'Cita' },
  { cmd: 'formatBlock', value: 'PRE', label: '</>', title: 'Código' },
  { cmd: 'insertHorizontalRule', label: '—', title: 'Separador' },
];

export function renderRichEditor({ id = 'regulation-editor', initialHtml = '' } = {}) {
  return `
    <div class="overflow-hidden rounded-2xl border border-white/10 bg-black/20" data-rich-editor="${id}">
      <div class="flex flex-wrap gap-1 border-b border-white/10 p-2" data-rich-toolbar>
        ${BUTTONS.map(
          (item) => `
            <button type="button" class="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-200 hover:bg-white/[0.06] ${item.className ?? ''}"
              data-cmd="${item.cmd}" ${item.value ? `data-value="${item.value}"` : ''} title="${item.title}">
              ${item.label}
            </button>
          `,
        ).join('')}
        <button type="button" class="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-200 hover:bg-white/[0.06]" data-cmd="createLink" title="Enlace">Enlace</button>
        <button type="button" class="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-200 hover:bg-white/[0.06]" data-cmd="insertImage" title="Imagen">Imagen</button>
        <button type="button" class="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-200 hover:bg-white/[0.06]" data-cmd="insertTable" title="Tabla">Tabla</button>
        <button type="button" class="rounded-lg border border-brand-400/30 bg-brand-500/10 px-2.5 py-1.5 text-xs text-brand-200" data-cmd="insertCallout" title="Bloque destacado">Destacado</button>
      </div>
      <div id="${id}" class="regulation-editor-surface min-h-[320px] max-h-[560px] overflow-y-auto px-5 py-4 text-sm leading-relaxed text-ink-100 outline-none"
        contenteditable="true" role="textbox" aria-multiline="true">
        ${initialHtml || '<p><br></p>'}
      </div>
      <div data-rich-prompt class="hidden border-t border-white/10 bg-black/40 p-3">
        <label class="form-label" data-rich-prompt-label for="${id}-prompt">Valor</label>
        <div class="mt-1 flex flex-wrap gap-2">
          <input id="${id}-prompt" data-rich-prompt-input class="form-input flex-1" />
          <button type="button" data-rich-prompt-confirm class="btn-primary">Insertar</button>
          <button type="button" data-rich-prompt-cancel class="btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  `;
}

function openPrompt(host, { label, placeholder, defaultValue }) {
  const panel = host.querySelector('[data-rich-prompt]');
  const labelEl = host.querySelector('[data-rich-prompt-label]');
  const input = host.querySelector('[data-rich-prompt-input]');
  const confirmBtn = host.querySelector('[data-rich-prompt-confirm]');
  const cancelBtn = host.querySelector('[data-rich-prompt-cancel]');

  if (!panel || !input || !confirmBtn || !cancelBtn) {
    return Promise.resolve(null);
  }

  labelEl.textContent = label;
  input.value = defaultValue ?? '';
  input.placeholder = placeholder ?? '';
  panel.classList.remove('hidden');
  input.focus();
  input.select();

  return new Promise((resolve) => {
    const cleanup = () => {
      panel.classList.add('hidden');
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKeydown);
    };

    const onConfirm = () => {
      const value = input.value.trim();
      cleanup();
      resolve(value || null);
    };

    const onCancel = () => {
      cleanup();
      resolve(null);
    };

    const onKeydown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onConfirm();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKeydown);
  });
}

export function bindRichEditor(root, editorId = 'regulation-editor') {
  const host = root.querySelector(`[data-rich-editor="${editorId}"]`);
  const surface = root.querySelector(`#${editorId}`);
  if (!host || !surface) {
    return { getHtml: () => '', setHtml: () => {} };
  }

  host.querySelectorAll('[data-cmd]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      surface.focus();
      const cmd = button.getAttribute('data-cmd');
      const value = button.getAttribute('data-value');

      if (cmd === 'createLink') {
        const url = await openPrompt(host, {
          label: 'URL del enlace',
          placeholder: 'https://',
          defaultValue: 'https://',
        });
        if (url) document.execCommand('createLink', false, url);
        return;
      }

      if (cmd === 'insertImage') {
        const url = await openPrompt(host, {
          label: 'URL de la imagen',
          placeholder: '/uploads/... o https://',
          defaultValue: '/uploads/',
        });
        if (url) document.execCommand('insertImage', false, url);
        return;
      }

      if (cmd === 'insertTable') {
        document.execCommand(
          'insertHTML',
          false,
          `<table><thead><tr><th>Columna</th><th>Columna</th></tr></thead><tbody><tr><td>—</td><td>—</td></tr><tr><td>—</td><td>—</td></tr></tbody></table><p></p>`,
        );
        return;
      }

      if (cmd === 'insertCallout') {
        document.execCommand(
          'insertHTML',
          false,
          `<div class="callout"><p><strong>Nota importante.</strong> Escribe aquí el contenido destacado.</p></div><p></p>`,
        );
        return;
      }

      if (cmd === 'formatBlock') {
        document.execCommand('formatBlock', false, value);
        return;
      }

      document.execCommand(cmd, false, value || null);
    });
  });

  return {
    getHtml: () => surface.innerHTML,
    setHtml: (html) => {
      surface.innerHTML = html || '<p><br></p>';
    },
  };
}
