import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { renderStaffDecorationsGrid } from '../../components/staff/officer-decorations-grid.js';
import { renderStaffDepartmentPanel } from '../../components/staff/officer-department-panel.js';
import { renderStaffDepartmentsSection } from '../../components/staff/officer-departments-section.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import { getCharacterAdmin, listCharactersDirectory } from '../../services/characters.service.js';
import { createOfficer, updateOfficer } from '../../services/staff.service.js';
import { listDepartments } from '../../services/departments.service.js';
import { listRanks } from '../../services/ranks.service.js';
import {
  awardDecoration,
  listDecorations,
  revokeDecoration,
} from '../../services/decorations.service.js';
import { listComplaintsByOfficer } from '../../services/complaints.service.js';
import { can } from '../../services/auth-context.js';
import { formatDateShort } from '../../utils/date.js';
import { navigate } from '../../utils/router.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

export function adminCharactersPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  const canPromote = can(PERMISSIONS.STAFF_CREATE);
  const canUpdateOfficer = can(PERMISSIONS.STAFF_UPDATE);
  const canManageDecorations = can(PERMISSIONS.DECORATIONS_MANAGE);
  const detailId = new URLSearchParams(window.location.search).get('id');

  if (detailId) {
    return adminCharacterDetailPage(detailId, {
      canPromote,
      canUpdateOfficer,
      canManageDecorations,
    });
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-characters-alert' })}

      <section class="surface-card p-5">
        <div class="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div>
            <label class="form-label" for="characters-query">Buscar</label>
            <input id="characters-query" class="form-input" placeholder="Nombre o apellido..." />
          </div>
          <div>
            <label class="form-label" for="characters-status">Estado</label>
            <select id="characters-status" class="form-input">
              <option value="">Todos</option>
              <option value="CIVIL">Civil</option>
              <option value="MEDICAL_STAFF">Personal médico</option>
              <option value="RETIRED">Retirado</option>
              <option value="SUSPENDED">Suspendido</option>
            </select>
          </div>
          <div>
            <label class="form-label" for="characters-sort">Ordenar</label>
            <select id="characters-sort" class="form-input">
              <option value="lastName">Apellido</option>
              <option value="firstName">Nombre</option>
              <option value="status">Estado</option>
              <option value="birthDate">Nacimiento</option>
              <option value="createdAt">Registro</option>
            </select>
          </div>
          <div class="flex items-end">
            <button type="button" id="characters-refresh" class="btn-secondary w-full">Filtrar</button>
          </div>
        </div>
      </section>

      <section class="surface-card overflow-hidden">
        <div class="border-b border-white/10 px-5 py-4 flex items-center justify-between gap-3">
          <h3 class="text-sm font-semibold text-white">Personajes registrados</h3>
          <p id="characters-meta" class="text-xs text-ink-500"></p>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-white/[0.02] text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th class="px-5 py-3">Avatar</th>
                <th class="px-5 py-3">Nombre</th>
                <th class="px-5 py-3">Nacimiento</th>
                <th class="px-5 py-3">Estado</th>
                <th class="px-5 py-3">Empleo</th>
                <th class="px-5 py-3">Organización</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody id="characters-table-body" class="divide-y divide-white/5"></tbody>
          </table>
        </div>
        <div class="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
          <button type="button" id="characters-prev" class="btn-secondary text-xs">Anterior</button>
          <p id="characters-page" class="text-xs text-ink-400"></p>
          <button type="button" id="characters-next" class="btn-secondary text-xs">Siguiente</button>
        </div>
      </section>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Gestión de personajes',
      currentPath: '/admin/characters',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Personajes');
      let page = 1;

      const load = async () => {
        try {
          const data = await listCharactersDirectory({
            q: root.querySelector('#characters-query')?.value?.trim() || undefined,
            status: root.querySelector('#characters-status')?.value || undefined,
            sort: root.querySelector('#characters-sort')?.value || 'lastName',
            order: 'asc',
            page,
            pageSize: 20,
          });

          renderCharactersTable(root, data.items, { canPromote });
          root.querySelector('#characters-meta').textContent = `${data.total} personajes`;
          root.querySelector('#characters-page').textContent =
            `Página ${data.page} de ${data.totalPages}`;
          root.querySelector('#characters-prev').disabled = data.page <= 1;
          root.querySelector('#characters-next').disabled = data.page >= data.totalPages;
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-characters-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo cargar el directorio.'),
          });
        }
      };

      const onRefresh = () => {
        page = 1;
        void load();
      };

      root.querySelector('#characters-refresh')?.addEventListener('click', onRefresh);
      root.querySelector('#characters-query')?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onRefresh();
        }
      });
      root.querySelector('#characters-prev')?.addEventListener('click', () => {
        page = Math.max(1, page - 1);
        void load();
      });
      root.querySelector('#characters-next')?.addEventListener('click', () => {
        page += 1;
        void load();
      });

      void load();
      return cleanup;
    },
  };
}

