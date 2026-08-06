import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderStaffDecorationsGrid } from '../components/staff/staff-decorations-grid.js';
import { renderStaffLicensesGrid } from '../components/staff/staff-licenses-grid.js';
import { renderStaffDepartmentPanel } from '../components/staff/staff-department-panel.js';
import { renderStaffDepartmentsSection } from '../components/staff/staff-departments-section.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { renderStatTile } from '../components/ui/stat-tile.js';
import { resolveStaffDepartments } from '../utils/staff-departments.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { setIdentityActiveCharacter, setIdentityCharacters } from '../services/auth-state.store.js';
import { getAuthState } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listCharacters, uploadCharacterAvatar } from '../services/characters.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { isSaedMember } from '../utils/character.js';
import { validateImageUploadFile } from '../utils/image-upload.js';
import { PERMISSIONS } from '../utils/permissions.js';

export function profilePage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.PROFILE_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const { user, activeCharacter, roles } = getAuthState();
  const isSaed = isSaedMember(activeCharacter);
  const statusLabel = formatStatus(activeCharacter.status);
  const joinedAt = formatDate(activeCharacter.joinedAt || activeCharacter.createdAt);
  const initials =
    `${activeCharacter.firstName?.[0] ?? ''}${activeCharacter.lastName?.[0] ?? ''}`.toUpperCase();
  const occupation = activeCharacter.primaryOccupation;
  const officer = activeCharacter.staffProfile;
  const organization = isSaed
    ? 'SAED'
    : occupation?.organization ?? null;
  const position = isSaed
    ? officer?.rankLabel ?? activeCharacter.rank ?? null
    : occupation?.position ?? null;
  const decorations = officer?.decorations ?? [];
  const licenses = officer?.licenses ?? [];
  const departmentView = officer ? resolveStaffDepartments(officer) : null;

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'profile-alert' })}
      ${renderPageHeader({
        eyebrow: isSaed ? 'Identidad activa' : 'Perfil civil',
        title: `${escapeHtml(activeCharacter.firstName)} ${escapeHtml(activeCharacter.lastName)}`,
        description: isSaed
          ? `Cuenta @${escapeHtml(user?.username ?? '—')} · ${escapeHtml(statusLabel)} · SAED`
          : `Cuenta @${escapeHtml(user?.username ?? '—')} · Ciudadano`,
        actionsHtml: `<a data-link href="/characters/select" class="btn-secondary !py-2.5">Cambiar identidad</a>`,
      })}

      <section class="panel relative overflow-hidden">
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(217,30,30,0.12),_transparent_45%)]"></div>
        <div class="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-start md:p-8">
          <div class="space-y-3">
            <div id="profile-avatar" class="h-28 w-24 shrink-0 overflow-hidden rounded-2xl border border-brand-400/30 bg-brand-500/10 text-xl font-semibold text-brand-200 shadow-[0_20px_50px_rgba(217,30,30,0.15)] sm:h-32 sm:w-28">
              ${
                activeCharacter.avatarUrl
                  ? `<img src="${escapeHtml(activeCharacter.avatarUrl)}" alt="" class="h-full w-full object-cover" />`
                  : `<div class="flex h-full w-full items-center justify-center">${escapeHtml(initials)}</div>`
              }
            </div>
            <div>
              <label class="form-label" for="profile-avatar-input">Cambiar foto</label>
              <input
                id="profile-avatar-input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                class="form-input file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500/20 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-300"
              />
              <p class="form-hint mt-2">JPG, PNG o WebP · máximo 8 MB</p>
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-400">
              ${isSaed ? 'Ficha institucional' : 'Identidad civil'}
            </p>
            <h3 class="mt-2 text-xl font-semibold text-white sm:text-2xl">
              ${escapeHtml(isSaed ? position ?? statusLabel : organization ?? 'Ciudadano')}
            </h3>
            <p class="mt-2 text-sm text-ink-300">
              ${
                isSaed
                  ? `Nº ${escapeHtml(officer?.employeeNumber ?? '—')} · Ingreso ${escapeHtml(joinedAt)}`
                  : `Ciudadano · Registrado ${escapeHtml(joinedAt)}`
              }
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <span class="status-pill status-pill-success">${escapeHtml(statusLabel)}</span>
              ${
                organization
                  ? `<span class="status-pill">${escapeHtml(organization)}</span>`
                  : ''
              }
              ${
                isSaed && officer?.callsign
                  ? `<span class="status-pill">Indicativo ${escapeHtml(officer.callsign)}</span>`
                  : ''
              }
            </div>
          </div>
          ${
            isSaed
              ? renderStaffDepartmentPanel({
                  name: departmentView?.primaryName ?? officer?.departmentName,
                  imageUrl: departmentView?.primaryImageUrl ?? officer?.departmentImageUrl,
                  role: departmentView?.primaryRole,
                })
              : ''
          }
        </div>
      </section>

      <section class="grid gap-4 sm:grid-cols-2 ${isSaed ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}">
        ${renderStatTile({ label: 'Estado', value: statusLabel, hint: 'Situación actual', iconName: 'check' })}
        ${
          organization
            ? renderStatTile({
                label: isSaed ? 'Organización' : 'Empleo',
                value: organization,
                hint: isSaed ? 'Afiliación SAED' : 'Actividad civil',
                iconName: 'users',
              })
            : renderStatTile({
                label: 'Tipo',
                value: 'Civil',
                hint: 'Sin afiliación SAED',
                iconName: 'users',
              })
        }
        ${
          isSaed
            ? renderStatTile({
                label: 'Rango',
                value: position ?? '—',
                hint: 'Jerarquía médica',
                iconName: 'shield',
              })
            : position
              ? renderStatTile({
                  label: 'Cargo',
                  value: position,
                  hint: 'Empleo civil',
                  iconName: 'shield',
                })
              : renderStatTile({
                  label: 'Cuenta',
                  value: `@${user?.username ?? '—'}`,
                  hint: 'Usuario de acceso',
                  iconName: 'lock',
                })
        }
        ${
          isSaed && officer
            ? renderStatTile({
                label: 'Nº empleado',
                value: officer.employeeNumber,
                hint: 'Identificador SAED',
                iconName: 'file',
                tone: 'brand',
              })
            : ''
        }
      </section>

      ${isSaed && officer ? renderStaffDepartmentsSection(officer, { showBadge: false }) : ''}

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="panel p-6">
          <h3 class="text-sm font-semibold text-white">Datos del personaje</h3>
          <dl class="mt-4 space-y-3 text-sm">
            ${detailRow('Nombre', activeCharacter.firstName)}
            ${detailRow('Apellido', activeCharacter.lastName)}
            ${detailRow('Fecha de nacimiento', formatDate(activeCharacter.birthDate))}
            ${detailRow('Nacionalidad', activeCharacter.nationality ?? '—')}
            ${detailRow('Sexo', formatSex(activeCharacter.sex))}
            ${detailRow('Teléfono', activeCharacter.phone ?? '—')}
            ${detailRow('Estado', statusLabel)}
            ${detailRow('Registrado', joinedAt)}
            ${detailRow('Roles', (roles?.length ? roles : (activeCharacter.roles ?? [])).join(', ') || 'citizen')}
          </dl>
        </article>

        <article class="panel p-6">
          <h3 class="text-sm font-semibold text-white">
            ${isSaed ? 'Servicio SAED' : 'Información civil'}
          </h3>
          <p class="mt-1 text-xs text-ink-400">
            ${
              isSaed
                ? 'Datos institucionales del personal médico activo.'
                : 'Solo se muestra información relevante para un ciudadano. Los datos SAED no aplican.'
            }
          </p>
          <dl class="mt-5 space-y-3 text-sm">
            ${
              isSaed
                ? `
                  ${detailRow('Organización', 'SAED')}
                  ${detailRow('Rango', position ?? '—')}
                  ${detailRow('Nº empleado', officer?.employeeNumber ?? '—')}
                  ${detailRow('Departamento principal', departmentView?.primaryName ?? 'Sin asignar')}
                  ${detailRow('Indicativo', officer?.callsign ?? '—')}
                  ${detailRow('Estado del personal', formatStaffStatus(officer?.status))}
                `
                : `
                  ${detailRow('Tipo de perfil', 'Ciudadano')}
                  ${organization ? detailRow('Empleo / organización', organization) : ''}
                  ${position ? detailRow('Cargo', position) : ''}
                  ${occupation ? detailRow('Tipo de empleo', formatOccupationType(occupation?.type)) : ''}
                  ${detailRow('Acceso portal', 'Citas, quejas y academia')}
                `
            }
          </dl>
        </article>
      </section>

      ${
        isSaed && officer
          ? `
        <section class="panel p-6">
          <h3 class="text-sm font-semibold text-white">Condecoraciones</h3>
          <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            ${renderStaffDecorationsGrid(decorations, {
              emptyClass: 'sm:col-span-2 lg:col-span-3 xl:col-span-4',
            })}
          </div>
        </section>
        <section class="panel p-6">
          <h3 class="text-sm font-semibold text-white">Licencias</h3>
          <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            ${renderStaffLicensesGrid(licenses, {
              emptyClass: 'sm:col-span-2 lg:col-span-3 xl:col-span-4',
            })}
          </div>
        </section>
      `
          : ''
      }
    </div>
  `;

  return {
    html: renderDashboardLayout(content, { title: 'Perfil', currentPath: '/profile' }),
    afterMount(root) {
      document.title = 'Perfil · SAED';
      const cleanup = initDashboardLayout(root);
      const input = root.querySelector('#profile-avatar-input');

      const onChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validation = validateImageUploadFile(file, { required: true });
        if (!validation.ok) {
          event.target.value = '';
          setAuthAlert(root, {
            id: 'profile-alert',
            type: 'error',
            message: validation.message,
          });
          return;
        }

        try {
          const { activeCharacter: current } = getAuthState();
          await uploadCharacterAvatar(current.id, validation.file);
          const characters = await listCharacters();
          setIdentityCharacters(characters);
          const updated = characters.find((item) => item.id === current.id);
          if (updated) {
            setIdentityActiveCharacter(updated);
          }
          const host = root.querySelector('#profile-avatar');
          if (host && updated?.avatarUrl) {
            host.innerHTML = `<img src="${escapeHtml(updated.avatarUrl)}" alt="" class="h-full w-full object-cover" />`;
          }
          setAuthAlert(root, {
            id: 'profile-alert',
            type: 'success',
            message: 'Fotografía de perfil actualizada.',
          });
        } catch (error) {
          setAuthAlert(root, {
            id: 'profile-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo actualizar la fotografía.'),
          });
        } finally {
          event.target.value = '';
        }
      };

      input?.addEventListener('change', onChange);
      return () => {
        input?.removeEventListener('change', onChange);
        cleanup?.();
      };
    },
  };
}

function detailRow(label, value) {
  return `
    <div class="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <dt class="text-ink-400">${label}</dt>
      <dd class="text-right font-medium text-white">${escapeHtml(value)}</dd>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatStatus(status) {
  return (
    {
      CIVIL: 'Civil',
      CADET: 'Interno',
      INTERN: 'Interno',
      OFFICER: 'Personal médico',
      MEDICAL_STAFF: 'Personal médico',
      RETIRED: 'Retirado',
      SUSPENDED: 'Suspendido',
    }[status] ?? status
  );
}

function formatStaffStatus(status) {
  return (
    {
      ACTIVE: 'Activo',
      INACTIVE: 'Inactivo',
      SUSPENDED: 'Suspendido',
      RETIRED: 'Retirado',
    }[status] ??
    status ??
    '—'
  );
}

function formatOccupationType(type) {
  return (
    {
      DEPARTMENT: 'Departamento',
      BUSINESS: 'Negocio',
      EMPLOYMENT: 'Empleo',
      OTHER: 'Otro',
    }[type] ??
    type ??
    '—'
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

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
