import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderOfficerCard } from '../components/staff/staff-card.js';
import { renderEmptyState } from '../components/ui/empty-state.js';
import { renderFilterShell } from '../components/ui/filter-shell.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { renderSummaryStrip } from '../components/ui/summary-strip.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listOfficers } from '../services/staff.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { officerDetailPage } from './staff-detail.page.js';

export function officersPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.STAFF_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const detailId = new URLSearchParams(window.location.search).get('id');
  if (detailId) {
    return officerDetailPage(detailId);
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'officers-alert' })}
      ${renderPageHeader({
        eyebrow: 'Institución',
        title: 'Personal médico',
        description: 'Directorio operativo del SAED. Explora fichas, rangos y departamentos.',
      })}

      <div id="officers-summary">
        ${renderSummaryStrip([
          { label: 'Personal', value: '—' },
          { label: 'Activos', value: '—', tone: 'brand' },
          { label: 'Departamentos', value: '—' },
          { label: 'Visibles', value: '—', tone: 'warning' },
        ])}
      </div>

      ${renderFilterShell({
        bodyHtml: `
          <form id="officers-filters" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div class="sm:col-span-2 xl:col-span-2">
              <label class="form-label" for="officers-search">Buscar</label>
              <input
                id="officers-search"
                name="search"
                class="form-input"
                placeholder="Nombre o nº de empleado..."
                autocomplete="off"
              />
            </div>
            <div>
              <label class="form-label" for="officers-department">Departamento</label>
              <select id="officers-department" name="department" class="form-input">
                <option value="">Todas</option>
              </select>
            </div>
            <div>
              <label class="form-label" for="officers-rank">Rango</label>
              <select id="officers-rank" name="rank" class="form-input">
                <option value="">Todos</option>
              </select>
            </div>
            <div>
              <label class="form-label" for="officers-status">Estado</label>
              <select id="officers-status" name="status" class="form-input">
                <option value="">Todos</option>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="SUSPENDED">Suspendido</option>
                <option value="RETIRED">Retirado</option>
              </select>
            </div>
            <div>
              <label class="form-label" for="officers-sort">Ordenar</label>
              <select id="officers-sort" name="sort" class="form-input">
                <option value="name">Nombre</option>
                <option value="rank">Rango</option>
                <option value="badge">Nº empleado</option>
              </select>
            </div>
          </form>
        `,
      })}

      <section id="officers-grid" class="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <p class="text-sm text-ink-400 sm:col-span-2 xl:col-span-3 2xl:col-span-4">Cargando personal médico...</p>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Personal médico',
      currentPath: '/staff',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      document.title = 'Personal médico · SAED';

      let officers = [];

      const form = root.querySelector('#officers-filters');
      const grid = root.querySelector('#officers-grid');
      const summary = root.querySelector('#officers-summary');

      const applyFilters = () => {
        const search = (form?.search?.value ?? '').trim().toLowerCase();
        const departmentId = form?.department?.value ?? '';
        const rankId = form?.rank?.value ?? '';
        const status = form?.status?.value ?? '';
        const sort = form?.sort?.value ?? 'name';

        let filtered = officers.filter((officer) => {
          const fullName =
            `${officer.character?.firstName ?? ''} ${officer.character?.lastName ?? ''}`.toLowerCase();
          const badge = String(officer.employeeNumber ?? '').toLowerCase();
          const matchesSearch = !search || fullName.includes(search) || badge.includes(search);
          const membershipIds = (officer.departmentMemberships ?? [])
            .filter((row) => row.isActive !== false)
            .map((row) => row.departmentId);
          const matchesDepartment =
            !departmentId ||
            officer.departmentId === departmentId ||
            membershipIds.includes(departmentId);
          const matchesRank = !rankId || officer.rankId === rankId;
          const matchesStatus = !status || officer.status === status;
          return matchesSearch && matchesDepartment && matchesRank && matchesStatus;
        });

        filtered = [...filtered].sort((a, b) => {
          if (sort === 'badge') {
            return String(a.employeeNumber ?? '').localeCompare(String(b.employeeNumber ?? ''), 'es', {
              numeric: true,
            });
          }

          if (sort === 'rank') {
            const orderA = a.rank?.sortOrder ?? 0;
            const orderB = b.rank?.sortOrder ?? 0;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return String(a.rank?.name ?? '').localeCompare(String(b.rank?.name ?? ''), 'es');
          }

          const nameA = `${a.character?.lastName ?? ''} ${a.character?.firstName ?? ''}`;
          const nameB = `${b.character?.lastName ?? ''} ${b.character?.firstName ?? ''}`;
          return nameA.localeCompare(nameB, 'es');
        });

        const activeCount = officers.filter((item) => item.status === 'ACTIVE').length;
        const departmentCount = uniqueBy(
          officers.flatMap((item) => {
            const fromMemberships = (item.departmentMemberships ?? [])
              .filter((row) => row.isActive !== false && row.department)
              .map((row) => ({ id: row.departmentId }));
            if (fromMemberships.length) return fromMemberships;
            if (item.departmentId) return [{ id: item.departmentId }];
            return [];
          }),
          'id',
        ).length;

        if (summary) {
          summary.innerHTML = renderSummaryStrip([
            { label: 'Personal', value: String(officers.length) },
            { label: 'Activos', value: String(activeCount), tone: 'brand' },
            { label: 'Departamentos', value: String(departmentCount) },
            { label: 'Visibles', value: String(filtered.length), tone: 'warning' },
          ]);
        }

        if (!grid) {
          return;
        }

        grid.innerHTML = filtered.length
          ? filtered.map((officer) => renderOfficerCard(officer)).join('')
          : renderEmptyState({
              title: 'Sin coincidencias',
              description: 'Ajusta los filtros para encontrar al personal médico.',
              iconName: 'users',
            }).replace('empty-state', 'empty-state sm:col-span-2 xl:col-span-3 2xl:col-span-4');
      };

      const fillFilterOptions = (items) => {
        const departmentSelect = root.querySelector('#officers-department');
        const rankSelect = root.querySelector('#officers-rank');

        const departments = uniqueBy(
          items.flatMap((item) => {
            const fromMemberships = (item.departmentMemberships ?? [])
              .filter((row) => row.isActive !== false && row.department)
              .map((row) => ({
                id: row.departmentId,
                name: row.department.name,
              }));
            if (fromMemberships.length) {
              return fromMemberships;
            }
            if (item.department) {
              return [{ id: item.departmentId, name: item.department.name }];
            }
            return [];
          }),
          'id',
        ).sort((a, b) => a.name.localeCompare(b.name, 'es'));

        const ranks = uniqueBy(
          items
            .filter((item) => item.rank)
            .map((item) => ({
              id: item.rankId,
              name: item.rank.name,
              sortOrder: item.rank.sortOrder ?? 0,
            })),
          'id',
        ).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'));

        if (departmentSelect) {
          departmentSelect.innerHTML =
            `<option value="">Todas</option>` +
            departments
              .map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
              .join('');
        }

        if (rankSelect) {
          rankSelect.innerHTML =
            `<option value="">Todos</option>` +
            ranks
              .map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
              .join('');
        }
      };

      const onFilterChange = () => applyFilters();

      form?.addEventListener('input', onFilterChange);
      form?.addEventListener('change', onFilterChange);

      void listOfficers()
        .then((items) => {
          officers = Array.isArray(items) ? items : [];
          fillFilterOptions(officers);
          applyFilters();
        })
        .catch((error) => {
          setAuthAlert(root, {
            id: 'officers-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
          if (grid) {
            grid.innerHTML = renderEmptyState({
              title: 'No se pudo cargar el directorio',
              description: 'Inténtalo de nuevo en unos momentos.',
              iconName: 'users',
            }).replace('empty-state', 'empty-state sm:col-span-2 xl:col-span-3 2xl:col-span-4');
          }
        });

      return () => {
        form?.removeEventListener('input', onFilterChange);
        form?.removeEventListener('change', onFilterChange);
        cleanupLayout?.();
      };
    },
  };
}

function uniqueBy(items, key) {
  const map = new Map();
  for (const item of items) {
    if (item[key] && !map.has(item[key])) {
      map.set(item[key], item);
    }
  }
  return [...map.values()];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