function adminCharacterDetailPage(
  characterId,
  { canPromote, canUpdateOfficer, canManageDecorations },
) {
  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-character-detail-alert' })}
      <div>
        <a data-link href="/admin/characters" class="text-sm font-medium text-brand-300 hover:text-brand-200">← Volver al directorio</a>
      </div>
      <div id="character-detail-root" class="space-y-6">
        <p class="text-sm text-ink-400">Cargando ficha...</p>
      </div>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Ficha de personaje',
      currentPath: '/admin/characters',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Personaje');
      let ranks = [];
      let departments = [];
      let decorations = [];

      const load = async () => {
        try {
          const [character, ranksData, departmentsData, decorationsData] = await Promise.all([
            getCharacterAdmin(characterId),
            listRanks(),
            listDepartments(),
            listDecorations().catch(() => []),
          ]);
          ranks = ranksData;
          departments = departmentsData;
          decorations = decorationsData.filter((item) => item.isActive);
          renderCharacterDetail(root, character, {
            canPromote,
            canUpdateOfficer,
            canManageDecorations,
            canViewOfficerComplaints:
              can(PERMISSIONS.COMPLAINTS_MANAGE) || can(PERMISSIONS.ADMIN_ACCESS),
            ranks,
            departments,
            decorations,
          });
          bindDetailActions(root, character, {
            canPromote,
            canUpdateOfficer,
            canManageDecorations,
            canViewOfficerComplaints:
              can(PERMISSIONS.COMPLAINTS_MANAGE) || can(PERMISSIONS.ADMIN_ACCESS),
            load,
          });
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-character-detail-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo cargar el personaje.'),
          });
        }
      };

      void load();
      return cleanup;
    },
  };
}

