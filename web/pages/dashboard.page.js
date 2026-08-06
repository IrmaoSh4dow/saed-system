import { getVisibleNavigation } from '../config/navigation.js';
import { icon } from '../components/landing/icons.js';
import { renderEmptyState } from '../components/ui/empty-state.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { renderStatTile } from '../components/ui/stat-tile.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getAuthState } from '../services/auth-context.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { isSaedMember } from '../utils/character.js';
import { resolveUploadUrl } from '../utils/media.js';
import { PERMISSIONS } from '../utils/permissions.js';

export function dashboardPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.DASHBOARD_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const { user, activeCharacter, characters, permissions } = getAuthState();
  const isSaed = isSaedMember(activeCharacter);
  const statusLabel = formatStatus(activeCharacter.status);
  const avatar = resolveUploadUrl(activeCharacter.avatarUrl);
  const initials =
    `${activeCharacter.firstName?.[0] ?? ''}${activeCharacter.lastName?.[0] ?? ''}`.toUpperCase();
  const visibleModules = getVisibleNavigation(permissions, activeCharacter).filter(
    (item) => item.path !== '/dashboard',
  );
  const employeeNumber = activeCharacter.staffProfile?.employeeNumber ?? null;
  const department =
    activeCharacter.department ?? activeCharacter.staffProfile?.department?.name ?? null;
  const organization = isSaed
    ? 'SAED'
    : activeCharacter.organization ??
      activeCharacter.primaryOccupation?.organization ??
      'Civil';

  const content = `
    <div class="space-y-6">
      ${renderPageHeader({
        eyebrow: isSaed ? 'Centro de operaciones' : 'Portal ciudadano',
        title: `Bienvenido, ${activeCharacter.firstName}`,
        description: isSaed
          ? 'Tu identidad activa define permisos, módulos y contexto institucional del SAED.'
          : 'Accede a citas, quejas y servicios disponibles para tu personaje civil.',
        actionsHtml: `
          <a data-link href="/profile" class="btn-secondary !py-2.5">Ver perfil</a>
          <a data-link href="/characters/select" class="btn-primary !py-2.5">Cambiar identidad</a>
        `,
      })}

      <section class="panel relative overflow-hidden">
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(217,30,30,0.14),_transparent_45%)]"></div>
        <div class="relative grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
          <div class="flex items-start gap-5">
            <div class="h-24 w-20 shrink-0 overflow-hidden rounded-2xl border border-brand-400/25 bg-surface-950 shadow-[0_20px_50px_rgba(217,30,30,0.15)] sm:h-28 sm:w-24">
              ${
                avatar
                  ? `<img src="${avatar}" alt="" class="h-full w-full object-cover" />`
                  : `<div class="flex h-full items-center justify-center bg-gradient-to-br from-brand-600/30 to-surface-900 text-2xl font-semibold text-white">${initials}</div>`
              }
            </div>
            <div class="min-w-0">
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-400">Identidad activa</p>
              <h3 class="mt-2 truncate text-2xl font-semibold text-white sm:text-3xl">
                ${activeCharacter.firstName} ${activeCharacter.lastName}
              </h3>
              <p class="mt-2 text-sm text-ink-300">
                ${
                  isSaed
                    ? `${activeCharacter.rank ?? statusLabel}${department ? ` · ${department}` : ''}`
                    : `${statusLabel} · ${organization}`
                }
              </p>
              <div class="mt-4 flex flex-wrap gap-2">
                <span class="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-ink-200">${statusLabel}</span>
                ${
                  isSaed && employeeNumber
                    ? `<span class="rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1 text-xs text-brand-300">Nº ${employeeNumber}</span>`
                    : `<span class="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-ink-200">Ciudadano</span>`
                }
                <span class="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-ink-200">@${user?.username ?? '—'}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            ${miniMetric('Personajes', String(characters.length))}
            ${miniMetric('Módulos', String(visibleModules.length))}
            ${
              isSaed
                ? miniMetric('Rango', activeCharacter.rank ?? statusLabel)
                : miniMetric('Perfil', 'Civil')
            }
            ${miniMetric('Organización', organization)}
          </div>
        </div>
      </section>

      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${renderStatTile({ label: 'Estado', value: statusLabel, iconName: 'heartPulse' })}
        ${
          isSaed
            ? renderStatTile({
                label: 'Departamento',
                value: department ?? 'Sin asignar',
                iconName: 'building',
              })
            : renderStatTile({
                label: 'Acceso',
                value: 'Portal civil',
                iconName: 'building',
              })
        }
        ${
          isSaed
            ? renderStatTile({
                label: 'Nº empleado',
                value: employeeNumber ?? '—',
                iconName: 'file',
                tone: 'brand',
              })
            : renderStatTile({
                label: 'Servicios',
                value: String(visibleModules.length),
                hint: 'Módulos disponibles para tu personaje',
                iconName: 'grid',
                tone: 'brand',
              })
        }
        ${renderStatTile({ label: 'Identidades', value: String(characters.length), hint: 'Máximo 2 por cuenta', iconName: 'users' })}
      </section>

      <section class="panel p-6 md:p-8">
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-white">Accesos rápidos</h3>
            <p class="mt-1 text-sm text-ink-400">Disponibles según los permisos de tu personaje activo.</p>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          ${
            visibleModules.length
              ? visibleModules
                  .map(
                    (item) => `
                      <a data-link href="${item.path}" class="module-tile">
                        <span class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-surface-950 text-ink-300 transition group-hover:border-brand-400/30 group-hover:text-brand-300">
                          ${item.iconHtml}
                        </span>
                        <span class="min-w-0">
                          <span class="block truncate text-sm font-semibold text-white">${item.name}</span>
                          <span class="block truncate text-[11px] text-ink-500">Abrir módulo</span>
                        </span>
                        <span class="ml-auto text-ink-600 transition group-hover:text-brand-300">${icon('arrowRight', 'h-4 w-4')}</span>
                      </a>
                    `,
                  )
                  .join('')
              : renderEmptyState({
                  title: 'Sin módulos disponibles',
                  description: 'Este personaje no tiene permisos para módulos internos.',
                  iconName: 'lock',
                })
          }
        </div>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, { title: 'Dashboard', currentPath: '/dashboard' }),
    afterMount(root) {
      document.title = 'Dashboard · SAED';
      return initDashboardLayout(root);
    },
  };
}

function miniMetric(label, value) {
  return `
    <div class="rounded-2xl border border-white/8 bg-surface-950/50 px-3 py-3">
      <p class="text-[10px] uppercase tracking-[0.16em] text-ink-500">${label}</p>
      <p class="mt-1 truncate text-sm font-semibold text-white">${value}</p>
    </div>
  `;
}

function formatStatus(status) {
  return (
    {
      CIVIL: 'Civil',
      CADET: 'Interno',
      INTERN: 'Interno',
      OFFICER: 'Personal médico',
      MEDICAL_STAFF: 'Personal médico',
      RETIRED: 'Retirado',
      SUSPENDED: 'Suspendido',
    }[status] ?? status
  );
}
