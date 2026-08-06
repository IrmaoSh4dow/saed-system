import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderDepartmentCard } from '../components/departments/department-card.js';
import { renderEmptyState } from '../components/ui/empty-state.js';
import { renderFilterShell } from '../components/ui/filter-shell.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { renderSummaryStrip } from '../components/ui/summary-strip.js';
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
      ${renderPageHeader({
        eyebrow: 'Organización',
        title: 'Departamentos médicos',
        description: 'Unidades especializadas, supervisores y convocatorias abiertas del SAED.',
      })}

      <div id="departments-summary">
        ${renderSummaryStrip([
          { label: 'Departamentos', value: '—' },
          { label: 'Convocatorias', value: '—', tone: 'brand' },
          { label: 'Personal', value: '—' },
          { label: 'Visibles', value: '—', tone: 'warning' },
        ])}
      </div>

      ${renderFilterShell({
        bodyHtml: `
          <form id="departments-filters" class="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <label class="form-label" for="departments-search">Buscar departamento</label>
              <input id="departments-search" name="search" class="form-input" placeholder="Trauma, pediatría, UCI..." autocomplete="off" />
            </div>
            <div class="sm:w-52">
              <label class="form-label" for="departments-opening">Convocatoria</label>
              <select id="departments-opening" name="opening" class="form-input">
                <option value="">Todas</option>
                <option value="open">Solo abiertas</option>
                <option value="closed">Sin convocatoria</option>
              </select>
            </div>
          </form>
        `,
      })}

      <section id="departments-grid" class="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <p class="text-sm text-ink-400 sm:col-span-2 xl:col-span-3 2xl:col-span-4">Cargando departamentos...</p>
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

      let departments = [];
      const form = root.querySelector('#departments-filters');
      const grid = root.querySelector('#departments-grid');
      const summary = root.querySelector('#departments-summary');

      const paint = () => {
        const search = (form?.search?.value ?? '').trim().toLowerCase();
        const opening = form?.opening?.value ?? '';

        const filtered = departments.filter((item) => {
          const name = String(item.name ?? '').toLowerCase();
          const description = String(item.description ?? '').toLowerCase();
          const matchesSearch = !search || name.includes(search) || description.includes(search);
          const hasOpening = Boolean(item.openings?.length);
          const matchesOpening =
            !opening ||
            (opening === 'open' && hasOpening) ||
            (opening === 'closed' && !hasOpening);
          return matchesSearch && matchesOpening;
        });

        const openings = departments.filter((item) => item.openings?.length).length;
        const members = departments.reduce(
          (total, item) => total + (item._count?.officers ?? 0),
          0,
        );

        if (summary) {
          summary.innerHTML = renderSummaryStrip([
            { label: 'Departamentos', value: String(departments.length) },
            { label: 'Convocatorias', value: String(openings), tone: 'brand' },
            { label: 'Personal', value: String(members) },
            { label: 'Visibles', value: String(filtered.length), tone: 'warning' },
          ]);
        }

        if (!grid) return;
        grid.innerHTML = filtered.length
          ? filtered.map((item) => renderDepartmentCard(item)).join('')
          : renderEmptyState({
              title: 'Sin departamentos',
              description: 'No hay departamentos que coincidan con tu búsqueda.',
              iconName: 'building',
            }).replace('empty-state', 'empty-state sm:col-span-2 xl:col-span-3 2xl:col-span-4');
      };

      form?.addEventListener('input', paint);
      form?.addEventListener('change', paint);

      void listDepartments()
        .then((items) => {
          departments = Array.isArray(items) ? items : [];
          paint();
        })
        .catch((error) => {
          setAuthAlert(root, {
            id: 'departments-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        });

      return () => {
        form?.removeEventListener('input', paint);
        form?.removeEventListener('change', paint);
        cleanup?.();
      };
    },
  };
}