function renderCharactersTable(root, items, { canPromote }) {
  const body = root.querySelector('#characters-table-body');
  if (!body) {
    return;
  }

  if (!items.length) {
    body.innerHTML = `
      <tr>
        <td colspan="7" class="px-5 py-8 text-center text-sm text-ink-400">No hay personajes con estos filtros.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = items
    .map((character) => {
      const initials =
        `${character.firstName?.[0] ?? ''}${character.lastName?.[0] ?? ''}`.toUpperCase();
      const occupation = character.primaryOccupation;
      const canPromoteThis =
        canPromote && !character.staffProfile && character.status === 'CIVIL';

      return `
        <tr class="hover:bg-white/[0.02]">
          <td class="px-5 py-3">
            <div class="h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-surface-950">
              ${
                character.avatarUrl
                  ? `<img src="${character.avatarUrl}" alt="" class="h-full w-full object-cover" />`
                  : `<div class="flex h-full w-full items-center justify-center text-xs font-semibold text-ink-300">${initials}</div>`
              }
            </div>
          </td>
          <td class="px-5 py-3 font-medium text-white">${character.firstName} ${character.lastName}</td>
          <td class="px-5 py-3 text-ink-300">${formatDate(character.birthDate)}</td>
          <td class="px-5 py-3">${statusBadge(character.status)}</td>
          <td class="px-5 py-3 text-ink-300">${occupation?.position ?? '—'}</td>
          <td class="px-5 py-3 text-ink-300">${occupation?.organization ?? character.organization ?? '—'}</td>
          <td class="px-5 py-3 text-right">
            <div class="flex justify-end gap-2">
              <a data-link href="/admin/characters?id=${character.id}" class="btn-secondary text-xs">Ver ficha</a>
              ${
                canPromoteThis
                  ? `<a data-link href="/admin/characters?id=${character.id}&promote=1" class="btn-primary text-xs">Promover</a>`
                  : ''
              }
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderCharacterDetail(
  root,
  character,
  {
    canPromote,
    canUpdateOfficer,
    canManageDecorations,
    canViewOfficerComplaints,
    ranks,
    departments,
    decorations,
  },
) {
  const host = root.querySelector('#character-detail-root');
  if (!host) {
    return;
  }

  const occupation = character.primaryOccupation;
  const officer = character.staffProfile;
  const officerDecorations = officer?.decorations ?? [];
  const initials =
    `${character.firstName?.[0] ?? ''}${character.lastName?.[0] ?? ''}`.toUpperCase();
  const showPromote = canPromote && !officer && character.status === 'CIVIL';
  const forcePromote = new URLSearchParams(window.location.search).get('promote') === '1';

  host.innerHTML = `
    <section class="surface-card overflow-hidden p-6 md:p-8">
      <div class="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div class="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-surface-950">
          ${
            character.avatarUrl
              ? `<img src="${character.avatarUrl}" alt="" class="h-full w-full object-cover" />`
              : `<div class="flex h-full w-full items-center justify-center text-2xl font-semibold text-white">${initials}</div>`
          }
        </div>
        <div class="min-w-0 flex-1">
          <p class="landing-eyebrow">Ficha</p>
          <h3 class="mt-1 text-2xl font-semibold text-white">${character.firstName} ${character.lastName}</h3>
          <div class="mt-3 flex flex-wrap gap-2">${statusBadge(character.status)}</div>
          <dl class="mt-5 grid gap-3 sm:grid-cols-2 text-sm">
            ${detailRow('Nacimiento', formatDate(character.birthDate))}
            ${detailRow('Nacionalidad', character.nationality ?? '—')}
            ${detailRow('Sexo', formatSex(character.sex))}
            ${detailRow('Estado', formatStatus(character.status))}
            ${detailRow('Organización', occupation?.organization ?? '—')}
            ${detailRow('Cargo', occupation?.position ?? '—')}
            ${officer ? detailRow('Nº empleado', officer.employeeNumber) : ''}
            ${officer ? detailRow('Rango', officer.rankLabel ?? character.rank ?? '—') : ''}
            ${officer ? detailRow('Departamento principal', officer.departmentName ?? 'Sin asignar') : ''}
            ${detailRow('Roles RBAC', (character.roles ?? []).join(', ') || '—')}
          </dl>
        </div>
        ${renderStaffDepartmentPanel({
          name: officer?.departmentName,
          imageUrl: officer?.departmentImageUrl,
          role: officer?.departments?.find((item) => item.isPrimary)?.role,
        })}
      </div>
    </section>

    ${officer ? `<div class="mt-6">${renderStaffDepartmentsSection(officer, { showBadge: false })}</div>` : ''}

    ${
      officer
        ? `
      <section class="surface-card p-6">
        <h3 class="text-sm font-semibold text-white">Condecoraciones</h3>
        <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          ${renderStaffDecorationsGrid(officerDecorations, {
            canRevoke: canManageDecorations,
            emptyClass: 'sm:col-span-2 lg:col-span-3 xl:col-span-4',
          })}
        </div>
        ${
          canManageDecorations
            ? `
          <form id="award-decoration-form" class="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-end">
            <div class="flex-1">
              <label class="form-label" for="award-decoration">Otorgar</label>
              <select id="award-decoration" class="form-input" required>
                ${decorations.map((item) => `<option value="${item.id}">${item.name}</option>`).join('')}
              </select>
            </div>
            <button type="submit" class="btn-primary">Añadir</button>
          </form>
        `
            : ''
        }
      </section>
    `
        : ''
    }

    ${
      officer && canViewOfficerComplaints
        ? `
      <section class="surface-card p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold text-white">Denuncias</h3>
            <p class="mt-1 text-xs text-ink-400">Historial disciplinario del personal (solo autorización).</p>
          </div>
        </div>
        <div id="officer-complaints-root" class="mt-4 overflow-x-auto">
          <p class="text-sm text-ink-400">Cargando denuncias...</p>
        </div>
      </section>
    `
        : ''
    }

    ${
      officer && canUpdateOfficer
        ? `
      <section class="surface-card p-6">
        <h3 class="text-sm font-semibold text-white">Departamento SAED</h3>
        <p class="mt-1 text-xs text-ink-400">Asignar, cambiar o remover el departamento del personal.</p>
        <form id="department-form" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div class="flex-1">
            <label class="form-label" for="officer-department">Departamento</label>
            <select id="officer-department" class="form-input">
              <option value="">Sin departamento</option>
                ${departments
                  .map(
                    (item) =>
                      `<option value="${item.id}" ${officer.departmentId === item.id ? 'selected' : ''}>${item.name}</option>`,
                  )
                  .join('')}
            </select>
          </div>
          <button type="submit" class="btn-primary">Guardar departamento</button>
        </form>
      </section>
    `
        : ''
    }

    ${
      showPromote
        ? `
      <section class="surface-card p-6 ${forcePromote ? '' : ''}">
        <h3 class="text-sm font-semibold text-white">Promover a personal SAED</h3>
        <p class="mt-1 text-xs text-ink-400">
          Único flujo de ingreso al departamento. Se creará StaffProfile y la organización pasará a <strong class="text-brand-300">SAED</strong>.
        </p>
        <form id="promote-form" class="mt-5 space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="form-label" for="promote-badge">Nº de empleado</label>
              <input id="promote-badge" class="form-input" required maxlength="32" />
            </div>
            <div>
              <label class="form-label" for="promote-joined">Fecha de ingreso</label>
              <input id="promote-joined" type="date" class="form-input" value="${todayIso()}" />
            </div>
            <div>
              <label class="form-label" for="promote-rank">Rango</label>
              <select id="promote-rank" class="form-input" required>
                ${ranks
                  .filter((item) => item.slug !== 'civilian')
                  .map((item) => `<option value="${item.id}">${item.name}</option>`)
                  .join('')}
              </select>
            </div>
            <div>
              <label class="form-label" for="promote-department">Departamento</label>
              <select id="promote-department" class="form-input">
                <option value="">Sin asignar</option>
                ${departments.map((item) => `<option value="${item.id}">${item.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="form-label" for="promote-callsign">Indicativo</label>
              <input id="promote-callsign" class="form-input" maxlength="32" />
            </div>
            <div>
              <label class="form-label" for="promote-role">Role RBAC</label>
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
            </div>
          </div>
          <button type="submit" class="btn-primary">Promover a personal SAED</button>
        </form>
      </section>
    `
        : officer
          ? `<p class="text-sm text-ink-400">Este personaje ya pertenece a SAED.</p>`
          : ''
    }
  `;
}

function bindDetailActions(
  root,
  character,
  { canPromote, canUpdateOfficer, canManageDecorations, canViewOfficerComplaints, load },
) {
  const promoteForm = root.querySelector('#promote-form');
  const departmentForm = root.querySelector('#department-form');
  const awardForm = root.querySelector('#award-decoration-form');

  if (canViewOfficerComplaints && character.staffProfile) {
    void loadOfficerComplaints(root, character.staffProfile.id);
  }

  promoteForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!canPromote) {
      return;
    }

    try {
      await createOfficer({
        characterId: character.id,
        employeeNumber: root.querySelector('#promote-badge').value.trim(),
        rankId: root.querySelector('#promote-rank').value,
        departmentId: root.querySelector('#promote-department').value || undefined,
        callsign: root.querySelector('#promote-callsign').value.trim() || undefined,
        roleSlug: root.querySelector('#promote-role').value,
        joinedAt: root.querySelector('#promote-joined').value || undefined,
      });
      setAuthAlert(root, {
        id: 'admin-character-detail-alert',
        type: 'success',
        message: 'Personaje promovido a personal SAED. Organización: SAED.',
      });
      void navigate(`/admin/characters?id=${character.id}`, { replace: true });
      await load();
    } catch (error) {
      setAuthAlert(root, {
        id: 'admin-character-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error, 'No se pudo promover al personaje.'),
      });
    }
  });

  departmentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!canUpdateOfficer || !character.staffProfile) {
      return;
    }

    const value = root.querySelector('#officer-department').value;
    try {
      await updateOfficer(character.staffProfile.id, {
        departmentId: value || null,
      });
      setAuthAlert(root, {
        id: 'admin-character-detail-alert',
        type: 'success',
        message: value ? 'Departamento actualizado.' : 'Departamento removido.',
      });
      await load();
    } catch (error) {
      setAuthAlert(root, {
        id: 'admin-character-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error, 'No se pudo actualizar el departamento.'),
      });
    }
  });

  awardForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!canManageDecorations || !character.staffProfile) {
      return;
    }
    try {
      await awardDecoration(character.staffProfile.id, {
        decorationId: root.querySelector('#award-decoration').value,
      });
      setAuthAlert(root, {
        id: 'admin-character-detail-alert',
        type: 'success',
        message: 'Condecoración otorgada.',
      });
      await load();
    } catch (error) {
      setAuthAlert(root, {
        id: 'admin-character-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelectorAll('[data-revoke-decoration]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!canManageDecorations) return;
      try {
        await revokeDecoration(button.getAttribute('data-revoke-decoration'));
        await load();
      } catch (error) {
        setAuthAlert(root, {
          id: 'admin-character-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });
}

async function loadOfficerComplaints(root, staffProfileId) {
  const host = root.querySelector('#officer-complaints-root');
  if (!host) return;

  const STATUS_LABELS = {
    PENDING: 'Pendiente',
    UNDER_INVESTIGATION: 'En investigación',
    WAITING_FOR_CITIZEN: 'Esperando ciudadano',
    RESOLVED: 'Resuelta',
    REJECTED: 'Rechazada',
    CLOSED: 'Cerrada',
  };

  try {
    const items = await listComplaintsByOfficer(staffProfileId);
    host.innerHTML = items.length
      ? `
        <table class="min-w-full text-left text-sm">
          <thead class="text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th class="py-2 pr-4">Nº</th>
              <th class="py-2 pr-4">Estado</th>
              <th class="py-2 pr-4">Fecha</th>
              <th class="py-2 pr-4">Investigador</th>
              <th class="py-2 pr-4">Denunciante</th>
              <th class="py-2 pr-4">Motivo</th>
              <th class="py-2"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            ${items
              .map((item) => {
                const investigator = item.investigator
                  ? `${item.investigator.firstName} ${item.investigator.lastName}`
                  : 'Sin asignar';
                return `
                  <tr>
                    <td class="py-3 pr-4 font-medium text-white">#${item.caseNumber}</td>
                    <td class="py-3 pr-4 text-ink-300">${STATUS_LABELS[item.status] ?? item.status}</td>
                    <td class="py-3 pr-4 text-ink-400">${formatDateShort(item.createdAt)}</td>
                    <td class="py-3 pr-4 text-ink-300">${investigator}</td>
                    <td class="py-3 pr-4 text-ink-300">${item.complainant.firstName} ${item.complainant.lastName}</td>
                    <td class="py-3 pr-4 text-ink-200 max-w-[12rem] truncate">${item.title}</td>
                    <td class="py-3 text-right">
                      <a data-link href="/complaints?id=${item.id}" class="text-xs font-medium text-brand-300 hover:text-brand-200">Ver</a>
                    </td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      `
      : `<p class="text-sm text-ink-400">Este personal no tiene denuncias registradas.</p>`;
  } catch (error) {
    host.innerHTML = `<p class="text-sm text-rose-300">${getApiErrorMessage(error)}</p>`;
  }
}

function detailRow(label, value) {
  return `
    <div class="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
      <dt class="text-[11px] uppercase tracking-wide text-ink-500">${label}</dt>
      <dd class="mt-0.5 font-medium text-white">${value}</dd>
    </div>
  `;
}

function statusBadge(status) {
  const styles = {
    CIVIL: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
    CADET: 'border-brand-400/20 bg-brand-400/10 text-brand-300',
    INTERN: 'border-brand-400/20 bg-brand-400/10 text-brand-300',
    OFFICER: 'border-brand-400/20 bg-brand-400/10 text-brand-300',
    MEDICAL_STAFF: 'border-brand-400/20 bg-brand-400/10 text-brand-300',
    RETIRED: 'border-ink-400/20 bg-white/5 text-ink-300',
    SUSPENDED: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  };
  return `<span class="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles[status] ?? styles.CIVIL}">${formatStatus(status)}</span>`;
}

function formatStatus(status) {
  return (
    {
      CIVIL: 'Civil',
      OFFICER: 'Personal médico',
      MEDICAL_STAFF: 'Personal médico',
      CADET: 'Interno',
      INTERN: 'Interno',
      RETIRED: 'Retirado',
      SUSPENDED: 'Suspendido',
    }[status] ?? status
  );
}

function formatSex(sex) {
  return (
    {
      MALE: 'Masculino',
      FEMALE: 'Femenino',
      OTHER: 'Otro',
    }[sex] ??
    sex ??
    '—'
  );
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
