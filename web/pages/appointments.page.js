import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderAppointmentCard } from '../components/appointments/appointment-card.js';
import { renderEmptyState } from '../components/ui/empty-state.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { renderSummaryStrip } from '../components/ui/summary-strip.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listAppointments } from '../services/appointments.service.js';
import { can } from '../services/auth-context.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { formatDateShort } from '../utils/date.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { appointmentDetailPage } from './appointment-detail.page.js';

export function appointmentsPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.APPOINTMENTS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const detailId = new URLSearchParams(window.location.search).get('id');
  if (detailId) {
    return appointmentDetailPage(detailId);
  }

  const canCreate = can(PERMISSIONS.APPOINTMENTS_CREATE);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'appointments-alert' })}
      ${renderPageHeader({
        eyebrow: 'Agenda institucional',
        title: 'Citas',
        description:
          'Solicita y da seguimiento a citas médicas y evaluaciones psicotécnicas ante el SAED.',
        actionsHtml: canCreate
          ? `<a data-link href="/appointments/new" class="btn-primary !py-2.5">Nueva cita</a>`
          : '',
      })}

      <div id="appointments-summary">
        ${renderSummaryStrip([
          { label: 'Citas', value: '—' },
          { label: 'Pendientes', value: '—', tone: 'warning' },
          { label: 'Programadas', value: '—', tone: 'brand' },
          { label: 'Completadas', value: '—' },
        ])}
      </div>

      <section id="appointments-feed" class="record-feed">
        <p class="text-sm text-ink-400">Cargando citas...</p>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, { title: 'Citas', currentPath: '/appointments' }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      document.title = 'Citas · SAED';

      void listAppointments()
        .then((items) => {
          const list = Array.isArray(items) ? items : [];
          const pending = list.filter((item) => item.status === 'PENDING').length;
          const scheduled = list.filter((item) =>
            ['SCHEDULED', 'IN_PROGRESS', 'WAITING_FOR_CITIZEN'].includes(item.status),
          ).length;
          const completed = list.filter((item) => item.status === 'COMPLETED').length;

          const summary = root.querySelector('#appointments-summary');
          if (summary) {
            summary.innerHTML = renderSummaryStrip([
              { label: 'Citas', value: String(list.length) },
              { label: 'Pendientes', value: String(pending), tone: 'warning' },
              { label: 'Programadas', value: String(scheduled), tone: 'brand' },
              { label: 'Completadas', value: String(completed) },
            ]);
          }

          const feed = root.querySelector('#appointments-feed');
          if (!feed) return;
          feed.innerHTML = list.length
            ? list
                .map((item) =>
                  renderAppointmentCard(item, {
                    dateLabel: formatDateShort(item.createdAt) || '—',
                  }),
                )
                .join('')
            : renderEmptyState({
                title: 'No hay citas',
                description: 'Las citas nuevas aparecerán aquí con su estado y personal asignado.',
                iconName: 'heartPulse',
              });
        })
        .catch((error) => {
          setAuthAlert(root, {
            id: 'appointments-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        });

      return cleanup;
    },
  };
}
