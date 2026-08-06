import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { renderOfficerAuditTimeline } from '../../components/staff/staff-audit-timeline.js';
import { renderStaffDecorationsGrid } from '../../components/staff/staff-decorations-grid.js';
import { renderStaffLicensesGrid } from '../../components/staff/staff-licenses-grid.js';
import { renderStaffDepartmentPanel } from '../../components/staff/staff-department-panel.js';
import { renderStaffDepartmentsSection } from '../../components/staff/staff-departments-section.js';
import { can } from '../../services/auth-context.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import { listAuditLogs } from '../../services/audit.service.js';
import { getCharacterAdmin } from '../../services/characters.service.js';
import { listComplaintsByOfficer } from '../../services/complaints.service.js';
import {
  awardDecoration,
  listDecorations,
  revokeDecoration,
} from '../../services/decorations.service.js';
import {
  assignLicense,
  listLicenses,
  revokeLicense,
} from '../../services/licenses.service.js';
import { listDepartments } from '../../services/departments.service.js';
import {
  assignStaffDepartment,
  getOfficer,
  removeStaffDepartment,
  updateOfficer,
  updateOfficerIdentity,
} from '../../services/staff.service.js';
import { listRanks } from '../../services/ranks.service.js';
import { formatDateShort } from '../../utils/date.js';
import { resolveUploadUrl } from '../../utils/media.js';
import {
  getDepartmentRoleLabel,
  resolveStaffDepartments,
} from '../../utils/staff-departments.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'SUSPENDED', label: 'Suspendido' },
  { value: 'RETIRED', label: 'Retirado' },
];

const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((item) => [item.value, item.label]));

/**
 * Administrative officer fiche.
 * Operational directory remains at /staff?id=.
 */
export function adminOfficerDetailPage(staffId) {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  const canUpdateOfficer = can(PERMISSIONS.STAFF_UPDATE);
  const canManageIdentity = can(PERMISSIONS.STAFF_IDENTITY);
  const canManageDecorations = can(PERMISSIONS.DECORATIONS_MANAGE);
  const canManageLicenses = can(PERMISSIONS.LICENSES_MANAGE);
  const canViewComplaints = can(PERMISSIONS.COMPLAINTS_MANAGE) || can(PERMISSIONS.ADMIN_ACCESS);
  const canViewAudit = can(PERMISSIONS.AUDIT_READ) || can(PERMISSIONS.ADMIN_ACCESS);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-staff-detail-alert' })}
      <a data-link href="/admin/staff" class="inline-flex text-sm font-medium text-brand-300 hover:text-brand-200">← Volver a personal médico</a>
      <div id="admin-staff-root">
        <p class="text-sm text-ink-400">Cargando ficha administrativa...</p>
      </div>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Ficha administrativa',
      currentPath: '/admin/staff',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Ficha de personal');
      const permissions = {
        canUpdateOfficer,
        canManageIdentity,
        canManageDecorations,
        canManageLicenses,
        canViewComplaints,
        canViewAudit,
      };

      const state = {
        officer: null,
        character: null,
        ranks: [],
        departments: [],
        decorations: [],
        licenses: [],
        auditEvents: [],
        activeTab: 'overview',
      };

      const refresh = async () => {
        const [officer, ranks, departments, decorationsCatalog, licensesCatalog] = await Promise.all([
          getOfficer(staffId),
          listRanks(),
          listDepartments(),
          listDecorations().catch(() => []),
          listLicenses().catch(() => []),
        ]);
        const character = await getCharacterAdmin(officer.character.id);
        const auditEvents = permissions.canViewAudit
          ? await listAuditLogs({
              targetType: 'Officer',
              targetId: officer.id,
              limit: 150,
            }).catch(() => [])
          : [];

        state.officer = officer;
        state.character = character;
        state.ranks = ranks;
        state.departments = departments;
        state.decorations = decorationsCatalog.filter((item) => item.isActive);
        state.licenses = licensesCatalog.filter((item) => item.isActive);
        state.auditEvents = Array.isArray(auditEvents) ? auditEvents : [];

        paint();
        document.title = `${officer.character.firstName} ${officer.character.lastName} · Admin · SAED`;
      };

      const paint = () => {
        renderFiche(root, state, permissions);
        attachHandlers(root, state, permissions, {
          onTab: (tab) => {
            state.activeTab = tab;
            paint();
          },
          onReload: refresh,
        });
      };

      void refresh().catch((error) => {
        setAuthAlert(root, {
          id: 'admin-staff-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error, 'No se pudo cargar la ficha administrativa.'),
        });
      });

      return cleanup;
    },
  };
}

