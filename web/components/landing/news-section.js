import { icon } from './icons.js';
import { resolveUploadUrl } from '../../utils/media.js';
import { formatDateLabel } from '../../utils/date.js';
import { openNewsDetailModal } from './news-detail-modal.js';

export function renderNewsSection(articles = []) {
  const items = Array.isArray(articles) ? articles : [];

  return `
    <section id="noticias" class="landing-section border-y border-white/5 bg-surface-900/25">
      <div class="landing-container">
        <div class="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between" data-reveal>
          <div>
            <p class="landing-eyebrow">Comunicados</p>
            <h2 class="landing-title">Noticias institucionales</h2>
            <p class="landing-lead">Actualidad del SAED, academia y avances del departamento médico.</p>
          </div>
        </div>

        <div class="grid gap-5 lg:grid-cols-3" data-news-grid>
          ${
            items.length
              ? items.map((item, index) => renderNewsCard(item, index)).join('')
              : `
                <div class="surface-card p-8 lg:col-span-3" data-reveal>
                  <p class="text-sm text-ink-300">Pronto publicaremos novedades del departamento médico.</p>
                </div>
              `
          }
        </div>
      </div>
    </section>
  `;
}

export function paintNewsSection(root, articles = []) {
  const grid = root.querySelector('[data-news-grid]');
  if (!grid) return;
  const items = Array.isArray(articles) ? articles : [];
  grid.innerHTML = items.length
    ? items.map((item, index) => renderNewsCard(item, index)).join('')
    : `<div class="surface-card p-8 lg:col-span-3"><p class="text-sm text-ink-300">Pronto publicaremos novedades del departamento médico.</p></div>`;
}

export function bindNewsSection(root, articles = []) {
  const byId = new Map((articles ?? []).map((item) => [item.id, item]));
  const grid = root.querySelector('[data-news-grid]');
  if (!grid) return () => {};

  const onClick = (event) => {
    const card = event.target.closest('[data-news-open]');
    if (!card || !grid.contains(card)) return;
    const article = byId.get(card.getAttribute('data-news-open'));
    if (article) openNewsDetailModal(root, article);
  };

  const onKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('[data-news-open]');
    if (!card || !grid.contains(card)) return;
    event.preventDefault();
    const article = byId.get(card.getAttribute('data-news-open'));
    if (article) openNewsDetailModal(root, article);
  };

  grid.addEventListener('click', onClick);
  grid.addEventListener('keydown', onKeyDown);
  return () => {
    grid.removeEventListener('click', onClick);
    grid.removeEventListener('keydown', onKeyDown);
  };
}

function renderNewsCard(item, index) {
  const image = resolveUploadUrl(item.coverImageUrl);
  const dateValue = item.publishedAt || item.createdAt;
  const dateLabel = formatDateLabel(dateValue) || '—';
  const iso = dateValue ? new Date(dateValue).toISOString().slice(0, 10) : '';

  return `
    <article
      class="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-surface-950/60 text-left transition duration-300 hover:-translate-y-1.5 hover:border-brand-400/35"
      data-reveal
      data-reveal-delay="${index * 80}"
      data-news-open="${escapeHtml(item.id)}"
      role="button"
      tabindex="0"
      aria-label="Abrir noticia: ${escapeHtml(item.title)}"
    >
      <div class="news-card-image">
        ${
          image
            ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}" class="h-full w-full object-cover" loading="lazy" />`
            : `<div class="flex h-full items-center justify-center bg-surface-900 text-sm text-ink-500">Sin imagen</div>`
        }
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/40 to-transparent"></div>
      </div>
      <div class="absolute inset-x-0 bottom-0 p-6">
        <time class="text-xs text-brand-300" datetime="${escapeHtml(iso)}">${escapeHtml(dateLabel)}</time>
        <h3 class="mt-2 text-lg font-semibold leading-snug text-white">${escapeHtml(item.title)}</h3>
        <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-300">${escapeHtml(item.summary)}</p>
        <span class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-300">
          Leer
          ${icon('arrowRight', 'h-4 w-4')}
        </span>
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
