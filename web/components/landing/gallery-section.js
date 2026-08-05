import { resolveUploadUrl } from '../../utils/media.js';

const BENTO_SPANS = [
  'md:col-span-2 md:row-span-2',
  '',
  '',
  'md:col-span-2',
  '',
  '',
];

export function renderGallerySection(items = []) {
  const list = Array.isArray(items) ? items : [];

  return `
    <section id="galeria" class="landing-section border-y border-white/5 bg-surface-900/20">
      <div class="landing-container">
        <div class="mx-auto mb-14 max-w-2xl text-center" data-reveal>
          <p class="landing-eyebrow">Archivo visual</p>
          <h2 class="landing-title">Galería</h2>
          <p class="landing-lead mx-auto">
            Instantáneas del día a día institucional: patrullajes, operativos, formación y ceremonial.
          </p>
        </div>

        <div class="grid auto-rows-[12rem] grid-cols-1 gap-4 sm:auto-rows-[14rem] md:grid-cols-4 md:auto-rows-[11rem]" data-gallery-grid>
          ${
            list.length
              ? list.map((item, index) => renderGalleryItem(item, index)).join('')
              : `<p class="text-sm text-ink-400 md:col-span-4" data-reveal>La galería institucional se actualizará próximamente.</p>`
          }
        </div>
      </div>
    </section>
  `;
}

export function paintGallerySection(root, items = []) {
  const grid = root.querySelector('[data-gallery-grid]');
  if (!grid) return;
  const list = Array.isArray(items) ? items : [];
  grid.innerHTML = list.length
    ? list.map((item, index) => renderGalleryItem(item, index)).join('')
    : `<p class="text-sm text-ink-400 md:col-span-4">La galería institucional se actualizará próximamente.</p>`;
}

function renderGalleryItem(item, index) {
  const image = resolveUploadUrl(item.imageUrl);
  const span = BENTO_SPANS[index % BENTO_SPANS.length] || '';
  const title = item.title || 'Galería SAED';
  const caption = item.description || '';

  return `
    <figure class="gallery-item ${span} ${index === 0 ? 'min-h-[18rem] md:min-h-0' : ''}" data-reveal data-reveal-delay="${index * 50}">
      ${
        image
          ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" class="absolute inset-0 h-full w-full object-cover" loading="lazy" />`
          : `<div class="absolute inset-0 flex items-center justify-center bg-surface-900 text-sm text-ink-500">Sin imagen</div>`
      }
      <figcaption class="gallery-overlay">
        ${caption ? `<span class="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">${escapeHtml(caption)}</span>` : ''}
        <span class="text-base font-semibold text-white">${escapeHtml(title)}</span>
      </figcaption>
    </figure>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
