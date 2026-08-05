import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import {
  createOfficer,
  listOfficers,
  retireOfficer,
  searchOfficerCandidates,
  updateOfficer,
} from '../../services/staff.service.js';
import { listDepartments } from '../../services/departments.service.js';
import { listRanks } from '../../services/ranks.service.js';
import { can } from '../../services/auth-context.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';
import { adminOfficerDetailPage } from './admin-staff-detail.page.js';

export function adminOfficersPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  const detailId = new URLSearchParams(window.location.search).get('id');
  if (detailId) {
    return adminOfficerDetailPage(detailId);
  }

  const canCreate = can(PERMISSIONS.STAFF_CREATE);
  const canDelete = can(PERMISSIONS.STAFF_DELETE);
  const canUpdate = can(PERMISSIONS.STAFF_UPDATE);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-staff-alert' })}

      ${
        canCreate
          ? `
        <section class="surface-card p-6">
          <h3 class="text-sm font-semibold text-white">Incorporar a personal médico</h3>
          <p class="mt-1 text-xs text-ink-400">Preferible desde <a data-link href="/admin/characters" class="text-brand-300 hover:text-brand-200">Personajes</a>. Organización pasa a SAED automáticamente.</p>
          <div class="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input id="candidate-query" class="form-input" placeholder="Buscar por nombre o apellido..." />
            <button type="button" id="candidate-search" class="btn-secondary">Buscar</button>
          </div>
          <div id="candidate-results" class="mt-4 space-y-2"></div>

          <form id="promote-form" class="mt-6 hidden space-y-4 border-t border-white/10 pt-6">
            <input type="hidden" id="promote-character-id" />
            <p id="promote-character-label" class="text-sm text-ink-300"></p>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="form-label" for="promote-badge">Nº de empleado</label>
                <input id="promote-badge" class="form-input" required maxlength="32" />
              </div>
              <div>
                <label class="form-label" for="promote-joined">Fecha de ingreso</label>
                <input id="promote-joined" type="date" class="form-input" />
              </div>
              <div>
                <label class="form-label" for="promote-callsign">Indicativo</label>
                <input id="promote-callsign" class="form-input" maxlength="32" />
              </div>
              <div>
                <label class="form-label" for="promote-rank">Rango</label>
                <select id="promote-rank" class="form-input" required></select>
              </div>
              <div>
                <label class="form-label" for="promote-department">Departamento principal</label>
                <select id="promote-department" class="form-input"><option value="">Sin asignar</option></select>
              </div>
              <div class="sm:col-span-2">
                <label class="form-label" for="promote-role">Role RBAC (permisos)</label>
                <select id="promote-role" class="form-input">
                  <option value="officer">Officer</option>
                  <option value="sergeant">Sergeant</option>
                  <option value="lieutenant">Lieutenant</option>
                  <option value="captain">Captain</option>
                  <option value="commander">Commander</option>
                  <option value="chief">Chief</option>
                  ${
                    can(PERMISSIONS.ROLES_ASSIGN) || can(PERMISSIONS.ACCOUNTS_MANAGE)
                      ? '<option value="administrator">Administrator</option>'
                      : ''
                  }
                </select>
                <p class="form-hint">Independiente del Rank. El Role define permisos; el Rank es jerarquía operativa.</p>
              </div>
            </div>
            <button type="submit" class="btn-primary">Guardar personal</button>
          </form>
        </section>
      `
          : ''
      }

      <section class="surface-card overflow-hidden">
        <div class="border-b border-white/10 px-5 py-4">
          <h3 class="text-sm font-semibold text-white">Directorio de personal médico</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-white/[0.02] text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th class="px-5 py-3">Nº empleado</th>
                <th class="px-5 py-3">Nombre</th>
                <th class="px-5 py-3">Rango</th>
                <th class="px-5 py-3">Departamento principal</th>
                <th class="px-5 py-3">Estado</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody id="officers-table-body" class="divide-y divide-white/5"></tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Gestión de personal médico',
      currentPath: '/admin/staff',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Personal médico');

      const joinedInput = root.querySelector('#promote-joined');
      if (joinedInput && !joinedInput.value) {
        joinedInput.value = new Date().toISOString().slice(0, 10);
      }

      const load = async () => {
        try {
          const [officers, ranks, departments] = await Promise.all([
            listOfficers(),
            listRanks(),
            listDepartments(),
          ]);
          fillSelect(
            root.querySelector('#promote-rank'),
            ranks.filter((item) => item.slug !== 'civilian'),
          );
          fillSelect(root.querySelector('#promote-department'), departments, true);
          renderOfficersTable(root, officers, { canDelete, canUpdate, departments });
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-staff-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const onSearch = async () => {
        const query = root.querySelector('#candidate-query')?.value?.trim() ?? '';
        const host = root.querySelector('#candidate-results');
        if (!host) return;

        try {
          const results = await searchOfficerCandidates(query);
          host.innerHTML = results.length
            ? results
                .map(
                  (item) => `
                    <button type="button" class="flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-left hover:bg-white/[0.04]" data-pick-candidate="${item.id}" data-pick-name="${item.firstName} ${item.lastName}">
                      <span class="text-sm text-white">${item.firstName} ${item.lastName}</span>
                      <span class="text-xs text-ink-400">${item.occupations?.[0]?.organization ?? item.status}</span>
                    </button>
                  `,
                )
                .join('')
            : `<p class="text-sm text-ink-400">Sin resultados</p>`;
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-staff-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const onClick = (event) => {
        const pick = event.target.closest('[data-pick-candidate]');
        if (pick) {
          const form = root.querySelector('#promote-form');
          root.querySelector('#promote-character-id').value =
            pick.getAttribute('data-pick-candidate');
          root.querySelector('#promote-character-label').textContent =
            `Personaje: ${pick.getAttribute('data-pick-name')}`;
          form?.classList.remove('hidden');
          return;
        }

        const retireBtn = event.target.closest('[data-retire-officer]');
        if (retireBtn && canDelete) {
          void retireOfficer(retireBtn.getAttribute('data-retire-officer'))
            .then(load)
            .catch((error) =>
              setAuthAlert(root, {
                id: 'admin-staff-alert',
                type: 'error',
                message: getApiErrorMessage(error),
              }),
            );
        }
      };

      const onChange = async (event) => {
        const select = event.target.closest('[data-officer-department]');
        if (!select || !canUpdate) {
          return;
        }

        const staffId = select.getAttribute('data-officer-department');
        const departmentId = select.value || null;

        try {
          await updateOfficer(staffId, { departmentId });
          setAuthAlert(root, {
            id: 'admin-staff-alert',
            type: 'success',
            message: departmentId
              ? 'Departamento principal actualizado.'
              : 'Departamento principal removido.',
          });
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-staff-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
          await load();
        }
      };

      const onPromote = async (event) => {
        event.preventDefault();
        try {
          await createOfficer({
            characterId: root.querySelector('#promote-character-id').value,
            employeeNumber: root.querySelector('#promote-badge').value.trim(),
            rankId: root.querySelector('#promote-rank').value,
            departmentId: root.querySelector('#promote-department').value || undefined,
            callsign: root.querySelector('#promote-callsign').value.trim() || undefined,
            roleSlug: root.querySelector('#promote-role')?.value || 'officer',
            joinedAt: root.querySelector('#promote-joined')?.value || undefined,
          });
          setAuthAlert(root, {
            id: 'admin-staff-alert',
            type: 'success',
            message: 'Personal creado. Organización asignada a SAED.',
          });
          root.querySelector('#promote-form')?.classList.add('hidden');
          await load();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-staff-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      root.querySelector('#candidate-search')?.addEventListener('click', onSearch);
      root.addEventListener('click', onClick);
      root.addEventListener('change', onChange);
      root.querySelector('#promote-form')?.addEventListener('submit', onPromote);
      void load();

      return () => {
        cleanup?.();
        root.querySelector('#candidate-search')?.removeEventListener('click', onSearch);
        root.removeEventListener('click', onClick);
        root.removeEventListener('change', onChange);
        root.querySelector('#promote-form')?.removeEventListener('submit', onPromote);
      };
    },
  };
}

function fillSelect(select, items, optional = false) {
  if (!select) return;
  const options = items.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');
  select.innerHTML = optional ? `<option value="">Sin asignar</option>${options}` : options;
}

function renderOfficersTable(root, officers, { canDelete, canUpdate, departments }) {
  const body = root.querySelector('#officers-table-body');
  if (!body) return;

  body.innerHTML = officers.length
    ? officers
        .map((officer) => {
          const departmentCell = canUpdate
            ? `
              <select class="form-input py-1.5 text-xs" data-officer-department="${officer.id}">
                <option value="">Sin departamento</option>
                ${departments
                  .map(
                    (item) =>
                      `<option value="${item.id}" ${officer.departmentId === item.id ? 'selected' : ''}>${item.name}</option>`,
                  )
                  .join('')}
              </select>
            `
            : (officer.department?.name ?? '—');

          return `
            <tr>
              <td class="px-5 py-3 font-medium text-white">${officer.employeeNumber}</td>
              <td class="px-5 py-3 text-ink-200">${officer.character.firstName} ${officer.character.lastName}</td>
              <td class="px-5 py-3 text-ink-300">${officer.rank?.name ?? '—'}</td>
              <td class="px-5 py-3 text-ink-300">${departmentCell}</td>
              <td class="px-5 py-3 text-ink-300">${officer.status}</td>
              <td class="px-5 py-3 text-right">
                <div class="flex justify-end gap-3">
                  <a data-link href="/admin/staff?id=${officer.id}" class="text-xs font-medium text-brand-300 hover:text-brand-200">Ver ficha</a>
                  <a data-link href="/staff?id=${officer.id}" class="text-xs font-medium text-ink-400 hover:text-ink-200">Operativa</a>
                  ${
                    canDelete && officer.status !== 'RETIRED'
                      ? `<button type="button" class="text-xs font-medium text-rose-300 hover:text-rose-200" data-retire-officer="${officer.id}">Retirar</button>`
                      : ''
                  }
                </div>
              </td>
            </tr>
          `;
        })
        .join('')
    : `<tr><td colspan="6" class="px-5 py-8 text-center text-ink-400">No hay personal médico registrado</td></tr>`;
}
