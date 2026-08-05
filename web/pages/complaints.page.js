import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listComplaints } from '../services/complaints.service.js';
import { can } from '../services/auth-context.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { formatDateShort } from '../utils/date.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { complaintDetailPage } from './complaint-detail.page.js';

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  UNDER_INVESTIGATION: 'En investigación',
  WAITING_FOR_CITIZEN: 'Esperando ciudadano',
  RESOLVED: 'Resuelta',
  REJECTED: 'Rechazada',
  CLOSED: 'Cerrada',
};

export function complaintsPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.COMPLAINTS_READ)) {
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
      <section class="surface-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div class="min-w-0">
          <p class="landing-eyebrow">Denuncias</p>
          <h2 class="mt-1 text-2xl font-semibold text-white">Mis denuncias / casos</h2>
          <p class="mt-2 text-sm text-ink-300">Presenta denuncias contra personal SAED o gestiona investigaciones asignadas.</p>
        </div>
        ${
          canCreate
            ? `<a data-link href="/complaints/new" class="btn-primary shrink-0">Nueva denuncia</a>`
            : ''
        }
      </section>

      <section class="surface-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-white/[0.02] text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th class="px-5 py-3">Caso</th>
                <th class="px-5 py-3">Título</th>
                <th class="px-5 py-3">Personal</th>
                <th class="px-5 py-3">Investigador</th>
                <th class="px-5 py-3">Estado</th>
                <th class="px-5 py-3">Fecha</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody id="complaints-table-body" class="divide-y divide-white/5"></tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, { title: 'Denuncias', currentPath: '/complaints' }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      document.title = 'Denuncias · SAED';

      void listComplaints()
        .then((items) => {
          const body = root.querySelector('#complaints-table-body');
          body.innerHTML = items.length
            ? items
                .map((item) => {
                  const officer = item.accusedStaff;
                  const officerName = officer
                    ? `${officer.character.firstName} ${officer.character.lastName}`
                    : '—';
                  const investigator = item.investigator
                    ? `${item.investigator.firstName} ${item.investigator.lastName}`
                    : 'Sin asignar';
                  return `
                    <tr class="hover:bg-white/[0.02]">
                      <td class="px-5 py-3 font-medium text-white whitespace-nowrap">#${item.caseNumber}</td>
                      <td class="px-5 py-3 text-ink-200 max-w-[14rem] truncate">${item.title}</td>
                      <td class="px-5 py-3 text-ink-300 whitespace-nowrap">${officerName}${officer ? ` · ${officer.employeeNumber}` : ''}</td>
                      <td class="px-5 py-3 text-ink-300 whitespace-nowrap">${investigator}</td>
                      <td class="px-5 py-3 text-ink-300 whitespace-nowrap">${STATUS_LABELS[item.status] ?? item.status}</td>
                      <td class="px-5 py-3 text-ink-400 whitespace-nowrap">${formatDateShort(item.createdAt)}</td>
                      <td class="px-5 py-3 text-right">
                        <a data-link href="/complaints?id=${item.id}" class="text-xs font-medium text-brand-300 hover:text-brand-200">Abrir</a>
                      </td>
                    </tr>
                  `;
                })
                .join('')
            : `<tr><td colspan="7" class="px-5 py-8 text-center text-ink-400">No hay denuncias.</td></tr>`;
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
