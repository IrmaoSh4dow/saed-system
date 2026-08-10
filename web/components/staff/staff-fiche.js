import { icon } from '../landing/icons.js';
import { resolveUploadUrl } from '../../utils/media.js';
import { formatStaffRankLabel } from '../../utils/staff-rank.js';
import { renderStaffDecorationsGrid } from './staff-decorations-grid.js';
import { renderStaffLicensesGrid } from './staff-licenses-grid.js';
import { renderStaffDepartmentPanel } from './staff-department-panel.js';
import { renderStaffDepartmentsSection } from './staff-departments-section.js';
import {
  getDepartmentRoleLabel,
  resolveStaffDepartments,
} from '../../utils/staff-departments.js';

const OFFICER_STATUS_LABELS = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  SUSPENDED: 'Suspendido',
  RETIRED: 'Retirado',
};

/**
 * Read-only officer fiche used by the public directory detail view.
 * Accepts either API StaffProfile shape or a normalized view model.
 */
export function renderOfficerFiche(officer) {
  const character = officer.character ?? {};
  const firstName = character.firstName ?? officer.firstName ?? '';
  const lastName = character.lastName ?? officer.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  const avatarUrl = resolveUploadUrl(character.avatarUrl ?? officer.avatarUrl);
  const rankName = formatStaffRankLabel(officer.rank ?? officer.rankLabel);
  const { primary, alternates, primaryName, primaryImageUrl, primaryRole } =
    resolveStaffDepartments(officer);
  const status = officer.status ?? 'ACTIVE';
  const statusLabel = OFFICER_STATUS_LABELS[status] ?? status;
  const decorations = officer.decorations ?? [];
  const licenses = officer.licenses ?? [];

  return `
    <div class="space-y-6">
      <section class="panel overflow-hidden p-6 md:p-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div class="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-brand-500/30 bg-brand-500/10 text-xl font-semibold text-brand-200">
            ${
              avatarUrl
                ? `<img
                    src="${escapeHtml(avatarUrl)}"
                    alt=""
                    class="h-full w-full object-cover"
                    data-avatar-fallback="${escapeHtml(initials)}"
                    onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'flex h-full w-full items-center justify-center',textContent:this.dataset.avatarFallback||''}));"
                  />`
                : `<div class="flex h-full w-full items-center justify-center">${escapeHtml(initials)}</div>`
            }
          </div>

          <div class="min-w-0 flex-1">
            <p class="landing-eyebrow">Directorio</p>
            <h2 class="mt-1 text-2xl font-semibold tracking-tight text-white">${escapeHtml(fullName)}</h2>
            <p class="mt-2 text-sm text-brand-300">${escapeHtml(rankName)} · Badge ${escapeHtml(officer.employeeNumber ?? '—')}</p>
            <p class="mt-2 text-sm text-ink-300">${statusLabel}</p>
          </div>

          ${renderStaffDepartmentPanel({
            name: primaryName,
            imageUrl: primaryImageUrl,
            role: primaryRole,
          })}
        </div>
      </section>

      <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        ${statCard('Estado', statusLabel, 'check')}
        ${statCard('Rango', rankName, 'shield')}
        ${statCard('Nº empleado', officer.employeeNumber ?? '—', 'file')}
        ${statCard('Departamento principal', primaryName ?? 'Sin asignar', 'users')}
      </section>

      ${renderStaffDepartmentsSection(officer, { showBadge: false })}

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="panel p-6">
          <h3 class="text-sm font-semibold text-white">Datos del personal</h3>
          <dl class="mt-4 space-y-3 text-sm">
            ${detailRow('Nombre', firstName)}
            ${detailRow('Apellido', lastName)}
            ${detailRow('Nº empleado', officer.employeeNumber ?? '—')}
            ${detailRow('Rango', rankName)}
            ${detailRow('Departamento principal', primaryName ?? 'Sin asignar')}
            ${detailRow(
              'Departamentos alternos',
              alternates.length
                ? alternates
                    .map((item) => `${item.name} (${getDepartmentRoleLabel(item.role)})`)
                    .join(', ')
                : 'Ninguna',
            )}
            ${detailRow('Indicativo', officer.callsign ?? '—')}
            ${detailRow('Estado', statusLabel)}
            ${detailRow('Ingreso', formatDate(officer.joinedAt))}
          </dl>
        </article>

        <article class="panel p-6">
          <h3 class="text-sm font-semibold text-white">Servicio SAED</h3>
          <p class="mt-1 text-xs text-ink-400">Información operativa del perfil SAED.</p>
          <dl class="mt-5 space-y-3 text-sm">
            ${detailRow('Organización', 'SAED')}
            ${detailRow('Rango', rankName)}
            ${detailRow(
              'Departamento principal',
              primary
                ? `${primaryName} · ${getDepartmentRoleLabel(primaryRole)}`
                : 'Sin asignar',
            )}
            ${detailRow('Indicativo', officer.callsign ?? '—')}
            ${detailRow('Estado del personal', statusLabel)}
          </dl>
        </article>
      </section>

      <section class="panel p-6">
        <h3 class="text-sm font-semibold text-white">Condecoraciones</h3>
        <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          ${renderStaffDecorationsGrid(decorations, { emptyClass: 'sm:col-span-2 lg:col-span-3 xl:col-span-4' })}
        </div>
      </section>

      <section class="panel p-6">
        <h3 class="text-sm font-semibold text-white">Licencias</h3>
        <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          ${renderStaffLicensesGrid(licenses, { emptyClass: 'sm:col-span-2 lg:col-span-3 xl:col-span-4' })}
        </div>
      </section>
    </div>
  `;
}

function statCard(label, value, iconName) {
  return `
    <article class="panel p-5">
      <div class="flex items-center gap-3">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-ink-300">
          ${icon(iconName, 'h-4 w-4')}
        </span>
        <div class="min-w-0">
          <p class="text-[11px] uppercase tracking-[0.16em] text-ink-500">${label}</p>
          <p class="mt-0.5 truncate text-sm font-semibold text-white">${escapeHtml(value)}</p>
        </div>
      </div>
    </article>
  `;
}

function detailRow(label, value) {
  return `
    <div class="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <dt class="text-ink-400">${label}</dt>
      <dd class="text-right font-medium text-white">${escapeHtml(value)}</dd>
    </div>
  `;
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

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
