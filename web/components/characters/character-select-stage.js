import { MAX_CHARACTERS_PER_ACCOUNT } from '../../config/characters.js';
import { isSaedMember } from '../../utils/character.js';
import { resolveUploadUrl } from '../../utils/media.js';
import { icon } from '../landing/icons.js';

const STATUS_LABELS = {
  CIVIL: 'Civil',
  CADET: 'Interno',
  INTERN: 'Interno',
  OFFICER: 'Personal médico',
  MEDICAL_STAFF: 'Personal médico',
  RETIRED: 'Retirado',
  SUSPENDED: 'Suspendido',
};

/**
 * Builds carousel slides from characters (+ create slot when available).
 * @param {Array} characters
 */
export function buildCharacterSlides(characters = []) {
  const slides = characters.map((character) => ({ type: 'character', character }));
  if (characters.length < MAX_CHARACTERS_PER_ACCOUNT) {
    slides.push({ type: 'create' });
  }
  return slides;
}

export function renderCharacterSelectStage(slides = [], activeIndex = 0) {
  const active = slides[activeIndex] ?? null;
  const detail = active?.type === 'character' ? renderFocusDetail(active.character) : renderCreateDetail();

  return `
    <div class="cs-shell" id="character-select-stage" data-active-index="${activeIndex}">
      <div class="pointer-events-none absolute inset-0 cs-atmosphere"></div>
      <div class="pointer-events-none absolute inset-x-0 top-0 h-px cs-scan"></div>

      <header class="relative z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <a data-link href="/" class="group flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-400/30 bg-brand-500/10 text-brand-300 transition group-hover:bg-brand-500/20">
            ${icon('cross', 'h-5 w-5')}
          </span>
          <span>
            <span class="block text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-400">SAED</span>
            <span class="block text-sm font-semibold text-white">Identity Select</span>
          </span>
        </a>
        <p class="hidden text-xs uppercase tracking-[0.22em] text-ink-500 sm:block">Elige tu identidad operativa</p>
      </header>

      <div class="relative z-10 flex flex-1 flex-col justify-center gap-8 px-4 pb-10 pt-2 md:px-8 lg:flex-row lg:items-center lg:gap-12 lg:px-12 lg:pb-16">
        <div class="relative mx-auto w-full max-w-5xl lg:flex-1">
          <div class="cs-stage" id="cs-stage" aria-roledescription="carousel" aria-label="Selector de personajes">
            ${slides.map((slide, index) => renderSlide(slide, index, activeIndex)).join('')}
          </div>

          <div class="mt-8 flex items-center justify-center gap-4">
            <button type="button" class="cs-nav-btn" id="cs-prev" aria-label="Anterior" ${slides.length < 2 ? 'disabled' : ''}>
              ${icon('arrowLeft', 'h-4 w-4')}
            </button>
            <div class="flex items-center gap-2" id="cs-dots">
              ${slides
                .map(
                  (_, index) => `
                    <button
                      type="button"
                      class="cs-dot ${index === activeIndex ? 'is-active' : ''}"
                      data-cs-dot="${index}"
                      aria-label="Ir al slot ${index + 1}"
                    ></button>
                  `,
                )
                .join('')}
            </div>
            <button type="button" class="cs-nav-btn" id="cs-next" aria-label="Siguiente" ${slides.length < 2 ? 'disabled' : ''}>
              ${icon('arrowRight', 'h-4 w-4')}
            </button>
          </div>
        </div>

        <aside class="relative mx-auto w-full max-w-md lg:mx-0 lg:w-[22rem] xl:w-[24rem]" id="cs-detail-panel">
          ${detail}
        </aside>
      </div>
    </div>
  `;
}

export function paintCharacterSelectStage(root, slides, activeIndex) {
  const stage = root.querySelector('#cs-stage');
  const detail = root.querySelector('#cs-detail-panel');
  const dots = root.querySelector('#cs-dots');
  const shell = root.querySelector('#character-select-stage');
  if (!stage || !detail) return;

  shell?.setAttribute('data-active-index', String(activeIndex));
  stage.innerHTML = slides.map((slide, index) => renderSlide(slide, index, activeIndex)).join('');
  detail.innerHTML =
    slides[activeIndex]?.type === 'character'
      ? renderFocusDetail(slides[activeIndex].character)
      : renderCreateDetail();

  if (dots) {
    dots.innerHTML = slides
      .map(
        (_, index) => `
          <button
            type="button"
            class="cs-dot ${index === activeIndex ? 'is-active' : ''}"
            data-cs-dot="${index}"
            aria-label="Ir al slot ${index + 1}"
          ></button>
        `,
      )
      .join('');
  }
}

