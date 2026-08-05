import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderOfficerFiche } from '../components/staff/staff-fiche.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { getOfficer } from '../services/staff.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { PERMISSIONS } from '../utils/permissions.js';

export function officerDetailPage(staffId) {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.STAFF_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'staff-detail-alert' })}
      <a data-link href="/staff" class="inline-flex text-sm font-medium text-brand-300 hover:text-brand-200">← Volver al directorio</a>
      <div id="staff-detail-root">
        <p class="text-sm text-ink-400">Cargando ficha...</p>
      </div>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Personal',
      currentPath: '/staff',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      document.title = 'Personal · SAED';

      void getOfficer(staffId)
        .then((officer) => {
          const host = root.querySelector('#staff-detail-root');
          if (!host) {
            return;
          }

          host.innerHTML = renderOfficerFiche(officer);
          const name =
            `${officer.character?.firstName ?? ''} ${officer.character?.lastName ?? ''}`.trim();
          document.title = `${name || 'Personal'} · SAED`;
        })
        .catch((error) => {
          setAuthAlert(root, {
            id: 'staff-detail-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
          const host = root.querySelector('#staff-detail-root');
          if (host) {
            host.innerHTML = `<p class="text-sm text-ink-400">No se pudo cargar la ficha del personal.</p>`;
          }
        });

      return cleanupLayout;
    },
  };
}
