/**
 * Reusable modal shell (dark dashboard style).
 * Call openAppModal / closeAppModal; bindAppModal wires dismiss actions.
 */

export function renderAppModal({
  id = 'app-modal',
  title = '',
  bodyHtml = '',
  footerHtml = '',
  size = 'xl',
} = {}) {
  const widthClass =
    size === 'lg'
      ? 'max-w-3xl'
      : size === 'md'
        ? 'max-w-xl'
        : size === 'full'
          ? 'max-w-5xl'
          : 'max-w-4xl';

  return `
    <div
      id="${id}"
      class="fixed inset-0 z-[80] hidden items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="${id}-title"
      data-app-modal
    >
      <div class="absolute inset-0 bg-surface-950/75 backdrop-blur-sm" data-modal-backdrop></div>
      <div
        class="relative z-10 flex max-h-[min(92vh,56rem)] w-full ${widthClass} flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-900 shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
        data-modal-panel
      >
        <div class="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <h2 id="${id}-title" class="text-lg font-semibold tracking-tight text-white" data-modal-title>${title}</h2>
          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-ink-300 transition hover:bg-white/[0.06] hover:text-white"
            data-modal-close
            aria-label="Cerrar"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path stroke="currentColor" stroke-linecap="round" stroke-width="1.75" d="M6 6l12 12M18 6 6 18"/>
            </svg>
          </button>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6" data-modal-body>
          ${bodyHtml}
        </div>
        <div class="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-white/10 px-5 py-4 sm:px-6" data-modal-footer>
          ${footerHtml || `<button type="button" class="btn-secondary" data-modal-close>Cerrar</button>`}
        </div>
      </div>
    </div>
  `;
}

export function openAppModal(root, modalId = 'app-modal') {
  const modal = resolveModal(root, modalId);
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.documentElement.classList.add('overflow-hidden');
  document.body.classList.add('overflow-hidden');
  modal.querySelector('[data-modal-close]')?.focus?.();
}

export function closeAppModal(root, modalId = 'app-modal') {
  const modal = resolveModal(root, modalId);
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.documentElement.classList.remove('overflow-hidden');
  document.body.classList.remove('overflow-hidden');
}

export function setAppModalContent(root, { title, bodyHtml, footerHtml, modalId = 'app-modal' } = {}) {
  const modal = resolveModal(root, modalId);
  if (!modal) return;
  if (title !== undefined) {
    const titleEl = modal.querySelector('[data-modal-title]');
    if (titleEl) titleEl.textContent = title;
  }
  if (bodyHtml !== undefined) {
    const body = modal.querySelector('[data-modal-body]');
    if (body) body.innerHTML = bodyHtml;
  }
  if (footerHtml !== undefined) {
    const footer = modal.querySelector('[data-modal-footer]');
    if (footer) footer.innerHTML = footerHtml;
  }
}

export function bindAppModal(root, { modalId = 'app-modal', onClose } = {}) {
  const modal = resolveModal(root, modalId);
  if (!modal) {
    return () => {};
  }

  const close = () => {
    closeAppModal(root, modalId);
    onClose?.();
  };

  const onClick = (event) => {
    if (event.target.closest('[data-modal-close]') || event.target.closest('[data-modal-backdrop]')) {
      close();
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
      close();
    }
  };

  modal.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeyDown);

  return () => {
    modal.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKeyDown);
    closeAppModal(root, modalId);
  };
}

function resolveModal(root, modalId) {
  if (!root) return document.getElementById(modalId);
  return root.querySelector(`#${modalId}`) || document.getElementById(modalId);
}
