import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initPasswordToggles, renderPasswordField } from '../components/auth/password-field.js';
import { renderSubmitButton, setButtonLoading } from '../components/auth/submit-button.js';
import { CIVILIAN_WORKPLACES, SAED_ORGANIZATION } from '../config/workplaces.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import {
  setIdentityActiveCharacter,
  setIdentityCharacters,
  setIdentityUser,
} from '../services/auth-state.store.js';
import { getAuthState } from '../services/auth-context.js';
import { changeMyPassword, updateMyUsername } from '../services/accounts.service.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  listCharacters,
  updateMyCharacter,
  uploadCharacterAvatar,
} from '../services/characters.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { validateImageUploadFile } from '../utils/image-upload.js';
import { PERMISSIONS } from '../utils/permissions.js';

export function settingsPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.SETTINGS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const { user, activeCharacter } = getAuthState();
  const isSaedMember = isSaedCharacter(activeCharacter);
  const currentOrg =
    activeCharacter.primaryOccupation?.organization ??
    activeCharacter.organization ??
    (isSaedMember ? SAED_ORGANIZATION : '');

  const content = `
    <div class="space-y-8">
      ${renderAuthAlert({ id: 'settings-alert' })}

      <section class="surface-card p-6 md:p-8">
        <p class="landing-eyebrow">Configuración</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-white">Preferencias</h2>
        <p class="mt-3 max-w-2xl text-sm leading-relaxed text-ink-300">
          Gestiona la seguridad de tu cuenta y la información del personaje activo.
        </p>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="surface-card p-6">
          <h3 class="text-sm font-semibold text-white">Cuenta</h3>
          <dl class="mt-4 space-y-3 text-sm">
            <div class="flex justify-between gap-4 border-b border-white/5 pb-3">
              <dt class="text-ink-400">Usuario</dt>
              <dd class="font-medium text-white">${escapeHtml(user?.username ?? '—')}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-ink-400">Nombre visible</dt>
              <dd class="font-medium text-white">${escapeHtml(user?.displayName ?? '—')}</dd>
            </div>
          </dl>
        </article>

        <article class="surface-card p-6">
          <h3 class="text-sm font-semibold text-white">Contexto activo</h3>
          <dl class="mt-4 space-y-3 text-sm">
            <div class="flex justify-between gap-4 border-b border-white/5 pb-3">
              <dt class="text-ink-400">Personaje</dt>
              <dd class="font-medium text-white">${escapeHtml(activeCharacter.firstName)} ${escapeHtml(activeCharacter.lastName)}</dd>
            </div>
            <div class="flex justify-between gap-4 border-b border-white/5 pb-3">
              <dt class="text-ink-400">Estado</dt>
              <dd class="font-medium text-white">${escapeHtml(formatStatus(activeCharacter.status))}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-ink-400">Tema</dt>
              <dd class="font-medium text-white">Oscuro</dd>
            </div>
          </dl>
        </article>
      </section>

      <section class="surface-card p-6 md:p-8">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-white">Seguridad de la Cuenta</h3>
          <p class="mt-2 text-sm text-ink-400">
            Actualiza las credenciales de tu cuenta autenticada. Estos cambios no afectan a otros usuarios.
          </p>
        </div>

        <div class="grid items-stretch gap-6 lg:grid-cols-2">
          <form id="settings-username-form" class="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6" novalidate>
            <h4 class="text-sm font-semibold text-white">Cambiar nombre de usuario</h4>
            <p class="mt-2 text-xs leading-relaxed text-ink-400">
              El nuevo usuario se normaliza en minúsculas y debe ser único en el sistema.
            </p>
            <div class="mt-5 space-y-4">
              <div>
                <label class="form-label" for="settings-current-username">Usuario actual</label>
                <input
                  id="settings-current-username"
                  class="form-input"
                  value="${escapeAttr(user?.username ?? '')}"
                  readonly
                  tabindex="-1"
                />
              </div>
              <div>
                <label class="form-label" for="settings-new-username">Nuevo nombre de usuario</label>
                <input
                  id="settings-new-username"
                  name="username"
                  class="form-input"
                  required
                  minlength="3"
                  maxlength="32"
                  autocomplete="username"
                  pattern="[A-Za-z0-9_]+"
                  placeholder="nuevo_usuario"
                />
                <p class="form-hint">3–32 caracteres · letras, números y guion bajo</p>
                <p id="settings-new-username-error" class="form-error hidden"></p>
              </div>
            </div>
            <div class="mt-auto pt-6">
              ${renderSubmitButton({
                id: 'settings-username-save',
                label: 'Guardar usuario',
                loadingLabel: 'Guardando...',
              })}
            </div>
          </form>

          <form id="settings-password-form" class="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6" novalidate>
            <h4 class="text-sm font-semibold text-white">Cambiar contraseña</h4>
            <p class="mt-2 text-xs leading-relaxed text-ink-400">
              Debes confirmar tu contraseña actual antes de establecer una nueva.
            </p>
            <div class="mt-5 space-y-4">
              ${renderPasswordField({
                id: 'settings-current-password',
                name: 'currentPassword',
                label: 'Contraseña actual',
                autocomplete: 'current-password',
              })}
              ${renderPasswordField({
                id: 'settings-new-password',
                name: 'newPassword',
                label: 'Nueva contraseña',
                autocomplete: 'new-password',
              })}
              ${renderPasswordField({
                id: 'settings-confirm-password',
                name: 'confirmPassword',
                label: 'Confirmar nueva contraseña',
                autocomplete: 'new-password',
              })}
              <p class="form-hint">Mínimo 8 caracteres. No puede coincidir con la actual.</p>
            </div>
            <div class="mt-auto pt-6">
              ${renderSubmitButton({
                id: 'settings-password-save',
                label: 'Guardar contraseña',
                loadingLabel: 'Guardando...',
              })}
            </div>
          </form>
        </div>
      </section>

      <section class="surface-card p-6 md:p-8">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-white">Mi personaje</h3>
          <p class="mt-2 text-sm text-ink-400">
            Los cambios se aplican únicamente al personaje activo.
            ${isSaedMember ? ' El establecimiento SAED no puede modificarse desde aquí.' : ''}
          </p>
        </div>

        <form id="my-character-form" class="space-y-6" novalidate>
          <div class="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div class="space-y-3">
              <div id="settings-avatar-preview" class="h-28 w-28 overflow-hidden rounded-2xl border border-white/10 bg-surface-950">
                ${
                  activeCharacter.avatarUrl
                    ? `<img src="${escapeHtml(activeCharacter.avatarUrl)}" alt="" class="h-full w-full object-cover" />`
                    : `<div class="flex h-full items-center justify-center text-sm text-ink-500">Sin foto</div>`
                }
              </div>
              <div>
                <label class="form-label" for="settings-avatar">Fotografía</label>
                <input
                  id="settings-avatar"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  class="form-input file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500/20 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-300"
                />
                <p class="form-hint mt-2">JPG, PNG o WebP · máximo 8 MB</p>
              </div>
            </div>

            <div class="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="form-label" for="settings-first-name">Nombre</label>
                <input id="settings-first-name" class="form-input" required maxlength="50" value="${escapeAttr(activeCharacter.firstName)}" />
              </div>
              <div>
                <label class="form-label" for="settings-last-name">Apellidos</label>
                <input id="settings-last-name" class="form-input" required maxlength="50" value="${escapeAttr(activeCharacter.lastName)}" />
              </div>
              <div>
                <label class="form-label" for="settings-birth-date">Fecha de nacimiento</label>
                <input id="settings-birth-date" type="date" class="form-input" value="${escapeAttr(toDateInput(activeCharacter.birthDate))}" />
              </div>
              <div>
                <label class="form-label" for="settings-sex">Sexo</label>
                <select id="settings-sex" class="form-input">
                  <option value="">—</option>
                  <option value="MALE" ${activeCharacter.sex === 'MALE' ? 'selected' : ''}>Masculino</option>
                  <option value="FEMALE" ${activeCharacter.sex === 'FEMALE' ? 'selected' : ''}>Femenino</option>
                  <option value="OTHER" ${activeCharacter.sex === 'OTHER' ? 'selected' : ''}>Otro</option>
                </select>
              </div>
              <div>
                <label class="form-label" for="settings-nationality">Nacionalidad</label>
                <input id="settings-nationality" class="form-input" maxlength="80" value="${escapeAttr(activeCharacter.nationality ?? '')}" />
              </div>
              <div>
                <label class="form-label" for="settings-phone">Teléfono</label>
                <input id="settings-phone" class="form-input" maxlength="40" value="${escapeAttr(activeCharacter.phone ?? '')}" placeholder="Opcional" />
              </div>
            </div>
          </div>

          <div>
            <label class="form-label" for="settings-biography">Biografía</label>
            <textarea id="settings-biography" class="form-input min-h-[96px]" maxlength="2000" placeholder="Breve descripción del personaje (opcional)">${escapeHtml(activeCharacter.biography ?? '')}</textarea>
          </div>

          <div>
            <label class="form-label" for="settings-organization">Establecimiento / empleo</label>
            ${
              isSaedMember
                ? `
              <input id="settings-organization" class="form-input" value="${escapeAttr(SAED_ORGANIZATION)}" disabled />
              <p class="form-hint mt-2">Los miembros del SAED no pueden cambiar su establecimiento.</p>
            `
                : `
              <select id="settings-organization" class="form-input">
                ${CIVILIAN_WORKPLACES.map(
                  (item) =>
                    `<option value="${escapeAttr(item.name)}" ${currentOrg === item.name ? 'selected' : ''}>${escapeHtml(item.name)}</option>`,
                ).join('')}
              </select>
            `
            }
          </div>

          <div class="pt-2">
            ${renderSubmitButton({
              id: 'settings-save',
              label: 'Guardar cambios',
              loadingLabel: 'Guardando...',
            })}
          </div>
        </form>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, { title: 'Configuración', currentPath: '/settings' }),
    afterMount(root) {
      document.title = 'Configuración · SAED';
      const cleanup = initDashboardLayout(root);
      initPasswordToggles(root);
      const form = root.querySelector('#my-character-form');
      const usernameForm = root.querySelector('#settings-username-form');
      const passwordForm = root.querySelector('#settings-password-form');
      const submitButton = root.querySelector('#settings-save');
      const usernameSaveButton = root.querySelector('#settings-username-save');
      const passwordSaveButton = root.querySelector('#settings-password-save');
      const avatarInput = root.querySelector('#settings-avatar');
      const previewHost = root.querySelector('#settings-avatar-preview');
      let pendingAvatarFile = null;
      let previewObjectUrl = null;

      const setFieldError = (id, message = '') => {
        const error = root.querySelector(`#${id}-error`);
        const input = root.querySelector(`#${id}`);
        if (error) {
          error.textContent = message;
          error.classList.toggle('hidden', !message);
        }
        input?.classList.toggle('form-input-error', Boolean(message));
      };

      const paintPreview = (url) => {
        if (!previewHost) return;
        if (!url) {
          previewHost.innerHTML = `<div class="flex h-full items-center justify-center text-sm text-ink-500">Sin foto</div>`;
          return;
        }
        previewHost.innerHTML = `<img src="${escapeHtml(url)}" alt="" class="h-full w-full object-cover" />`;
      };

      const refreshIdentity = async (preferred) => {
        const characters = await listCharacters();
        setIdentityCharacters(characters);
        const { activeCharacter: current } = getAuthState();
        const updated =
          preferred ??
          characters.find((item) => item.id === current?.id) ??
          characters[0] ??
          null;
        if (updated) {
          setIdentityActiveCharacter(updated);
          paintPreview(updated.avatarUrl);
        }
        return updated;
      };

      const onAvatarChange = () => {
        const file = avatarInput?.files?.[0] ?? null;
        if (previewObjectUrl) {
          URL.revokeObjectURL(previewObjectUrl);
          previewObjectUrl = null;
        }
        pendingAvatarFile = null;
        if (!file) return;

        const validation = validateImageUploadFile(file, { required: true });
        if (!validation.ok) {
          avatarInput.value = '';
          setAuthAlert(root, {
            id: 'settings-alert',
            type: 'error',
            message: validation.message,
          });
          return;
        }

        pendingAvatarFile = validation.file;
        previewObjectUrl = URL.createObjectURL(pendingAvatarFile);
        paintPreview(previewObjectUrl);
        setAuthAlert(root, { id: 'settings-alert', message: '' });
      };

      const onSubmit = async (event) => {
        event.preventDefault();
        setAuthAlert(root, { id: 'settings-alert', message: '' });

        const firstName = root.querySelector('#settings-first-name')?.value.trim() ?? '';
        const lastName = root.querySelector('#settings-last-name')?.value.trim() ?? '';
        const birthDate = root.querySelector('#settings-birth-date')?.value || null;
        const sex = root.querySelector('#settings-sex')?.value || undefined;
        const nationality = root.querySelector('#settings-nationality')?.value.trim() ?? '';
        const phone = root.querySelector('#settings-phone')?.value.trim() ?? '';
        const biography = root.querySelector('#settings-biography')?.value.trim() ?? '';
        const organizationSelect = root.querySelector('#settings-organization');

        if (firstName.length < 2 || lastName.length < 2) {
          setAuthAlert(root, {
            id: 'settings-alert',
            type: 'error',
            message: 'Nombre y apellidos deben tener al menos 2 caracteres.',
          });
          return;
        }

        setButtonLoading(submitButton, true);
        try {
          const { activeCharacter: current } = getAuthState();
          const payload = {
            firstName,
            lastName,
            birthDate,
            sex: sex || undefined,
            nationality: nationality || null,
            phone: phone || null,
            biography: biography || null,
          };

          if (!isSaedCharacter(current) && organizationSelect && !organizationSelect.disabled) {
            payload.organization = organizationSelect.value;
          }

          let updated = await updateMyCharacter(payload);

          if (pendingAvatarFile) {
            updated = await uploadCharacterAvatar(current.id, pendingAvatarFile);
            pendingAvatarFile = null;
            if (avatarInput) avatarInput.value = '';
            if (previewObjectUrl) {
              URL.revokeObjectURL(previewObjectUrl);
              previewObjectUrl = null;
            }
          }

          await refreshIdentity(updated);
          setAuthAlert(root, {
            id: 'settings-alert',
            type: 'success',
            message: 'Perfil del personaje actualizado.',
          });
        } catch (error) {
          setAuthAlert(root, {
            id: 'settings-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo guardar el perfil.'),
          });
        } finally {
          setButtonLoading(submitButton, false);
        }
      };

      avatarInput?.addEventListener('change', onAvatarChange);
      form?.addEventListener('submit', onSubmit);

      const onUsernameSubmit = async (event) => {
        event.preventDefault();
        setFieldError('settings-new-username');
        setAuthAlert(root, { id: 'settings-alert', message: '' });

        const username = root.querySelector('#settings-new-username')?.value.trim() ?? '';
        if (!username || username.length < 3) {
          setFieldError('settings-new-username', 'El usuario debe tener al menos 3 caracteres.');
          return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          setFieldError('settings-new-username', 'Solo letras, números y guion bajo.');
          return;
        }

        setButtonLoading(usernameSaveButton, true);
        try {
          const updated = await updateMyUsername(username);
          const { user: currentUser } = getAuthState();
          setIdentityUser({
            ...currentUser,
            username: updated.username,
            displayName: updated.displayName ?? currentUser?.displayName,
          });
          const currentUsernameInput = root.querySelector('#settings-current-username');
          if (currentUsernameInput) {
            currentUsernameInput.value = updated.username;
          }
          usernameForm?.reset();
          if (currentUsernameInput) {
            currentUsernameInput.value = updated.username;
          }
          const accountUsernameDd = [...root.querySelectorAll('dt')]
            .find((item) => item.textContent?.trim() === 'Usuario')
            ?.parentElement?.querySelector('dd');
          if (accountUsernameDd) {
            accountUsernameDd.textContent = updated.username;
          }
          const accountDisplayDd = [...root.querySelectorAll('dt')]
            .find((item) => item.textContent?.trim() === 'Nombre visible')
            ?.parentElement?.querySelector('dd');
          if (accountDisplayDd && updated.displayName) {
            accountDisplayDd.textContent = updated.displayName;
          }
          setAuthAlert(root, {
            id: 'settings-alert',
            type: 'success',
            message: 'Nombre de usuario actualizado.',
          });
        } catch (error) {
          setAuthAlert(root, {
            id: 'settings-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo actualizar el usuario.'),
          });
        } finally {
          setButtonLoading(usernameSaveButton, false);
        }
      };

      const onPasswordSubmit = async (event) => {
        event.preventDefault();
        setFieldError('settings-current-password');
        setFieldError('settings-new-password');
        setFieldError('settings-confirm-password');
        setAuthAlert(root, { id: 'settings-alert', message: '' });

        const currentPassword = root.querySelector('#settings-current-password')?.value ?? '';
        const newPassword = root.querySelector('#settings-new-password')?.value ?? '';
        const confirmPassword = root.querySelector('#settings-confirm-password')?.value ?? '';

        let hasError = false;
        if (!currentPassword) {
          setFieldError('settings-current-password', 'Introduce tu contraseña actual.');
          hasError = true;
        }
        if (!newPassword || newPassword.length < 8) {
          setFieldError('settings-new-password', 'Mínimo 8 caracteres.');
          hasError = true;
        }
        if (newPassword !== confirmPassword) {
          setFieldError('settings-confirm-password', 'Las contraseñas no coinciden.');
          hasError = true;
        }
        if (newPassword && currentPassword && newPassword === currentPassword) {
          setFieldError(
            'settings-new-password',
            'La nueva contraseña no puede ser igual a la actual.',
          );
          hasError = true;
        }
        if (hasError) {
          return;
        }

        setButtonLoading(passwordSaveButton, true);
        try {
          await changeMyPassword({ currentPassword, newPassword });
          passwordForm?.reset();
          setAuthAlert(root, {
            id: 'settings-alert',
            type: 'success',
            message: 'Contraseña actualizada.',
          });
        } catch (error) {
          setAuthAlert(root, {
            id: 'settings-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo actualizar la contraseña.'),
          });
        } finally {
          setButtonLoading(passwordSaveButton, false);
        }
      };

      usernameForm?.addEventListener('submit', onUsernameSubmit);
      passwordForm?.addEventListener('submit', onPasswordSubmit);

      return () => {
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        avatarInput?.removeEventListener('change', onAvatarChange);
        form?.removeEventListener('submit', onSubmit);
        usernameForm?.removeEventListener('submit', onUsernameSubmit);
        passwordForm?.removeEventListener('submit', onPasswordSubmit);
        cleanup?.();
      };
    },
  };
}

function isSaedCharacter(character) {
  if (!character) return false;
  if (character.staffProfile) return true;
  if (character.status === 'MEDICAL_STAFF' || character.status === 'INTERN') return true;
  const org =
    character.primaryOccupation?.organization ?? character.organization ?? '';
  return String(org).toLowerCase() === SAED_ORGANIZATION.toLowerCase();
}

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
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

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", '&#39;');
}
