import {
  buildCharacterSlides,
  paintCharacterSelectStage,
  renderCharacterSelectStage,
} from '../components/characters/character-select-stage.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  getCurrentCharacters,
  loadCharacters,
  switchActiveCharacter,
} from '../services/identity.service.js';
import { requireAuth } from '../utils/auth-guard.js';
import { navigate } from '../utils/router.js';

export function selectCharacterPage() {
  if (!requireAuth()) {
    return { html: '', afterMount: () => {} };
  }

  return {
    html: `
      <div id="character-select-root" class="relative min-h-screen overflow-hidden bg-surface-950 text-ink-100">
        <div class="flex min-h-screen items-center justify-center px-6">
          <p id="character-select-status" class="text-sm text-ink-400">Preparando identidades...</p>
        </div>
      </div>
    `,
    afterMount(root) {
      document.title = 'Seleccionar personaje · SAED';
      const host = root.querySelector('#character-select-root') ?? root;
      const status = root.querySelector('#character-select-status');
      const cleanups = [];
      let slides = [];
      let activeIndex = 0;
      let selecting = false;

      const render = () => {
        host.innerHTML = renderCharacterSelectStage(slides, activeIndex);
        bindStage();
      };

      const setIndex = (nextIndex) => {
        if (!slides.length) return;
        const bounded = ((nextIndex % slides.length) + slides.length) % slides.length;
        if (bounded === activeIndex) return;
        activeIndex = bounded;
        paintCharacterSelectStage(host, slides, activeIndex);
        bindStage();
      };

      const bindStage = () => {
        cleanups.splice(0).forEach((fn) => fn?.());

        const onPrev = () => setIndex(activeIndex - 1);
        const onNext = () => setIndex(activeIndex + 1);
        const prev = host.querySelector('#cs-prev');
        const next = host.querySelector('#cs-next');
        prev?.addEventListener('click', onPrev);
        next?.addEventListener('click', onNext);
        cleanups.push(() => prev?.removeEventListener('click', onPrev));
        cleanups.push(() => next?.removeEventListener('click', onNext));

        const onDot = (event) => {
          const button = event.target.closest('[data-cs-dot]');
          if (!button) return;
          setIndex(Number(button.getAttribute('data-cs-dot')));
        };
        host.addEventListener('click', onDot);
        cleanups.push(() => host.removeEventListener('click', onDot));

        const onSlideClick = (event) => {
          const slide = event.target.closest('[data-cs-index]');
          if (!slide) return;
          const index = Number(slide.getAttribute('data-cs-index'));
          if (Number.isNaN(index)) return;
          if (index !== activeIndex) {
            setIndex(index);
            return;
          }
          if (slide.getAttribute('data-cs-type') === 'create') {
            void navigate('/characters/create');
          }
        };
        host.addEventListener('click', onSlideClick);
        cleanups.push(() => host.removeEventListener('click', onSlideClick));

        const onKeyDown = (event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setIndex(activeIndex - 1);
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            setIndex(activeIndex + 1);
          }
          if (event.key === 'Enter') {
            const slide = slides[activeIndex];
            if (slide?.type === 'create') {
              void navigate('/characters/create');
            }
          }
        };
        window.addEventListener('keydown', onKeyDown);
        cleanups.push(() => window.removeEventListener('keydown', onKeyDown));

        let touchStartX = 0;
        const onTouchStart = (event) => {
          touchStartX = event.changedTouches?.[0]?.clientX ?? 0;
        };
        const onTouchEnd = (event) => {
          const endX = event.changedTouches?.[0]?.clientX ?? 0;
          const delta = endX - touchStartX;
          if (Math.abs(delta) < 40) return;
          if (delta > 0) setIndex(activeIndex - 1);
          else setIndex(activeIndex + 1);
        };
        host.addEventListener('touchstart', onTouchStart, { passive: true });
        host.addEventListener('touchend', onTouchEnd, { passive: true });
        cleanups.push(() => host.removeEventListener('touchstart', onTouchStart));
        cleanups.push(() => host.removeEventListener('touchend', onTouchEnd));
      };

      const bootstrap = async () => {
        try {
          const cached = getCurrentCharacters();
          if (cached.length) {
            slides = buildCharacterSlides(cached);
            activeIndex = 0;
            render();
          }

          const characters = await loadCharacters();
          if (!characters.length) {
            void navigate('/characters/create', { replace: true });
            return;
          }

          slides = buildCharacterSlides(characters);
          activeIndex = 0;
          render();
        } catch (error) {
          if (status) {
            status.textContent = getApiErrorMessage(error, 'No se pudieron cargar los personajes.');
          } else {
            host.innerHTML = `<div class="flex min-h-screen items-center justify-center px-6"><p class="text-sm text-rose-300">${getApiErrorMessage(error, 'No se pudieron cargar los personajes.')}</p></div>`;
          }
        }
      };

      const onSelect = async (event) => {
        const button = event.target.closest('[data-select-character]');
        if (!button || selecting) return;
        selecting = true;
        button.disabled = true;
        const characterId = button.getAttribute('data-select-character');
        try {
          await switchActiveCharacter(characterId);
          void navigate('/dashboard', { replace: true });
        } catch (error) {
          selecting = false;
          button.disabled = false;
          const panel = host.querySelector('#cs-detail-panel');
          if (panel) {
            const alert = document.createElement('p');
            alert.className = 'mt-3 text-sm text-rose-300';
            alert.textContent = getApiErrorMessage(error, 'No se pudo seleccionar el personaje.');
            panel.appendChild(alert);
          }
        }
      };

      host.addEventListener('click', onSelect);
      void bootstrap();

      return () => {
        host.removeEventListener('click', onSelect);
        cleanups.forEach((fn) => fn?.());
      };
    },
  };
}
