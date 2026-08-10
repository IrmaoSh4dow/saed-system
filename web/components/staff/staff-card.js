import { resolveUploadUrl } from '../../utils/media.js';
import { formatStaffRankLabel } from '../../utils/staff-rank.js';
import { resolveStaffDepartments } from '../../utils/staff-departments.js';

const STATUS_LABELS = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  SUSPENDED: 'Suspendido',
  RETIRED: 'Retirado',
};

const STATUS_STYLES = {
  ACTIVE: 'border-brand-400/25 bg-brand-500/10 text-brand-300',
  INACTIVE: 'border-white/10 bg-white/5 text-ink-300',
  SUSPENDED: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  RETIRED: 'border-white/10 bg-white/5 text-ink-400',
};

/**
 * Directory card for the public officers module.
 * @param {object} officer - StaffProfile from GET /staff
 */
export function renderOfficerCard(officer) {
  const firstName = officer.character?.firstName ?? '';
  const lastName = officer.character?.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Personal';
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'MD';
  const avatarUrl = resolveUploadUrl(officer.character?.avatarUrl);
  const rankName = formatStaffRankLabel(officer.rank);
  const { primaryName } = resolveStaffDepartments(officer);
  const departmentName = primaryName ?? 'Sin departamento';
  const status = officer.status ?? 'ACTIVE';
  const statusLabel = STATUS_LABELS[status] ?? status;
  const statusClass = STATUS_STYLES[status] ?? STATUS_STYLES.INACTIVE;

  return `
    <a
      data-link
      href="/staff?id=${officer.id}"
      class="staff-card panel panel-hover group relative flex h-[23rem] flex-col overflow-hidden"
    >
      <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent opacity-0 transition group-hover:opacity-100"></div>
      <div class="relative h-[11.5rem] w-full shrink-0 overflow-hidden bg-surface-950">
        ${
          avatarUrl
            ? `<img
                src="${escapeHtml(avatarUrl)}"
                alt="${escapeHtml(fullName)}"
                class="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.04]"
                data-avatar-fallback="${escapeHtml(initials)}"
                onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-600/30 to-surface-900 text-3xl font-semibold text-white',textContent:this.dataset.avatarFallback||'MD'}));"
              />`
            : `<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-600/30 to-surface-900 text-3xl font-semibold text-white">${escapeHtml(initials)}</div>`
        }
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-950 via-transparent to-transparent"></div>
        <span class="absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClass}">
          ${statusLabel}
        </span>
      </div>
      <div class="flex min-h-0 flex-1 flex-col p-5">
        <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Nº ${escapeHtml(officer.employeeNumber ?? '—')}</p>
        <h3 class="mt-2 truncate text-lg font-semibold text-white">${escapeHtml(fullName)}</h3>
        <p class="mt-2 truncate text-sm font-medium text-brand-300">${escapeHtml(rankName)}</p>
        <p class="mt-1 truncate text-sm text-ink-300">${escapeHtml(departmentName)}</p>
        <p class="mt-auto pt-4 text-xs font-medium text-brand-300/80 transition group-hover:text-brand-300">Ver ficha →</p>
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
