import { resolveUploadUrl } from '../../utils/media.js';

/**
 * @param {Array} licenses
 * @param {{ canRevoke?: boolean, emptyClass?: string }} [options]
 */
export function renderStaffLicensesGrid(
  licenses = [],
  { canRevoke = false, emptyClass = '' } = {},
) {
  if (!licenses.length) {
    return `<p class="text-sm text-ink-400 ${emptyClass}">Sin licencias.</p>`;
  }

  return licenses
    .map((item) => {
      const license = item.license ?? item;
      const image = resolveUploadUrl(license?.imageUrl);
      const code = license?.code ?? '';
      const name = license?.name ?? 'Licencia';
      const assignedAt = item.assignedAt ? formatDate(item.assignedAt) : null;

      return `
        <article class="flex h-full flex-col items-center rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-5">
          <div class="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-950 ring-1 ring-white/10">
            ${
              image
                ? `<img src="${image}" alt="${escapeHtml(name)}" class="h-full w-full object-contain p-3" />`
                : `<span class="text-sm font-semibold tracking-wide text-brand-300">${escapeHtml(code || '—')}</span>`
            }
          </div>
          ${code ? `<p class="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300">${escapeHtml(code)}</p>` : ''}
          <p class="mt-1 line-clamp-2 text-center text-sm font-semibold text-white">${escapeHtml(name)}</p>
          ${assignedAt ? `<p class="mt-1 text-center text-xs text-ink-500">${assignedAt}</p>` : ''}
          ${
            canRevoke && item.id
              ? `<button type="button" class="mt-3 text-xs font-medium text-rose-300 hover:text-rose-200" data-revoke-license="${item.id}">Quitar</button>`
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
