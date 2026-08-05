import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderDepartmentCard } from '../components/departments/department-card.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listDepartments } from '../services/departments.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { departmentDetailPage } from './department-detail.page.js';

export function departmentsPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.DEPARTMENTS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const detailId = new URLSearchParams(window.location.search).get('id');
  if (detailId) {
    return departmentDetailPage(detailId);
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'departments-alert' })}
      <section class="surface-card p-5 md:p-6">
        <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="landing-eyebrow">Organización</p>
            <h2 class="mt-1 text-2xl font-semibold tracking-tight text-white">Departamentos</h2>
            <p class="mt-2 max-w-2xl text-sm text-ink-300">
              Unidades especializadas del departamento, encargados y convocatorias abiertas.
            </p>
          </div>
          <p id="departments-count" class="text-sm text-ink-400">—</p>
        </div>
      </section>
      <section id="departments-grid" class="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <p class="text-sm text-ink-400 sm:col-span-2 xl:col-span-4">Cargando departmentes...</p>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Departamentos',
      currentPath: '/departments',
    }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      document.title = 'Departamentos · SAED';

      void listDepartments()
        .then((items) => {
          const list = Array.isArray(items) ? items : [];
          const grid = root.querySelector('#departments-grid');
          const count = root.querySelector('#departments-count');
          if (count) {
            count.textContent = `${list.length} departmentes`;
          }
          if (grid) {
            grid.innerHTML = list.length
              ? list.map((item) => renderDepartmentCard(item)).join('')
              : `<p class="text-sm text-ink-400 sm:col-span-2 xl:col-span-4">No hay departmentes activas.</p>`;
          }
        })
        .catch((error) => {
          setAuthAlert(root, {
            id: 'departments-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        });

      return cleanup;
    },
  };
}
