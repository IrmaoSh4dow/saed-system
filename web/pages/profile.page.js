import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { icon } from '../components/landing/icons.js';
import { renderStaffDecorationsGrid } from '../components/staff/officer-decorations-grid.js';
import { renderStaffLicensesGrid } from '../components/staff/officer-licenses-grid.js';
import { renderStaffDepartmentPanel } from '../components/staff/officer-department-panel.js';
import { renderStaffDepartmentsSection } from '../components/staff/officer-departments-section.js';
import { resolveStaffDepartments } from '../utils/staff-departments.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { setIdentityActiveCharacter, setIdentityCharacters } from '../services/auth-state.store.js';
import { getAuthState } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listCharacters, uploadCharacterAvatar } from '../services/characters.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
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
  const statusLabel = formatStatus(activeCharacter.status);
  const joinedAt = formatDate(activeCharacter.joinedAt || activeCharacter.createdAt);
  const initials =
    `${activeCharacter.firstName?.[0] ?? ''}${activeCharacter.lastName?.[0] ?? ''}`.toUpperCase();
  const occupation = activeCharacter.primaryOccupation;
  const officer = activeCharacter.staffProfile;
  const organization = occupation?.organization ?? (officer ? 'SAED' : '—');
  const position = occupation?.position ?? officer?.rankLabel ?? activeCharacter.rank ?? '—';
  const decorations = officer?.decorations ?? [];
  const licenses = officer?.licenses ?? [];
  const departmentView = officer ? resolveStaffDepartments(officer) : null;

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'profile-alert' })}
      <section class="surface-card overflow-hidden p-6 md:p-8">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div class="space-y-3">
            <div id="profile-avatar" class="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-brand-500/30 bg-brand-500/10 text-xl font-semibold text-brand-200">
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
            <p class="landing-eyebrow">Perfil</p>
            <h2 class="mt-1 text-2xl font-semibold tracking-tight text-white">
              ${escapeHtml(activeCharacter.firstName)} ${escapeHtml(activeCharacter.lastName)}
            </h2>
            <p class="mt-2 text-sm text-ink-300">
              Cuenta: <span class="text-white">${escapeHtml(user?.displayName ?? user?.username ?? '—')}</span>
            </p>
            <p class="mt-2 text-sm text-brand-300">${escapeHtml(statusLabel)} · ${escapeHtml(organization)}</p>
          </div>
          ${renderStaffDepartmentPanel({
            name: departmentView?.primaryName ?? officer?.departmentName,
            imageUrl: departmentView?.primaryImageUrl ?? officer?.departmentImageUrl,
            role: departmentView?.primaryRole,
          })}
        </div>
      </section>

      <section class="grid gap-4 sm:grid-cols-2 ${officer ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}">
        ${profileStat('Estado', statusLabel, 'check')}
        ${profileStat('Organización', organization, 'users')}
        ${profileStat(officer ? 'Rango' : 'Cargo', position, 'shield')}
        ${officer ? profileStat('Nº empleado', officer.employeeNumber, 'file') : ''}
      </section>

      ${officer ? renderStaffDepartmentsSection(officer, { showBadge: false }) : ''}

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="surface-card p-6">
          <h3 class="text-sm font-semibold text-white">Datos del personaje</h3>
          <dl class="mt-4 space-y-3 text-sm">
            ${detailRow('Nombre', activeCharacter.firstName)}
            ${detailRow('Apellido', activeCharacter.lastName)}
            ${detailRow('Fecha de nacimiento', formatDate(activeCharacter.birthDate))}
            ${detailRow('Nacionalidad', activeCharacter.nationality ?? '—')}
            ${detailRow('Sexo', formatSex(activeCharacter.sex))}
            ${detailRow('Estado', statusLabel)}
            ${detailRow('Organización', organization)}
            ${detailRow(officer ? 'Rango' : 'Cargo', position)}
            ${officer ? detailRow('Nº empleado', officer.employeeNumber) : ''}
            ${officer ? detailRow('Departamento principal', departmentView?.primaryName ?? 'Sin asignar') : ''}
            ${detailRow('Ingreso', joinedAt)}
            ${detailRow('Roles RBAC', (roles?.length ? roles : (activeCharacter.roles ?? [])).join(', ') || 'citizen')}
          </dl>
        </article>

        <article class="surface-card p-6">
          <h3 class="text-sm font-semibold text-white">
            ${officer ? 'Servicio SAED' : 'Empleo civil'}
          </h3>
          <p class="mt-1 text-xs text-ink-400">
            ${
              officer
                ? 'La organización SAED se asigna automáticamente al promover al personaje.'
                : 'El empleo se elige al crear el personaje. SAED no puede seleccionarse manualmente.'
            }
          </p>
          <dl class="mt-5 space-y-3 text-sm">
            ${detailRow('Organización', organization)}
            ${detailRow(officer ? 'Rango' : 'Cargo', position)}
            ${officer ? detailRow('Departamento', officer.departmentName ?? 'Sin asignar') : ''}
            ${officer ? detailRow('Indicativo', officer.callsign ?? '—') : ''}
            ${officer ? detailRow('Estado del personal', formatStaffStatus(officer.status)) : ''}
            ${!officer ? detailRow('Tipo', formatOccupationType(occupation?.type)) : ''}
          </dl>
        </article>
      </section>

      ${
        officer
          ? `
        <section class="surface-card p-6">
          <h3 class="text-sm font-semibold text-white">Condecoraciones</h3>
          <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            ${renderStaffDecorationsGrid(decorations, {
              emptyClass: 'sm:col-span-2 lg:col-span-3 xl:col-span-4',
            })}
          </div>
        </section>
        <section class="surface-card p-6">
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

function profileStat(label, value, iconName) {
  return `
    <article class="surface-card p-5">
      <div class="flex items-center gap-3">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-ink-300">
          ${icon(iconName, 'h-4 w-4')}
        </span>
        <div class="min-w-0">
          <p class="text-[11px] uppercase tracking-[0.16em] text-ink-500">${label}</p>
          <p class="mt-0.5 truncate text-sm font-semibold text-white">${escapeHtml(value)}</p>
        </div>
      </div>
    </article>
  `;
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
