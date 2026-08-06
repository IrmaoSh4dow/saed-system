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
      class="department-card panel panel-hover group relative flex h-[23rem] flex-col overflow-hidden"
    >
      <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent opacity-0 transition group-hover:opacity-100"></div>
      <div class="relative flex h-36 w-full shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-600/10 to-surface-950">
        ${
          image
            ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(department.name)}" class="h-full w-full object-contain p-5 transition duration-500 group-hover:scale-[1.04]" />`
            : `<div class="text-sm font-medium uppercase tracking-wide text-ink-500">Sin logo</div>`
        }
        ${
          hasOpening
            ? `<span class="absolute right-3 top-3 rounded-full border border-brand-400/25 bg-brand-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-300">Convocatoria</span>`
            : ''
        }
      </div>
      <div class="flex min-h-0 flex-1 flex-col p-5">
        <h3 class="truncate text-lg font-semibold text-white">${escapeHtml(department.name)}</h3>
        <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-300">${escapeHtml(description)}</p>
        <div class="mt-auto grid grid-cols-2 gap-2 pt-5">
          <div class="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
            <p class="text-[10px] uppercase tracking-[0.14em] text-ink-500">Miembros</p>
            <p class="mt-1 text-sm font-semibold text-white">${members}</p>
          </div>
          <div class="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
            <p class="text-[10px] uppercase tracking-[0.14em] text-ink-500">Encargados</p>
            <p class="mt-1 text-sm font-semibold text-white">${supervisors}</p>
          </div>
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