function renderSlide(slide, index, activeIndex) {
  const offset = index - activeIndex;
  if (slide.type === 'create') {
    return `
      <article class="cs-slide" data-offset="${offset}" data-cs-index="${index}" data-cs-type="create">
        <div class="cs-card cs-card-create">
          <div class="cs-card-media">
            <div class="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-brand-500/10 via-surface-900 to-surface-950">
              <span class="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-brand-400/40 bg-brand-500/10 text-brand-300">
                ${icon('users', 'h-8 w-8')}
              </span>
              <p class="text-sm font-semibold uppercase tracking-[0.28em] text-brand-300">Nuevo</p>
            </div>
          </div>
          <div class="cs-card-footer">
            <p class="text-xl font-semibold text-white">Crear personaje</p>
            <p class="mt-1 text-sm text-ink-400">Slot disponible</p>
          </div>
        </div>
      </article>
    `;
  }

  const character = slide.character;
  const name = `${character.firstName ?? ''} ${character.lastName ?? ''}`.trim();
  const initials = `${character.firstName?.[0] ?? ''}${character.lastName?.[0] ?? ''}`.toUpperCase();
  const avatar = resolveUploadUrl(character.avatarUrl);
  const status = STATUS_LABELS[character.status] ?? character.status ?? '—';

  return `
    <article class="cs-slide" data-offset="${offset}" data-cs-index="${index}" data-cs-type="character" data-character-id="${escapeHtml(character.id)}">
      <div class="cs-card">
        <div class="cs-card-media">
          ${
            avatar
              ? `<img src="${escapeHtml(avatar)}" alt="${escapeHtml(name)}" class="cs-card-photo" />`
              : `<div class="flex h-full items-center justify-center bg-gradient-to-br from-brand-600/25 via-surface-900 to-surface-950 text-5xl font-semibold text-white">${escapeHtml(initials)}</div>`
          }
          <div class="cs-card-shade"></div>
          <span class="cs-status">${escapeHtml(status)}</span>
        </div>
        <div class="cs-card-footer">
          <p class="truncate text-xl font-semibold text-white md:text-2xl">${escapeHtml(name || 'Personaje')}</p>
          <p class="mt-1 truncate text-sm text-brand-300">${escapeHtml(character.rank ?? status)}</p>
        </div>
      </div>
    </article>
  `;
}

function renderFocusDetail(character) {
  const name = `${character.firstName ?? ''} ${character.lastName ?? ''}`.trim();
  const status = STATUS_LABELS[character.status] ?? character.status ?? '—';
  const isSaed = isSaedMember(character);
  const organization =
    character.organization ??
    character.primaryOccupation?.organization ??
    (isSaed ? 'SAED' : 'Civil');
  const employeeNumber = character.staffProfile?.employeeNumber ?? null;
  const department =
    character.department ?? character.staffProfile?.department?.name ?? null;
  const licenses = isSaed ? (character.staffProfile?.licenses ?? []).slice(0, 4) : [];
  const decorations = isSaed ? (character.staffProfile?.decorations ?? []).slice(0, 3) : [];

  return `
    <div class="cs-detail panel p-6 md:p-7">
      <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-400">Identidad seleccionada</p>
      <h2 class="mt-3 text-3xl font-semibold tracking-tight text-white">${escapeHtml(name)}</h2>
      <p class="mt-2 text-sm text-ink-300">
        ${
          isSaed
            ? `${escapeHtml(character.rank ?? status)} · ${escapeHtml(organization)}`
            : `${escapeHtml(status)} · ${escapeHtml(organization)}`
        }
      </p>

      <dl class="mt-8 grid grid-cols-2 gap-3">
        ${metaTile('Estado', status)}
        ${metaTile('Organización', organization)}
        ${
          isSaed
            ? `${metaTile('Departamento', department ?? 'Sin asignar')}${metaTile('Nº empleado', employeeNumber ?? '—')}`
            : `${metaTile('Perfil', 'Ciudadano')}${metaTile('Acceso', 'Portal civil')}`
        }
      </dl>

      ${
        licenses.length
          ? `
            <div class="mt-6">
              <p class="text-[11px] uppercase tracking-[0.18em] text-ink-500">Certificaciones</p>
              <div class="mt-3 flex flex-wrap gap-2">
                ${licenses
                  .map(
                    (item) => `
                      <span class="rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
                        ${escapeHtml(item.license?.code ?? item.code ?? 'CERT')}
                      </span>
                    `,
                  )
                  .join('')}
              </div>
            </div>
          `
          : ''
      }

      ${
        decorations.length
          ? `
            <div class="mt-5">
              <p class="text-[11px] uppercase tracking-[0.18em] text-ink-500">Reconocimientos</p>
              <div class="mt-3 flex flex-wrap gap-2">
                ${decorations
                  .map(
                    (item) => `
                      <span class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-ink-200">
                        ${escapeHtml(item.decoration?.name ?? item.name ?? 'Award')}
                      </span>
                    `,
                  )
                  .join('')}
              </div>
            </div>
          `
          : ''
      }

      <button type="button" class="btn-primary mt-8 w-full" data-select-character="${escapeHtml(character.id)}">
        Entrar con esta identidad
        ${icon('arrowRight', 'h-4 w-4')}
      </button>
    </div>
  `;
}

function renderCreateDetail() {
  return `
    <div class="cs-detail panel border-dashed border-brand-400/30 p-6 md:p-7">
      <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-400">Nuevo slot</p>
      <h2 class="mt-3 text-3xl font-semibold tracking-tight text-white">Crear personaje</h2>
      <p class="mt-3 text-sm leading-relaxed text-ink-300">
        Registra una nueva identidad para esta cuenta. Máximo ${MAX_CHARACTERS_PER_ACCOUNT} personajes.
      </p>
      <ul class="mt-6 space-y-3 text-sm text-ink-300">
        <li class="flex items-start gap-2"><span class="mt-1 text-brand-400">▸</span> Perfil civil o institucional</li>
        <li class="flex items-start gap-2"><span class="mt-1 text-brand-400">▸</span> Permisos independientes por personaje</li>
        <li class="flex items-start gap-2"><span class="mt-1 text-brand-400">▸</span> Cambio de identidad sin cerrar sesión</li>
      </ul>
      <a data-link href="/characters/create" class="btn-primary mt-8 w-full">
        Crear personaje
        ${icon('arrowRight', 'h-4 w-4')}
      </a>
    </div>
  `;
}

function metaTile(label, value) {
  return `
    <div class="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
      <dt class="text-[10px] uppercase tracking-[0.16em] text-ink-500">${escapeHtml(label)}</dt>
      <dd class="mt-1 truncate text-sm font-semibold text-white">${escapeHtml(value ?? '—')}</dd>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