function renderFiche(root, state, permissions) {
  const host = root.querySelector('#admin-staff-root');
  if (!host || !state.officer || !state.character) {
    return;
  }

  const { officer, character, ranks, departments, decorations, licenses, auditEvents, activeTab } =
    state;
  const staffProfile = character.staffProfile ?? {};
  const initials =
    `${character.firstName?.[0] ?? ''}${character.lastName?.[0] ?? ''}`.toUpperCase();
  const avatarUrl = resolveUploadUrl(character.avatarUrl ?? officer.character?.avatarUrl);
  const officerDecorations = staffProfile.decorations ?? officer.decorations ?? [];
  const officerLicenses = staffProfile.licenses ?? officer.licenses ?? [];
  const departmentSource = {
    ...officer,
    departments: officer.departmentMemberships ?? staffProfile.departments ?? [],
    departmentName: staffProfile.departmentName ?? officer.department?.name,
    departmentImageUrl: staffProfile.departmentImageUrl ?? officer.department?.imageUrl,
  };
  const { primaryName, primaryImageUrl, primaryRole } = resolveStaffDepartments(departmentSource);

  const tabs = [
    { id: 'overview', label: 'Resumen' },
    ...(permissions.canViewComplaints ? [{ id: 'complaints', label: 'Quejas' }] : []),
    ...(permissions.canUpdateOfficer ||
    permissions.canManageIdentity ||
    permissions.canManageDecorations ||
    permissions.canManageLicenses
      ? [{ id: 'manage', label: 'Gestión' }]
      : []),
    ...(permissions.canViewAudit ? [{ id: 'audit', label: 'Auditoría' }] : []),
  ];

  host.innerHTML = `
    <section class="panel overflow-hidden p-6 md:p-8">
      <div class="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div class="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-surface-950">
          ${
            avatarUrl
              ? `<img src="${escapeHtml(avatarUrl)}" alt="" class="h-full w-full object-cover" />`
              : `<div class="flex h-full w-full items-center justify-center text-2xl font-semibold text-white">${initials}</div>`
          }
        </div>
        <div class="min-w-0 flex-1">
          <p class="landing-eyebrow">Ficha administrativa</p>
          <h3 class="mt-1 text-2xl font-semibold text-white">${escapeHtml(character.firstName)} ${escapeHtml(character.lastName)}</h3>
          <p class="mt-2 text-sm text-brand-300">
            ${escapeHtml(staffProfile.rankLabel ?? officer.rank?.name ?? '—')} · Badge ${escapeHtml(officer.employeeNumber)}
          </p>
          <p class="mt-1 text-sm text-ink-300">${STATUS_LABELS[officer.status] ?? officer.status}</p>
          <dl class="mt-5 grid gap-3 sm:grid-cols-2 text-sm">
            ${detailRow('Nacimiento', formatDate(character.birthDate))}
            ${detailRow('Nacionalidad', character.nationality ?? '—')}
            ${detailRow('Sexo', formatSex(character.sex))}
            ${detailRow('Nº empleado', officer.employeeNumber)}
            ${detailRow('Rango', staffProfile.rankLabel ?? officer.rank?.name ?? '—')}
            ${detailRow('Departamento principal', primaryName ?? 'Sin asignar')}
            ${detailRow('Indicativo', officer.callsign ?? '—')}
            ${detailRow('Roles RBAC', (character.roles ?? []).join(', ') || '—')}
          </dl>
          <div class="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <a data-link href="/staff?id=${officer.id}" class="font-medium text-ink-400 hover:text-brand-300">Ver ficha operativa →</a>
            <a data-link href="/admin/characters?id=${character.id}" class="font-medium text-ink-400 hover:text-brand-300">Ficha de personaje →</a>
          </div>
        </div>
        ${renderStaffDepartmentPanel({
          name: primaryName,
          imageUrl: primaryImageUrl,
          role: primaryRole,
        })}
      </div>
    </section>

    <nav class="mt-6 flex flex-wrap gap-2 md:mt-8">
      ${tabs
        .map((tab) => {
          const active = activeTab === tab.id;
          return `
            <button
              type="button"
              data-officer-tab="${tab.id}"
              class="rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-brand-500/15 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.25)]'
                  : 'border border-white/10 text-ink-300 hover:bg-white/[0.04] hover:text-white'
              }"
            >${tab.label}</button>
          `;
        })
        .join('')}
    </nav>

    ${
      activeTab === 'overview'
        ? `
      ${renderStaffDepartmentsSection(departmentSource, { showBadge: false, className: 'mt-6' })}
      <section class="mt-6 panel p-6">
        <h3 class="text-sm font-semibold text-white">Condecoraciones</h3>
        <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          ${renderStaffDecorationsGrid(officerDecorations, {
            emptyClass: 'sm:col-span-2 lg:col-span-3 xl:col-span-4',
          })}
        </div>
      </section>
      <section class="mt-6 panel p-6">
        <h3 class="text-sm font-semibold text-white">Licencias</h3>
        <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          ${renderStaffLicensesGrid(officerLicenses, {
            emptyClass: 'sm:col-span-2 lg:col-span-3 xl:col-span-4',
          })}
        </div>
      </section>
    `
        : ''
    }

    ${
      activeTab === 'complaints'
        ? `
      <section class="panel p-6">
        <h3 class="text-sm font-semibold text-white">Historial de quejas</h3>
        <p class="mt-1 text-xs text-ink-400">Expediente disciplinario asociado a este personal.</p>
        <div id="officer-complaints-root" class="mt-4 overflow-x-auto">
          <p class="text-sm text-ink-400">Cargando quejas...</p>
        </div>
      </section>
    `
        : ''
    }

    ${
      activeTab === 'manage'
        ? renderManagePanel({
            officer,
            staffProfile,
            ranks,
            departments,
            decorations,
            licenses,
            canUpdateOfficer: permissions.canUpdateOfficer,
            canManageIdentity: permissions.canManageIdentity,
            canManageDecorations: permissions.canManageDecorations,
            canManageLicenses: permissions.canManageLicenses,
            officerDecorations,
            officerLicenses,
          })
        : ''
    }

    ${
      activeTab === 'audit'
        ? `
      <section class="panel p-6">
        <h3 class="text-sm font-semibold text-white">Auditoría</h3>
        <p class="mt-1 text-xs text-ink-400">Trayectoria administrativa y profesional dentro del SAED.</p>
        <div class="mt-6">
          ${renderOfficerAuditTimeline(auditEvents)}
        </div>
      </section>
    `
        : ''
    }
  `;
}

