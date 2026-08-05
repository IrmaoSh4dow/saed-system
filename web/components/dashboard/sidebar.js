import { getVisibleNavigation } from '../../config/navigation.js';
import { getAuthState } from '../../services/auth-context.js';
import { icon } from '../landing/icons.js';

export function renderSidebar({ currentPath = '/dashboard' } = {}) {
  const { permissions, activeCharacter } = getAuthState();
  const items = getVisibleNavigation(permissions, activeCharacter);

  return `
    <aside id="app-sidebar" class="fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-white/10 bg-surface-950/95 backdrop-blur-xl transition duration-300 lg:translate-x-0">
      <div class="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-300">
          ${icon('shield', 'h-5 w-5')}
        </span>
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-400">SAED</p>
          <p class="text-sm font-semibold text-white">Command</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Navegación principal">
        ${items
          .map((item) => {
            const isActive = currentPath === item.path || currentPath.startsWith(`${item.path}/`);
            return `
              <a
                data-link
                href="${item.path}"
                class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200 ${
                  isActive
                    ? 'bg-brand-500/15 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.25)]'
                    : 'text-ink-300 hover:bg-white/[0.04] hover:text-white'
                }"
              >
                <span class="${isActive ? 'text-brand-300' : 'text-ink-400'}">${item.iconHtml}</span>
                <span>${item.name}</span>
              </a>
            `;
          })
          .join('')}
      </nav>

      <div class="border-t border-white/10 p-4">
        <div class="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-ink-500">Personaje activo</p>
          <p class="mt-1 truncate text-sm font-semibold text-white">
            ${activeCharacter ? `${activeCharacter.firstName} ${activeCharacter.lastName}` : '—'}
          </p>
          <p class="mt-0.5 text-xs text-ink-400">${activeCharacter?.rank ?? 'Sin rango'}</p>
        </div>
      </div>
    </aside>
    <div id="sidebar-overlay" class="fixed inset-0 z-30 hidden bg-surface-950/60 backdrop-blur-sm lg:hidden"></div>
  `;
}

export function initSidebar(root = document) {
  const sidebar = root.querySelector('#app-sidebar');
  const overlay = root.querySelector('#sidebar-overlay');
  const openButtons = [...root.querySelectorAll('[data-open-sidebar]')];
  const closeTargets = [overlay, ...root.querySelectorAll('[data-close-sidebar]')];

  const open = () => {
    sidebar?.classList.remove('-translate-x-full');
    overlay?.classList.remove('hidden');
  };

  const close = () => {
    sidebar?.classList.add('-translate-x-full');
    overlay?.classList.add('hidden');
  };

  openButtons.forEach((button) => button.addEventListener('click', open));
  closeTargets.forEach((target) => target?.addEventListener('click', close));

  return () => {
    openButtons.forEach((button) => button.removeEventListener('click', open));
    closeTargets.forEach((target) => target?.removeEventListener('click', close));
  };
}
