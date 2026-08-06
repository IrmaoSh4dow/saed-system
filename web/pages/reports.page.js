import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderReportCard } from '../components/reports/report-card.js';
import { renderDashTabs } from '../components/ui/dash-tabs.js';
import { renderEmptyState } from '../components/ui/empty-state.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { renderSummaryStrip } from '../components/ui/summary-strip.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listReports } from '../services/reports.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { formatDateLabel, formatDateShort } from '../utils/date.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { reportDetailPage } from './report-detail.page.js';

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

  const description =
    scope === 'department'
      ? 'Casos e informes bajo la responsabilidad de tu departamento activo.'
      : scope === 'all'
        ? 'Visión global de informes clínicos e internos del SAED.'
        : 'Tu cartera operativa de informes, investigaciones y seguimiento.';

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'reports-alert' })}
      ${renderPageHeader({
        eyebrow: options.eyebrow ?? 'Operaciones clínicas',
        title,
        description,
        actionsHtml: canCreate
          ? `<a data-link href="/reports/new" class="btn-primary !py-2.5">Nuevo informe</a>`
          : '',
      })}

      <div id="reports-summary">
        ${renderSummaryStrip([
          { label: 'Total', value: '—' },
          { label: 'Abiertos', value: '—', tone: 'warning' },
          { label: 'Críticos', value: '—', tone: 'danger' },
          { label: 'Finalizados', value: '—', tone: 'brand' },
        ])}
      </div>

      ${renderDashTabs([
        { id: 'mine', href: '/reports', label: 'Mis informes', active: scope === 'mine' },
        {
          id: 'department',
          href: '/reports/department',
          label: 'Mi departamento',
          active: scope === 'department',
        },
        ...(canSeeAll
          ? [{ id: 'all', href: '/reports/all', label: 'Todos', active: scope === 'all' }]
          : []),
      ])}

      <section id="reports-feed" class="record-feed">
        <p class="text-sm text-ink-400">Cargando informes...</p>
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
          const list = Array.isArray(items) ? items : [];
          const open = list.filter((item) =>
            ['PENDING', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(item.status),
          ).length;
          const critical = list.filter((item) => item.priority === 'CRITICAL').length;
          const completed = list.filter((item) => item.status === 'COMPLETED').length;

          const summary = root.querySelector('#reports-summary');
          if (summary) {
            summary.innerHTML = renderSummaryStrip([
              { label: 'Total', value: String(list.length) },
              { label: 'Abiertos', value: String(open), tone: 'warning' },
              { label: 'Críticos', value: String(critical), tone: 'danger' },
              { label: 'Finalizados', value: String(completed), tone: 'brand' },
            ]);
          }

          const feed = root.querySelector('#reports-feed');
          if (!feed) return;
          feed.innerHTML = list.length
            ? list
                .map((item) =>
                  renderReportCard(item, {
                    dateLabel:
                      formatDateShort(item.createdAt) || formatDateLabel(item.incidentDate) || '—',
                  }),
                )
                .join('')
            : renderEmptyState({
                title: 'Sin informes en esta vista',
                description: 'Cuando se creen o te asignen informes, aparecerán aquí.',
                iconName: 'file',
              });
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