function renderManagePanel({
  officer,
  staffProfile,
  ranks,
  departments,
  decorations,
  licenses,
  canUpdateOfficer,
  canManageIdentity,
  canManageDecorations,
  canManageLicenses,
  officerDecorations,
  officerLicenses,
}) {
  return `
    <div class="space-y-6">
      ${
        canUpdateOfficer
          ? `
        <section class="panel p-6">
          <h3 class="text-sm font-semibold text-white">Gestión operativa</h3>
          <p class="mt-1 text-xs text-ink-400">Rango, departamento y estado.</p>
          <form id="officer-manage-form" class="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="form-label" for="manage-rank">Rango</label>
              <select id="manage-rank" class="form-input">
                ${ranks
                  .filter((item) => item.slug !== 'civilian')
                  .map(
                    (item) =>
                      `<option value="${item.id}" ${officer.rankId === item.id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`,
                  )
                  .join('')}
              </select>
            </div>
            <div>
              <label class="form-label" for="manage-department">Departamento principal</label>
              <select id="manage-department" class="form-input">
                <option value="">Sin departamento</option>
                ${departments
                  .map(
                    (item) =>
                      `<option value="${item.id}" ${(staffProfile.departmentId ?? officer.departmentId) === item.id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`,
                  )
                  .join('')}
              </select>
              <p class="form-hint">Define la identidad operativa del personal. Los alternos se gestionan abajo.</p>
            </div>
            <div>
              <label class="form-label" for="manage-status">Estado</label>
              <select id="manage-status" class="form-input">
                ${STATUS_OPTIONS.map(
                  (item) =>
                    `<option value="${item.value}" ${officer.status === item.value ? 'selected' : ''}>${item.label}</option>`,
                ).join('')}
              </select>
            </div>
            <div class="sm:col-span-2">
              <button type="submit" class="btn-primary">Guardar cambios</button>
            </div>
          </form>
        </section>
      `
          : ''
      }

      ${
        canUpdateOfficer
          ? `
        <section class="panel p-6">
          <h3 class="text-sm font-semibold text-white">Departamentos</h3>
          <p class="mt-1 text-xs text-ink-400">Una principal (identidad) y varias alternas con rol propio.</p>
          ${renderAdminDepartmentsManager(officer, staffProfile)}
          <form id="assign-department-form" class="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-4">
            <div class="sm:col-span-2">
              <label class="form-label" for="assign-department-id">Departamento</label>
              <select id="assign-department-id" class="form-input" required>
                ${departments.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="form-label" for="assign-department-role">Rol en el departamento</label>
              <select id="assign-department-role" class="form-input">
                <option value="MEMBER">Miembro</option>
                <option value="LEAD">Encargado</option>
                <option value="SUPERVISOR">Supervisor</option>
              </select>
            </div>
            <div class="flex items-end">
              <label class="inline-flex items-center gap-2 text-sm text-ink-300">
                <input id="assign-department-primary" type="checkbox" class="rounded border-white/20 bg-surface-950 text-brand-500" />
                Como principal
              </label>
            </div>
            <div class="sm:col-span-4">
              <button type="submit" class="btn-primary">Asignar departamento</button>
            </div>
          </form>
        </section>
      `
          : ''
      }

      ${
        canManageIdentity
          ? `
        <section class="panel p-6">
          <h3 class="text-sm font-semibold text-white">Nº de empleado e indicativo</h3>
          <p class="mt-1 text-xs text-ink-400">Solo Chief y Administrator pueden modificar estos datos.</p>
          <form id="officer-identity-form" class="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="form-label" for="manage-badge">Número de empleado</label>
              <input id="manage-badge" class="form-input" required maxlength="32" value="${escapeHtml(officer.employeeNumber ?? '')}" />
            </div>
            <div>
              <label class="form-label" for="manage-callsign">Indicativo</label>
              <input id="manage-callsign" class="form-input" maxlength="32" value="${escapeHtml(officer.callsign ?? '')}" />
            </div>
            <div class="sm:col-span-2">
              <button type="submit" class="btn-primary">Guardar identidad</button>
            </div>
          </form>
        </section>
      `
          : ''
      }

      ${
        canManageDecorations
          ? `
        <section class="panel p-6">
          <h3 class="text-sm font-semibold text-white">Condecoraciones</h3>
          <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            ${renderStaffDecorationsGrid(officerDecorations, {
              canRevoke: true,
              emptyClass: 'sm:col-span-2 lg:col-span-3 xl:col-span-4',
            })}
          </div>
          <form id="award-decoration-form" class="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-end">
            <div class="flex-1">
              <label class="form-label" for="award-decoration">Otorgar</label>
              <select id="award-decoration" class="form-input" required>
                ${decorations.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('')}
              </select>
            </div>
            <button type="submit" class="btn-primary">Añadir</button>
          </form>
        </section>
      `
          : ''
      }

      ${
        canManageLicenses
          ? `
        <section class="panel p-6">
          <h3 class="text-sm font-semibold text-white">Licencias</h3>
          <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            ${renderStaffLicensesGrid(officerLicenses, {
              canRevoke: true,
              emptyClass: 'sm:col-span-2 lg:col-span-3 xl:col-span-4',
            })}
          </div>
          <form id="assign-license-form" class="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-end">
            <div class="flex-1">
              <label class="form-label" for="assign-license">Asignar</label>
              <select id="assign-license" class="form-input" required>
                ${licenses
                  .map(
                    (item) =>
                      `<option value="${item.id}">${escapeHtml(item.code)} · ${escapeHtml(item.name)}</option>`,
                  )
                  .join('')}
              </select>
            </div>
            <button type="submit" class="btn-primary">Añadir</button>
          </form>
        </section>
      `
          : ''
      }
    </div>
  `;
}

function attachHandlers(root, state, permissions, { onTab, onReload }) {
  root.querySelectorAll('[data-officer-tab]').forEach((button) => {
    button.addEventListener('click', () => onTab(button.getAttribute('data-officer-tab')));
  });

  if (state.activeTab === 'complaints' && permissions.canViewComplaints && state.officer) {
    void loadComplaints(root, state.officer.id);
  }

  const manageForm = root.querySelector('#officer-manage-form');
  manageForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!permissions.canUpdateOfficer || !state.officer) return;
    try {
      await updateOfficer(state.officer.id, {
        rankId: root.querySelector('#manage-rank').value,
        departmentId: root.querySelector('#manage-department').value || null,
        status: root.querySelector('#manage-status').value,
      });
      setAuthAlert(root, {
        id: 'admin-staff-detail-alert',
        type: 'success',
        message: 'Perfil SAED actualizado.',
      });
      await onReload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'admin-staff-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  const identityForm = root.querySelector('#officer-identity-form');
  identityForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!permissions.canManageIdentity || !state.officer) return;
    try {
      await updateOfficerIdentity(state.officer.id, {
        employeeNumber: root.querySelector('#manage-badge').value.trim(),
        callsign: root.querySelector('#manage-callsign').value.trim() || null,
      });
      setAuthAlert(root, {
        id: 'admin-staff-detail-alert',
        type: 'success',
        message: 'Nº de empleado e indicativo actualizados.',
      });
      await onReload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'admin-staff-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  const assignDepartmentForm = root.querySelector('#assign-department-form');
  assignDepartmentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!permissions.canUpdateOfficer || !state.officer) return;
    try {
      await assignStaffDepartment(state.officer.id, {
        departmentId: root.querySelector('#assign-department-id').value,
        role: root.querySelector('#assign-department-role').value,
        isPrimary: Boolean(root.querySelector('#assign-department-primary')?.checked),
      });
      setAuthAlert(root, {
        id: 'admin-staff-detail-alert',
        type: 'success',
        message: 'Departamento asignado.',
      });
      await onReload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'admin-staff-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelectorAll('[data-remove-department]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!permissions.canUpdateOfficer) return;
      try {
        await removeStaffDepartment(button.getAttribute('data-remove-department'));
        await onReload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'admin-staff-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });

  root.querySelectorAll('[data-set-primary-department]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!permissions.canUpdateOfficer || !state.officer) return;
      try {
        await assignStaffDepartment(state.officer.id, {
          departmentId: button.getAttribute('data-set-primary-department'),
          role: button.getAttribute('data-department-role') || 'MEMBER',
          isPrimary: true,
        });
        setAuthAlert(root, {
          id: 'admin-staff-detail-alert',
          type: 'success',
          message: 'Departamento principal actualizado.',
        });
        await onReload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'admin-staff-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });

  const awardForm = root.querySelector('#award-decoration-form');
  awardForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!permissions.canManageDecorations || !state.officer) return;
    try {
      await awardDecoration(state.officer.id, {
        decorationId: root.querySelector('#award-decoration').value,
      });
      setAuthAlert(root, {
        id: 'admin-staff-detail-alert',
        type: 'success',
        message: 'Condecoración otorgada.',
      });
      await onReload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'admin-staff-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelectorAll('[data-revoke-decoration]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!permissions.canManageDecorations) return;
      try {
        await revokeDecoration(button.getAttribute('data-revoke-decoration'));
        await onReload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'admin-staff-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });

  const assignLicenseForm = root.querySelector('#assign-license-form');
  assignLicenseForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!permissions.canManageLicenses || !state.officer) return;
    try {
      await assignLicense(state.officer.id, {
        licenseId: root.querySelector('#assign-license').value,
      });
      setAuthAlert(root, {
        id: 'admin-staff-detail-alert',
        type: 'success',
        message: 'Licencia asignada.',
      });
      await onReload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'admin-staff-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelectorAll('[data-revoke-license]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!permissions.canManageLicenses) return;
      try {
        await revokeLicense(button.getAttribute('data-revoke-license'));
        await onReload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'admin-staff-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });
}

async function loadComplaints(root, staffProfileId) {
  const host = root.querySelector('#officer-complaints-root');
  if (!host) return;

  const labels = {
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
              <th class="py-2 pr-4">Quejoso</th>
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
                    <td class="py-3 pr-4 text-ink-300">${labels[item.status] ?? item.status}</td>
                    <td class="py-3 pr-4 text-ink-400">${formatDateShort(item.createdAt)}</td>
                    <td class="py-3 pr-4 text-ink-300">${escapeHtml(investigator)}</td>
                    <td class="py-3 pr-4 text-ink-300">${escapeHtml(item.complainant.firstName)} ${escapeHtml(item.complainant.lastName)}</td>
                    <td class="py-3 pr-4 max-w-[12rem] truncate text-ink-200">${escapeHtml(item.title)}</td>
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
      : `<p class="text-sm text-ink-400">Este personal no tiene quejas registradas.</p>`;
  } catch (error) {
    host.innerHTML = `<p class="text-sm text-rose-300">${getApiErrorMessage(error)}</p>`;
  }
}

function renderAdminDepartmentsManager(officer, staffProfile) {
  const source = {
    ...officer,
    departments: officer.departmentMemberships ?? staffProfile.departments ?? [],
    departmentName: staffProfile.departmentName ?? officer.department?.name,
    departmentImageUrl: staffProfile.departmentImageUrl ?? officer.department?.imageUrl,
  };
  const { primary, alternates } = resolveStaffDepartments(source);

  return `
    <div class="mt-4 space-y-5">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Departamento principal</p>
        ${
          primary
            ? `<div class="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-500/25 bg-brand-500/5 px-3 py-2.5 text-sm">
                <span class="text-white">
                  ${escapeHtml(primary.name)}
                  <span class="ml-2 text-xs text-brand-300">${escapeHtml(getDepartmentRoleLabel(primary.role))}</span>
                </span>
                ${
                  primary.id
                    ? `<button type="button" class="text-xs font-medium text-rose-300" data-remove-department="${primary.id}">Quitar</button>`
                    : ''
                }
              </div>`
            : `<p class="mt-2 text-sm text-ink-400">Sin departamento principal.</p>`
        }
      </div>
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Departamentos alternas</p>
        <ul class="mt-2 space-y-2">
          ${
            alternates.length
              ? alternates
                  .map(
                    (item) => `
                      <li class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm">
                        <span class="text-white">
                          ${escapeHtml(item.name)}
                          <span class="ml-2 text-xs text-ink-400">${escapeHtml(getDepartmentRoleLabel(item.role))}</span>
                        </span>
                        <span class="flex flex-wrap gap-3">
                          ${
                            item.departmentId
                              ? `<button type="button" class="text-xs font-medium text-brand-300" data-set-primary-department="${item.departmentId}" data-department-role="${item.role}">Hacer principal</button>`
                              : ''
                          }
                          ${
                            item.id
                              ? `<button type="button" class="text-xs font-medium text-rose-300" data-remove-department="${item.id}">Quitar</button>`
                              : ''
                          }
                        </span>
                      </li>
                    `,
                  )
                  .join('')
              : `<li class="text-sm text-ink-400">Sin departmentes alternas.</li>`
          }
        </ul>
      </div>
    </div>
  `;
}

function detailRow(label, value) {
  return `
    <div class="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
      <dt class="text-[11px] uppercase tracking-wide text-ink-500">${label}</dt>
      <dd class="mt-0.5 font-medium text-white">${escapeHtml(value)}</dd>
    </div>
  `;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
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

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
