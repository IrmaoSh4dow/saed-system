import { getAuthState } from '../../services/auth-context.js';
import { switchActiveCharacter } from '../../services/identity.service.js';
import { MAX_CHARACTERS_PER_ACCOUNT } from '../../config/characters.js';
import { navigate } from '../../utils/router.js';

export function renderCharacterSwitcher() {
  const { activeCharacter, characters } = getAuthState();
  const canCreate = characters.length < MAX_CHARACTERS_PER_ACCOUNT;

  return `
    <div class="relative" id="character-switcher">
      <button
        type="button"
        id="character-switcher-toggle"
        class="inline-flex max-w-[14rem] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
        aria-expanded="false"
        aria-haspopup="listbox"
      >
        <span class="min-w-0">
          <span class="block truncate text-xs text-ink-400">Personaje</span>
          <span class="block truncate text-sm font-semibold text-white">
            ${activeCharacter ? `${activeCharacter.firstName} ${activeCharacter.lastName}` : 'Seleccionar'}
          </span>
        </span>
        <svg class="h-4 w-4 shrink-0 text-ink-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <div id="character-switcher-menu" class="absolute right-0 z-50 mt-2 hidden w-72 overflow-hidden rounded-2xl border border-white/10 bg-surface-900/95 shadow-2xl backdrop-blur-xl">
        <div class="border-b border-white/10 px-4 py-3">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">Cambiar personaje</p>
        </div>
        <ul class="max-h-72 overflow-y-auto py-2" role="listbox">
          ${characters
            .map((character) => {
              const selected = character.id === activeCharacter?.id;
              return `
                <li>
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04] ${selected ? 'bg-brand-500/10' : ''}"
                    data-switch-character="${character.id}"
                  >
                    <span class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-surface-950 text-xs font-semibold text-white">
                      ${
                        character.avatarUrl
                          ? `<img src="${character.avatarUrl}" alt="" class="h-full w-full object-cover object-center" />`
                          : `${character.firstName?.[0] ?? ''}${character.lastName?.[0] ?? ''}`
                      }
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-semibold text-white">${character.firstName} ${character.lastName}</span>
                      <span class="block truncate text-xs text-ink-400">${character.rank ?? character.status}</span>
                    </span>
                    ${selected ? '<span class="text-[11px] font-semibold text-brand-300">Activo</span>' : ''}
                  </button>
                </li>
              `;
            })
            .join('')}
        </ul>
        <div class="border-t border-white/10 p-2">
          ${
            canCreate
              ? `<a data-link href="/characters/create" class="block rounded-xl px-3 py-2 text-sm text-ink-300 transition hover:bg-white/[0.04] hover:text-white">
            Crear nuevo personaje
          </a>`
              : ''
          }
          <a data-link href="/characters/select" class="block rounded-xl px-3 py-2 text-sm text-ink-300 transition hover:bg-white/[0.04] hover:text-white">
            Ver selector completo
          </a>
        </div>
      </div>
    </div>
  `;
}

export function initCharacterSwitcher(root = document) {
  const toggle = root.querySelector('#character-switcher-toggle');
  const menu = root.querySelector('#character-switcher-menu');

  if (!toggle || !menu) {
    return () => {};
  }

  const close = () => {
    menu.classList.add('hidden');
    toggle.setAttribute('aria-expanded', 'false');
  };

  const onToggle = (event) => {
    event.stopPropagation();
    const isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden', isOpen);
    toggle.setAttribute('aria-expanded', String(!isOpen));
  };

  const onDocumentClick = (event) => {
    if (!root.querySelector('#character-switcher')?.contains(event.target)) {
      close();
    }
  };

  const onSwitch = async (event) => {
    const button = event.target.closest('[data-switch-character]');
    if (!button) {
      return;
    }

    const characterId = button.getAttribute('data-switch-character');
    button.disabled = true;

    try {
      await switchActiveCharacter(characterId);
      close();
      void navigate(window.location.pathname, { replace: true });
    } catch {
      button.disabled = false;
    }
  };

  toggle.addEventListener('click', onToggle);
  document.addEventListener('click', onDocumentClick);
  menu.addEventListener('click', onSwitch);

  return () => {
    toggle.removeEventListener('click', onToggle);
    document.removeEventListener('click', onDocumentClick);
    menu.removeEventListener('click', onSwitch);
  };
}
