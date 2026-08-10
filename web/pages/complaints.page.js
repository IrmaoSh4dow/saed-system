import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderComplaintCard } from '../components/complaints/complaint-card.js';
import { renderEmptyState } from '../components/ui/empty-state.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { renderSummaryStrip } from '../components/ui/summary-strip.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listComplaints } from '../services/complaints.service.js';
import { can } from '../services/auth-context.js';
import { requireActiveCharacter, requireAnyPermission } from '../utils/auth-guard.js';
import { formatDateShort } from '../utils/date.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { complaintDetailPage } from './complaint-detail.page.js';

export function complaintsPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (
    !requireAnyPermission([
      PERMISSIONS.COMPLAINTS_READ,
      PERMISSIONS.COMPLAINTS_CREATE,
      PERMISSIONS.COMPLAINTS_ASSIGN,
      PERMISSIONS.COMPLAINTS_MANAGE,
    ])
  ) {
    return { html: '', afterMount: () => {} };
  }

  const detailId = new URLSearchParams(window.location.search).get('id');
  if (detailId) {
    return complaintDetailPage(detailId);
  }

  const canCreate = can(PERMISSIONS.COMPLAINTS_CREATE);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'complaints-alert' })}
      ${renderPageHeader({
        eyebrow: 'Asuntos internos',
        title: 'Quejas y casos',
        description:
          'Canal institucional para presentar quejas y dar seguimiento a investigaciones asignadas.',
        actionsHtml: canCreate
          ? `<a data-link href="/complaints/new" class="btn-primary !py-2.5">Nueva queja</a>`
          : '',
      })}

      <div id="complaints-summary">
        ${renderSummaryStrip([
          { label: 'Casos', value: '—' },
          { label: 'Activos', value: '—', tone: 'warning' },
          { label: 'Resueltos', value: '—', tone: 'brand' },
          { label: 'Sin investigador', value: '—', tone: 'danger' },
        ])}
      </div>

      <section id="complaints-feed" class="record-feed">
        <p class="text-sm text-ink-400">Cargando casos...</p>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, { title: 'Quejas', currentPath: '/complaints' }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      document.title = 'Quejas · SAED';

      void listComplaints()
        .then((items) => {
          const list = Array.isArray(items) ? items : [];
          const active = list.filter((item) =>
            ['PENDING', 'UNDER_INVESTIGATION', 'WAITING_FOR_CITIZEN'].includes(item.status),
          ).length;
          const resolved = list.filter((item) =>
            ['RESOLVED', 'CLOSED'].includes(item.status),
          ).length;
          const unassigned = list.filter((item) => !item.investigator).length;

          const summary = root.querySelector('#complaints-summary');
          if (summary) {
            summary.innerHTML = renderSummaryStrip([
              { label: 'Casos', value: String(list.length) },
              { label: 'Activos', value: String(active), tone: 'warning' },
              { label: 'Resueltos', value: String(resolved), tone: 'brand' },
              { label: 'Sin investigador', value: String(unassigned), tone: 'danger' },
            ]);
          }

          const feed = root.querySelector('#complaints-feed');
          if (!feed) return;
          feed.innerHTML = list.length
            ? list
                .map((item) =>
                  renderComplaintCard(item, {
                    dateLabel: formatDateShort(item.createdAt) || '—',
                  }),
                )
                .join('')
            : renderEmptyState({
                title: 'No hay quejas',
                description: 'Los casos nuevos aparecerán aquí con su estado e investigador.',
                iconName: 'alert',
              });
        })
        .catch((error) => {
          setAuthAlert(root, {
            id: 'complaints-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        });

      return cleanup;
    },
  };
}
