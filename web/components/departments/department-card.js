import { resolveUploadUrl } from '../../utils/media.js';

/**
 * @param {object} department
 */
export function renderDepartmentCard(department) {
  const image = resolveUploadUrl(department.imageUrl);
  const members = department._count?.officers ?? 0;
  const supervisors = department._count?.supervisors ?? 0;
  const description = department.description?.trim() || 'Sin descripción.';
  const hasOpening = Boolean(department.openings?.length);

  return `
    <a
      data-link
      href="/departments?id=${department.id}"
      class="department-card surface-card surface-card-hover group flex h-[22rem] flex-col overflow-hidden transition duration-200"
    >
      <div class="relative flex h-36 w-full shrink-0 items-center justify-center overflow-hidden bg-surface-950">
        ${
          image
            ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(department.name)}" class="h-full w-full object-contain p-5 transition duration-200 group-hover:scale-[1.02]" />`
            : `<div class="text-sm font-medium uppercase tracking-wide text-ink-500">Sin logo</div>`
        }
        ${
          hasOpening
            ? `<span class="absolute right-3 top-3 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">Convocatoria</span>`
            : ''
        }
      </div>
      <div class="flex min-h-0 flex-1 flex-col p-5">
        <h3 class="truncate text-lg font-semibold text-white">${escapeHtml(department.name)}</h3>
        <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-300">${escapeHtml(description)}</p>
        <div class="mt-auto space-y-1 pt-4 text-sm text-ink-400">
          <p>${members} miembro${members === 1 ? '' : 's'}</p>
          <p>${supervisors} encargado${supervisors === 1 ? '' : 's'}</p>
        </div>
      </div>
    </a>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
