import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listReports } from '../services/reports.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { formatDateLabel, formatDateShort } from '../utils/date.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { reportDetailPage } from './report-detail.page.js';

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  UNDER_REVIEW: 'En revisión',
  COMPLETED: 'Finalizado',
  ARCHIVED: 'Archivado',
};

const PRIORITY_LABELS = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

const TYPE_LABELS = {
  INCIDENT: 'Incidente',
  INVESTIGATION: 'Investigación',
  INTERNAL: 'Interno',
  ACTIVITY: 'Actividad',
  OTHER: 'Otro',
};

/**
 * @param {{ scope?: 'mine' | 'department' | 'all', title?: string, eyebrow?: string }} [options]
 */
export function reportsPage(options = {}) {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.REPORTS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const detailId = new URLSearchParams(window.location.search).get('id');
  if (detailId) {
    return reportDetailPage(detailId);
  }

  const scope = options.scope ?? 'mine';
  const canCreate = can(PERMISSIONS.REPORTS_CREATE);
  const canSeeAll = can(PERMISSIONS.REPORTS_TRANSFER) || can(PERMISSIONS.ADMIN_ACCESS);

  const title =
    options.title ??
    (scope === 'department'
      ? 'Informes de departamento'
      : scope === 'all'
        ? 'Todos los informes'
        : 'Informes');

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'reports-alert' })}
      <section class="surface-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div class="min-w-0">
          <p class="landing-eyebrow">${options.eyebrow ?? 'Operaciones'}</p>
          <h2 class="mt-1 text-2xl font-semibold text-white">${title}</h2>
          <p class="mt-2 text-sm text-ink-300">
            ${
              scope === 'department'
                ? 'Informes cuyo departamento responsable es el tuyo.'
                : 'Gestión de investigaciones y reportes internos del departamento.'
            }
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          ${
            canCreate
              ? `<a data-link href="/reports/new" class="btn-primary shrink-0">Nuevo informe</a>`
              : ''
          }
        </div>
      </section>

      <nav class="flex flex-wrap gap-2">
        <a data-link href="/reports" class="rounded-xl px-3.5 py-2 text-sm font-medium transition ${
          scope === 'mine'
            ? 'bg-brand-500/15 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.25)]'
            : 'border border-white/10 text-ink-300 hover:bg-white/[0.04] hover:text-white'
        }">Mis informes</a>
        <a data-link href="/reports/department" class="rounded-xl px-3.5 py-2 text-sm font-medium transition ${
          scope === 'department'
            ? 'bg-brand-500/15 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.25)]'
            : 'border border-white/10 text-ink-300 hover:bg-white/[0.04] hover:text-white'
        }">Mi departamento</a>
        ${
          canSeeAll
            ? `<a data-link href="/reports/all" class="rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                scope === 'all'
                  ? 'bg-brand-500/15 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.25)]'
                  : 'border border-white/10 text-ink-300 hover:bg-white/[0.04] hover:text-white'
              }">Todos</a>`
            : ''
        }
      </nav>

      <section class="surface-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-white/[0.02] text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th class="px-5 py-3">Nº</th>
                <th class="px-5 py-3">Título</th>
                <th class="px-5 py-3">Tipo</th>
                <th class="px-5 py-3">Encargado</th>
                <th class="px-5 py-3">Departamento</th>
                <th class="px-5 py-3">Estado</th>
                <th class="px-5 py-3">Prioridad</th>
                <th class="px-5 py-3">Fecha</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody id="reports-table-body" class="divide-y divide-white/5">
              <tr><td colspan="9" class="px-5 py-8 text-center text-ink-400">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title,
      currentPath: scope === 'department' ? '/reports/department' : '/reports',
    }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      document.title = `${title} · SAED`;

      void listReports(scope)
        .then((items) => {
          const body = root.querySelector('#reports-table-body');
          if (!body) return;
          const list = Array.isArray(items) ? items : [];
          body.innerHTML = list.length
            ? list
                .map((item) => {
                  const lead = item.leadStaff
                    ? `${item.leadStaff.character.firstName} ${item.leadStaff.character.lastName}`
                    : '—';
                  return `
                    <tr class="hover:bg-white/[0.02]">
                      <td class="px-5 py-3 font-medium text-white">#${item.reportNumber}</td>
                      <td class="px-5 py-3 text-ink-200 max-w-[14rem] truncate">${escapeHtml(item.title)}</td>
                      <td class="px-5 py-3 text-ink-300">${TYPE_LABELS[item.type] ?? item.type}</td>
                      <td class="px-5 py-3 text-ink-300">${escapeHtml(lead)}</td>
                      <td class="px-5 py-3 text-ink-300">${escapeHtml(item.department?.name ?? '—')}</td>
                      <td class="px-5 py-3 text-ink-300">${STATUS_LABELS[item.status] ?? item.status}</td>
                      <td class="px-5 py-3 text-ink-300">${PRIORITY_LABELS[item.priority] ?? item.priority}</td>
                      <td class="px-5 py-3 text-ink-400">${formatDateShort(item.createdAt) || formatDateLabel(item.incidentDate)}</td>
                      <td class="px-5 py-3 text-right">
                        <a data-link href="/reports?id=${item.id}" class="text-xs font-medium text-brand-300 hover:text-brand-200">Ver</a>
                      </td>
                    </tr>
                  `;
                })
                .join('')
            : `<tr><td colspan="9" class="px-5 py-8 text-center text-ink-400">No hay informes en esta vista.</td></tr>`;
        })
        .catch((error) => {
          setAuthAlert(root, {
            id: 'reports-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        });

      return cleanup;
    },
  };
}

export function departmentReportsPage() {
  return reportsPage({
    scope: 'department',
    title: 'Informes de departamento',
    eyebrow: 'Departamento',
  });
}

export function allReportsPage() {
  return reportsPage({
    scope: 'all',
    title: 'Todos los informes',
    eyebrow: 'Comando',
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
