import { renderCharacterCard } from '../components/characters/character-card.js';
import { icon } from '../components/landing/icons.js';
import { MAX_CHARACTERS_PER_ACCOUNT } from '../config/characters.js';
import { renderAuthLayout } from '../layouts/auth.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  getCurrentCharacters,
  loadCharacters,
  switchActiveCharacter,
} from '../services/identity.service.js';
import { requireAuth } from '../utils/auth-guard.js';
import { navigate } from '../utils/router.js';
import { initScrollReveal } from '../utils/scroll-reveal.js';

export function selectCharacterPage() {
  if (!requireAuth()) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="mx-auto w-full max-w-6xl" data-reveal>
      <div class="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="landing-eyebrow">Sesión</p>
          <h1 class="text-3xl font-semibold tracking-tight text-white">Seleccionar personaje</h1>
          <p class="mt-3 max-w-xl text-sm leading-relaxed text-ink-300">
            Elige la identidad con la que accederás al sistema. Máximo ${MAX_CHARACTERS_PER_ACCOUNT} personajes por cuenta.
          </p>
        </div>
        <a
          data-link
          href="/characters/create"
          id="create-character-link"
          class="btn-secondary shrink-0 self-start sm:self-auto"
        >
          ${icon('users', 'h-4 w-4')}
          Nuevo personaje
        </a>
      </div>

      <div id="character-select-status" class="mb-4 text-sm text-ink-400">Cargando personajes...</div>
      <div id="character-select-grid" class="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3"></div>
    </div>
  `;

  return {
    html: renderAuthLayout(content, { contentAlign: 'start' }),
    afterMount(root) {
      document.title = 'Seleccionar personaje · SAED';
      const cleanups = [initScrollReveal(root)];
      root.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));

      const status = root.querySelector('#character-select-status');
      const grid = root.querySelector('#character-select-grid');
      const createLink = root.querySelector('#create-character-link');

      const renderList = (characters) => {
        if (!characters.length) {
          void navigate('/characters/create', { replace: true });
          return;
        }

        if (createLink) {
          createLink.classList.toggle('hidden', characters.length >= MAX_CHARACTERS_PER_ACCOUNT);
        }

        if (status) {
          status.textContent = '';
        }

        if (grid) {
          grid.innerHTML = characters.map((character) => renderCharacterCard(character)).join('');
        }
      };

      const bootstrapList = async () => {
        try {
          const cached = getCurrentCharacters();
          if (cached.length) {
            renderList(cached);
          }

          const characters = await loadCharacters();
          renderList(characters);
        } catch (error) {
          if (status) {
            status.textContent = getApiErrorMessage(error, 'No se pudieron cargar los personajes.');
          }
        }
      };

      const onClick = async (event) => {
        const button = event.target.closest('[data-select-character]');
        if (!button) {
          return;
        }

        button.disabled = true;
        const characterId = button.getAttribute('data-select-character');

        try {
          await switchActiveCharacter(characterId);
          void navigate('/dashboard', { replace: true });
        } catch (error) {
          button.disabled = false;
          if (status) {
            status.textContent = getApiErrorMessage(error, 'No se pudo seleccionar el personaje.');
          }
        }
      };

      root.addEventListener('click', onClick);
      cleanups.push(() => root.removeEventListener('click', onClick));
      void bootstrapList();

      return () => cleanups.forEach((fn) => fn?.());
    },
  };
}
