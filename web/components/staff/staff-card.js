import { resolveUploadUrl } from '../../utils/media.js';
import { resolveStaffDepartments } from '../../utils/staff-departments.js';

const STATUS_LABELS = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  SUSPENDED: 'Suspendido',
  RETIRED: 'Retirado',
};

const STATUS_STYLES = {
  ACTIVE: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  INACTIVE: 'border-ink-400/20 bg-white/5 text-ink-300',
  SUSPENDED: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  RETIRED: 'border-ink-400/20 bg-white/5 text-ink-400',
};

/**
 * Directory card for the public officers module.
 * Shows primary department only.
 * @param {object} officer - StaffProfile from GET /staff
 */
export function renderOfficerCard(officer) {
  const firstName = officer.character?.firstName ?? '';
  const lastName = officer.character?.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Personal';
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'MD';
  const avatarUrl = resolveUploadUrl(officer.character?.avatarUrl);
  const rankName = officer.rank?.name ?? '—';
  const { primaryName } = resolveStaffDepartments(officer);
  const departmentName = primaryName ?? 'Sin departamento';
  const status = officer.status ?? 'ACTIVE';
  const statusLabel = STATUS_LABELS[status] ?? status;
  const statusClass = STATUS_STYLES[status] ?? STATUS_STYLES.INACTIVE;

  return `
    <a
      data-link
      href="/staff?id=${officer.id}"
      class="staff-card surface-card surface-card-hover group flex h-[22rem] flex-col overflow-hidden transition duration-200"
    >
      <div class="relative h-40 w-full shrink-0 overflow-hidden bg-surface-950">
        ${
          avatarUrl
            ? `<img
                src="${escapeHtml(avatarUrl)}"
                alt="${escapeHtml(fullName)}"
                class="h-full w-full object-cover object-center transition duration-200 group-hover:scale-[1.02]"
                data-avatar-fallback="${escapeHtml(initials)}"
                onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-600/25 to-surface-900 text-3xl font-semibold text-white',textContent:this.dataset.avatarFallback||'OF'}));"
              />`
            : `<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-600/25 to-surface-900 text-3xl font-semibold text-white">${escapeHtml(initials)}</div>`
        }
        <span class="absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClass}">
          ${statusLabel}
        </span>
      </div>
      <div class="flex min-h-0 flex-1 flex-col p-4">
        <h3 class="truncate text-base font-semibold text-white">${escapeHtml(fullName)}</h3>
        <p class="mt-1.5 text-sm text-ink-400">Badge ${escapeHtml(officer.employeeNumber ?? '—')}</p>
        <p class="mt-2 truncate text-sm font-medium text-brand-300">${escapeHtml(rankName)}</p>
        <p class="mt-1 truncate text-sm text-ink-300">${escapeHtml(departmentName)}</p>
        <p class="mt-auto pt-3 text-xs font-medium uppercase tracking-wide text-ink-500">${statusLabel}</p>
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
