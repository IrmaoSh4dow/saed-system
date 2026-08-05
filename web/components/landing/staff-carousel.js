import { resolveUploadUrl } from '../../utils/media.js';

export function renderOfficerCarousel(officers = []) {
  const items = Array.isArray(officers) ? officers : [];

  return `
    <section id="personal" class="landing-section relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.08),_transparent_55%)]"></div>
      <div class="landing-container relative">
        <div class="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between" data-reveal>
          <div>
            <p class="landing-eyebrow">Mando</p>
            <h2 class="landing-title">Nuestro personal</h2>
            <p class="landing-lead">Los perfiles que sostienen la autoridad operativa del departamento.</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" id="officer-prev" class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:border-brand-400/40 hover:bg-brand-500/10" aria-label="Anterior">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="m15 6-6 6 6 6"/></svg>
            </button>
            <button type="button" id="officer-next" class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:border-brand-400/40 hover:bg-brand-500/10" aria-label="Siguiente">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="m9 6 6 6-6 6"/></svg>
            </button>
          </div>
        </div>

        <div class="relative" data-reveal>
          <div class="overflow-hidden">
            <div id="officer-track" class="carousel-track">
              ${
                items.length
                  ? items.map((officer) => renderOfficerCard(officer)).join('')
                  : `<p class="text-sm text-ink-400">Aún no hay personal publicado.</p>`
              }
            </div>
          </div>
          <div id="officer-dots" class="mt-8 flex justify-center gap-2"></div>
        </div>
      </div>
    </section>
  `;
}

export function paintOfficerCarousel(root, officers = []) {
  const track = root.querySelector('#officer-track');
  if (!track) return;
  const items = Array.isArray(officers) ? officers : [];
  track.innerHTML = items.length
    ? items.map((officer) => renderOfficerCard(officer)).join('')
    : `<p class="text-sm text-ink-400">Aún no hay personal publicado.</p>`;
}

function renderOfficerCard(officer) {
  const name = `${officer.character?.firstName ?? ''} ${officer.character?.lastName ?? ''}`.trim();
  const image = resolveUploadUrl(officer.character?.avatarUrl);
  const rank = officer.rank?.name ?? 'Sin rango';
  const department =
    officer.departmentMemberships?.find((row) => row.isPrimary)?.department?.name ??
    officer.department?.name ??
    'Sin departamento';
  const cargo =
    officer.supervisedDepartments?.[0]?.department?.name
      ? `Supervisor · ${officer.supervisedDepartments[0].department.name}`
      : officer.character?.occupations?.[0]?.position ||
        officer.callsign ||
        null;

  return `
    <article class="staff-card w-[min(100%,20rem)] sm:w-[22rem]">
      <div class="relative aspect-[4/5] overflow-hidden">
        ${
          image
            ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" class="h-full w-full object-cover transition duration-700 hover:scale-105" loading="lazy" />`
            : `<div class="flex h-full items-center justify-center bg-surface-900 text-sm text-ink-500">Sin foto</div>`
        }
        <div class="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/20 to-transparent"></div>
        <div class="absolute left-4 top-4 rounded-full border border-white/15 bg-surface-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-300 backdrop-blur">
          ${escapeHtml(department)}
        </div>
      </div>
      <div class="space-y-2 p-5">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">${escapeHtml(rank)}</p>
        <h3 class="text-xl font-semibold text-white">${escapeHtml(name || 'Personal')}</h3>
        ${cargo ? `<p class="text-sm leading-relaxed text-ink-300">${escapeHtml(cargo)}</p>` : ''}
      </div>
    </article>
  `;
}

export function initOfficerCarousel(root = document) {
  const track = root.querySelector('#officer-track');
  const prev = root.querySelector('#officer-prev');
  const next = root.querySelector('#officer-next');
  const dotsHost = root.querySelector('#officer-dots');

  if (!track || !prev || !next || !dotsHost) {
    return () => {};
  }

  let index = 0;

  const cards = () => [...track.querySelectorAll('.staff-card')];

  const getStep = () => {
    const card = cards()[0];
    if (!card) return 0;
    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '20') || 20;
    return card.getBoundingClientRect().width + gap;
  };

  const visibleCount = () => {
    const width = track.parentElement?.getBoundingClientRect().width || 0;
    const step = getStep();
    return Math.max(1, Math.floor(width / step));
  };

  const maxIndex = () => Math.max(0, cards().length - visibleCount());

  const renderDots = () => {
    const total = maxIndex() + 1;
    if (!cards().length) {
      dotsHost.innerHTML = '';
      return;
    }
    dotsHost.innerHTML = Array.from({ length: total }, (_, i) => {
      const active = i === index;
      return `<button type="button" class="h-2 rounded-full transition-all duration-300 ${active ? 'w-8 bg-brand-400' : 'w-2 bg-white/20 hover:bg-white/40'}" data-officer-dot="${i}" aria-label="Ir al grupo ${i + 1}"></button>`;
    }).join('');
  };

  const update = () => {
    index = Math.min(Math.max(index, 0), maxIndex());
    track.style.transform = `translateX(-${index * getStep()}px)`;
    renderDots();
  };

  const onPrev = () => {
    index -= 1;
    update();
  };

  const onNext = () => {
    index += 1;
    update();
  };

  const onDots = (event) => {
    const button = event.target.closest('[data-officer-dot]');
    if (!button) return;
    index = Number(button.getAttribute('data-officer-dot'));
    update();
  };

  const onResize = () => update();

  prev.addEventListener('click', onPrev);
  next.addEventListener('click', onNext);
  dotsHost.addEventListener('click', onDots);
  window.addEventListener('resize', onResize);
  update();

  return () => {
    prev.removeEventListener('click', onPrev);
    next.removeEventListener('click', onNext);
    dotsHost.removeEventListener('click', onDots);
    window.removeEventListener('resize', onResize);
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
