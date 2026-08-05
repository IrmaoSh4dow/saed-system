import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderOfficerCard } from '../components/staff/staff-card.js';
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

      <section class="surface-card p-5 md:p-6">
        <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="landing-eyebrow">Personal</p>
            <h2 class="mt-1 text-2xl font-semibold tracking-tight text-white">Personal médico</h2>
            <p class="mt-2 max-w-2xl text-sm text-ink-300">
              Directorio del departamento. Consulta el personal activo y su ficha operativa.
            </p>
          </div>
          <p id="officers-count" class="text-sm text-ink-400">—</p>
        </div>

        <form id="officers-filters" class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div class="sm:col-span-2 xl:col-span-2">
            <label class="form-label" for="officers-search">Buscar</label>
            <input
              id="officers-search"
              name="search"
              class="form-input"
              placeholder="Nombre o badge..."
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
              <option value="badge">Badge</option>
            </select>
          </div>
        </form>
      </section>

      <section id="officers-grid" class="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <p class="text-sm text-ink-400 sm:col-span-2 xl:col-span-4">Cargando personal médico...</p>
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
      const countLabel = root.querySelector('#officers-count');

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

        if (countLabel) {
          countLabel.textContent = `${filtered.length} de ${officers.length} personal médico`;
        }

        if (!grid) {
          return;
        }

        grid.innerHTML = filtered.length
          ? filtered.map((officer) => renderOfficerCard(officer)).join('')
          : `<p class="text-sm text-ink-400 sm:col-span-2 xl:col-span-4">No hay personal médico que coincida con los filtros.</p>`;
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
            grid.innerHTML = `<p class="text-sm text-ink-400 sm:col-span-2 xl:col-span-4">No se pudo cargar el directorio.</p>`;
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
