import { getVisibleNavigation } from '../../config/navigation.js';
import { getAuthState } from '../../services/auth-context.js';
import { icon } from '../landing/icons.js';

export function renderSidebar({ currentPath = '/dashboard' } = {}) {
  const { permissions, activeCharacter } = getAuthState();
  const items = getVisibleNavigation(permissions, activeCharacter);
  const avatar = activeCharacter?.avatarUrl;
  const initials =
    `${activeCharacter?.firstName?.[0] ?? ''}${activeCharacter?.lastName?.[0] ?? ''}`.toUpperCase() ||
    '—';

  return `
    <aside id="app-sidebar" class="dash-sidebar">
      <div class="flex h-[4.25rem] items-center gap-3 border-b border-white/8 px-5">
        <span class="flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-400/30 bg-brand-500/10 text-brand-300">
          ${icon('cross', 'h-5 w-5')}
        </span>
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-400">SAED</p>
          <p class="text-sm font-semibold text-white">Operations</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Navegación principal">
        <p class="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500">Módulos</p>
        ${items
          .map((item) => {
            const isActive = currentPath === item.path || currentPath.startsWith(`${item.path}/`);
            return `
              <a
                data-link
                href="${item.path}"
                class="dash-nav-item ${isActive ? 'is-active' : ''}"
              >
                <span class="${isActive ? 'text-brand-300' : 'text-ink-500'}">${item.iconHtml}</span>
                <span>${item.name}</span>
                ${isActive ? '<span class="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400"></span>' : ''}
              </a>
            `;
          })
          .join('')}
      </nav>

      <div class="border-t border-white/8 p-4">
        <div class="rounded-2xl border border-white/8 bg-gradient-to-br from-brand-500/10 to-transparent p-3">
          <div class="flex items-center gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-surface-950 text-xs font-semibold text-brand-200">
              ${
                avatar
                  ? `<img src="${avatar}" alt="" class="h-full w-full object-cover" />`
                  : initials
              }
            </span>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-white">
                ${activeCharacter ? `${activeCharacter.firstName} ${activeCharacter.lastName}` : 'Sin personaje'}
              </p>
              <p class="truncate text-[11px] text-ink-400">${activeCharacter?.rank ?? 'Selecciona identidad'}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
    <div id="sidebar-overlay" class="fixed inset-0 z-30 hidden bg-surface-950/70 backdrop-blur-sm lg:hidden"></div>
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
