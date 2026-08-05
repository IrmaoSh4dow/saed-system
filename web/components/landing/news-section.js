import { icon } from './icons.js';
import { resolveUploadUrl } from '../../utils/media.js';
import { formatDateLabel } from '../../utils/date.js';
import { openNewsDetailModal } from './news-detail-modal.js';

export function renderNewsSection(articles = []) {
  const items = Array.isArray(articles) ? articles : [];

  return `
    <section id="noticias" class="landing-section">
      <div class="landing-container">
        <div class="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between" data-reveal>
          <div>
            <p class="landing-eyebrow">Actualidad</p>
            <h2 class="landing-title">Noticias del departamento</h2>
            <p class="landing-lead">Comunicados, operaciones y avances institucionales.</p>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-3" data-news-grid>
          ${
            items.length
              ? items.map((item, index) => renderNewsCard(item, index)).join('')
              : `
                <p class="text-sm text-ink-400 lg:col-span-3" data-reveal>
                  Pronto publicaremos novedades del departamento.
                </p>
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
    : `<p class="text-sm text-ink-400 lg:col-span-3">Pronto publicaremos novedades del departamento.</p>`;
}

export function bindNewsSection(root, articles = []) {
  const byId = new Map((articles ?? []).map((item) => [item.id, item]));
  const grid = root.querySelector('[data-news-grid]');
  if (!grid) {
    return () => {};
  }

  const onClick = (event) => {
    const card = event.target.closest('[data-news-open]');
    if (!card || !grid.contains(card)) return;
    const id = card.getAttribute('data-news-open');
    const article = byId.get(id);
    if (article) {
      openNewsDetailModal(root, article);
    }
  };

  const onKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('[data-news-open]');
    if (!card || !grid.contains(card)) return;
    event.preventDefault();
    const id = card.getAttribute('data-news-open');
    const article = byId.get(id);
    if (article) {
      openNewsDetailModal(root, article);
    }
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
      class="group surface-card surface-card-hover cursor-pointer overflow-hidden text-left"
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
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-950/50 to-transparent"></div>
        <span class="absolute left-4 top-4 rounded-full border border-white/15 bg-surface-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-300 backdrop-blur">
          ${escapeHtml(item.authorName || 'SAED')}
        </span>
      </div>
      <div class="flex flex-1 flex-col p-6">
        <time class="text-xs text-ink-400" datetime="${escapeHtml(iso)}">${escapeHtml(dateLabel)}</time>
        <h3 class="mt-3 text-lg font-semibold leading-snug text-white transition group-hover:text-brand-300">${escapeHtml(item.title)}</h3>
        <p class="mt-3 flex-1 text-sm leading-relaxed text-ink-300">${escapeHtml(item.summary)}</p>
        <span class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-300">
          Leer más
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
