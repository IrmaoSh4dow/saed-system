import { resolveUploadUrl } from '../../utils/media.js';

/**
 * @param {Array} decorations
 * @param {{ canRevoke?: boolean, emptyClass?: string }} [options]
 */
export function renderStaffDecorationsGrid(
  decorations = [],
  { canRevoke = false, emptyClass = '' } = {},
) {
  if (!decorations.length) {
    return `<p class="text-sm text-ink-400 ${emptyClass}">Sin condecoraciones.</p>`;
  }

  return decorations
    .map((item) => {
      const decoration = item.decoration ?? item;
      const image = resolveUploadUrl(decoration?.imageUrl);
      const name = decoration?.name ?? 'Condecoración';
      const awardedAt = item.awardedAt ? formatDate(item.awardedAt) : null;

      return `
        <article class="flex h-full flex-col items-center rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-5">
          <div class="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-950 ring-1 ring-white/10">
            ${
              image
                ? `<img src="${image}" alt="${escapeHtml(name)}" class="h-full w-full object-contain p-3" />`
                : `<span class="text-xs text-ink-500">—</span>`
            }
          </div>
          <p class="mt-4 line-clamp-2 text-center text-sm font-semibold text-white">${escapeHtml(name)}</p>
          ${awardedAt ? `<p class="mt-1 text-center text-xs text-ink-500">${awardedAt}</p>` : ''}
          ${
            canRevoke && item.id
              ? `<button type="button" class="mt-3 text-xs font-medium text-rose-300 hover:text-rose-200" data-revoke-decoration="${item.id}">Quitar</button>`
              : ''
          }
        </article>
      `;
    })
    .join('');
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
