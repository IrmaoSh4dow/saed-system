import { getAuthState } from '../../services/auth-context.js';
import { logoutAndRedirect } from '../../utils/auth-guard.js';
import { icon } from '../landing/icons.js';
import { initCharacterSwitcher, renderCharacterSwitcher } from './character-switcher.js';
import {
  initNotificationsDropdown,
  renderNotificationsDropdown,
} from './notifications-dropdown.js';

export function renderNavbar({ title = 'Dashboard' } = {}) {
  const { user, activeCharacter } = getAuthState();
  const initials = getInitials(activeCharacter);
  const displayName = activeCharacter
    ? `${activeCharacter.firstName} ${activeCharacter.lastName}`
    : (user?.displayName ?? 'Usuario');
  const rank = activeCharacter?.rank ?? 'Sin rango';

  return `
    <header class="dash-topbar">
      <div class="flex h-[4.25rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div class="flex min-w-0 items-center gap-3">
          <button
            type="button"
            data-open-sidebar
            class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-ink-200 transition hover:border-brand-400/30 hover:bg-brand-500/10 hover:text-white lg:hidden"
            aria-label="Abrir menú"
          >
            ${icon('menu', 'h-4 w-4')}
          </button>
          <div class="min-w-0">
            <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-500">SAED Operations</p>
            <h1 class="truncate text-base font-semibold text-white">${title}</h1>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          ${renderCharacterSwitcher()}
          ${renderNotificationsDropdown()}

          <div class="relative" id="profile-menu">
            <button
              type="button"
              id="profile-menu-toggle"
              class="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-3 transition hover:border-brand-400/30 hover:bg-brand-500/5"
              aria-expanded="false"
              aria-haspopup="menu"
            >
              <span class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-brand-500/15 text-xs font-semibold text-brand-200">
                ${
                  activeCharacter?.avatarUrl
                    ? `<img src="${activeCharacter.avatarUrl}" alt="" class="h-full w-full object-cover" />`
                    : initials
                }
              </span>
              <span class="hidden min-w-0 text-left sm:block">
                <span class="block max-w-[9rem] truncate text-sm font-semibold text-white">${displayName}</span>
                <span class="block max-w-[9rem] truncate text-[11px] text-ink-400">${rank}</span>
              </span>
              ${icon('chevronDown', 'hidden h-4 w-4 text-ink-400 sm:block')}
            </button>

            <div id="profile-menu-panel" class="absolute right-0 z-50 mt-2 hidden w-60 overflow-hidden rounded-2xl border border-white/10 bg-surface-900/95 shadow-2xl backdrop-blur-xl">
              <div class="border-b border-white/8 px-4 py-3">
                <p class="truncate text-sm font-semibold text-white">${displayName}</p>
                <p class="truncate text-xs text-ink-400">@${user?.username ?? 'cuenta'}</p>
              </div>
              <div class="p-2">
                <a data-link href="/profile" class="block rounded-xl px-3 py-2 text-sm text-ink-300 transition hover:bg-white/[0.04] hover:text-white">Mi perfil</a>
                <a data-link href="/settings" class="block rounded-xl px-3 py-2 text-sm text-ink-300 transition hover:bg-white/[0.04] hover:text-white">Configuración</a>
                <a data-link href="/characters/select" class="block rounded-xl px-3 py-2 text-sm text-ink-300 transition hover:bg-white/[0.04] hover:text-white">Cambiar personaje</a>
                <button type="button" id="app-logout" class="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm text-rose-300 transition hover:bg-rose-500/10">
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  `;
}

export function initNavbar(root = document) {
  const toggle = root.querySelector('#profile-menu-toggle');
  const panel = root.querySelector('#profile-menu-panel');
  const logoutButton = root.querySelector('#app-logout');
  const cleanups = [initCharacterSwitcher(root), initNotificationsDropdown(root)];

  const close = () => {
    panel?.classList.add('hidden');
    toggle?.setAttribute('aria-expanded', 'false');
  };

  const onToggle = (event) => {
    event.stopPropagation();
    if (!panel || !toggle) return;
    const isOpen = !panel.classList.contains('hidden');
    panel.classList.toggle('hidden', isOpen);
    toggle.setAttribute('aria-expanded', String(!isOpen));
  };

  const onDocumentClick = (event) => {
    if (!root.querySelector('#profile-menu')?.contains(event.target)) close();
  };

  toggle?.addEventListener('click', onToggle);
  document.addEventListener('click', onDocumentClick);
  logoutButton?.addEventListener('click', () => logoutAndRedirect());

  cleanups.push(() => {
    toggle?.removeEventListener('click', onToggle);
    document.removeEventListener('click', onDocumentClick);
  });

  return () => cleanups.forEach((fn) => fn?.());
}

function getInitials(character) {
  if (!character) return '?';
  return `${character.firstName?.[0] ?? ''}${character.lastName?.[0] ?? ''}`.toUpperCase() || '?';
}
