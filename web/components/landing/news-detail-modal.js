import { formatDateLabel } from '../../utils/date.js';
import { resolveUploadUrl } from '../../utils/media.js';
import {
  openAppModal,
  renderAppModal,
  setAppModalContent,
} from '../ui/modal.js';

export const NEWS_DETAIL_MODAL_ID = 'news-detail-modal';

export function renderNewsDetailModalHost() {
  return renderAppModal({
    id: NEWS_DETAIL_MODAL_ID,
    title: 'Noticia',
    bodyHtml: '',
    size: 'xl',
  });
}

/**
 * Opens the reusable news detail modal.
 * `article.images` supports future multi-image carousels; today uses cover only.
 */
export function openNewsDetailModal(root, article) {
  if (!article) return;

  const images = normalizeNewsImages(article);
  const primary = images[0];
  const dateValue = article.publishedAt || article.createdAt;
  const dateLabel = formatDateLabel(dateValue) || '—';

  const bodyHtml = `
    <div class="space-y-5">
      ${
        primary
          ? `
        <div class="overflow-hidden rounded-2xl border border-white/10 bg-surface-950">
          <div class="aspect-[16/9] w-full sm:aspect-[2/1]">
            <img
              src="${escapeHtml(primary.url)}"
              alt="${escapeHtml(article.title)}"
              class="h-full w-full object-cover"
              data-news-hero-image
            />
          </div>
          ${
            images.length > 1
              ? `
            <div class="flex gap-2 overflow-x-auto border-t border-white/10 p-3" data-news-thumbs>
              ${images
                .map(
                  (image, index) => `
                <button
                  type="button"
                  class="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 ${index === 0 ? 'ring-2 ring-brand-400' : ''}"
                  data-news-thumb="${index}"
                >
                  <img src="${escapeHtml(image.url)}" alt="" class="h-full w-full object-cover" />
                </button>
              `,
                )
                .join('')}
            </div>
          `
              : ''
          }
        </div>
      `
          : ''
      }
      <div class="flex flex-wrap items-center gap-3 text-xs text-ink-400">
        <time datetime="${escapeHtml(dateValue ? new Date(dateValue).toISOString() : '')}">${escapeHtml(dateLabel)}</time>
        <span class="text-ink-600">·</span>
        <span>${escapeHtml(article.authorName || 'SAED')}</span>
      </div>
      <p class="text-sm leading-relaxed text-ink-300">${escapeHtml(article.summary || '')}</p>
      <div class="whitespace-pre-wrap text-sm leading-relaxed text-ink-200">${escapeHtml(article.content || '')}</div>
    </div>
  `;

  setAppModalContent(root, {
    modalId: NEWS_DETAIL_MODAL_ID,
    title: article.title || 'Noticia',
    bodyHtml,
    footerHtml: `<button type="button" class="btn-secondary" data-modal-close>Cerrar</button>`,
  });

  openAppModal(root, NEWS_DETAIL_MODAL_ID);

  if (images.length > 1) {
    const modal = root.querySelector(`#${NEWS_DETAIL_MODAL_ID}`);
    const mainImage = modal?.querySelector('[data-news-hero-image]');
    modal?.querySelectorAll('[data-news-thumb]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.getAttribute('data-news-thumb'));
        const image = images[index];
        if (!image || !mainImage) return;
        mainImage.src = image.url;
        modal.querySelectorAll('[data-news-thumb]').forEach((node, i) => {
          node.classList.toggle('ring-2', i === index);
          node.classList.toggle('ring-brand-400', i === index);
        });
      });
    });
  }
}

export function normalizeNewsImages(article) {
  if (Array.isArray(article?.images) && article.images.length) {
    return article.images
      .map((item, index) => ({
        url: resolveUploadUrl(item.url || item.imageUrl || item),
        caption: item.caption ?? null,
        sortOrder: item.sortOrder ?? index,
      }))
      .filter((item) => item.url)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const cover = resolveUploadUrl(article?.coverImageUrl);
  return cover ? [{ url: cover, caption: null, sortOrder: 0 }] : [];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
