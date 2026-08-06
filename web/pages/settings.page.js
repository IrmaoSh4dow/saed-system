import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initPasswordToggles, renderPasswordField } from '../components/auth/password-field.js';
import { renderSubmitButton, setButtonLoading } from '../components/auth/submit-button.js';
import {
  bindAppModal,
  closeAppModal,
  openAppModal,
  renderAppModal,
  setAppModalContent,
} from '../components/ui/modal.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { renderSummaryStrip } from '../components/ui/summary-strip.js';
import { SAED_ORGANIZATION } from '../config/workplaces.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import {
  setIdentityActiveCharacter,
  setIdentityCharacters,
  setIdentityUser,
} from '../services/auth-state.store.js';
import { can, getAuthState } from '../services/auth-context.js';
import { changeMyPassword, updateMyUsername } from '../services/accounts.service.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  listCharacters,
  listWorkplaces,
  updateMyCharacter,
  uploadCharacterAvatar,
} from '../services/characters.service.js';
import {
  cancelEmploymentChangeRequest,
  createEmploymentChangeRequest,
  EMPLOYMENT_CHANGE_STATUS_LABELS,
  listMyEmploymentChangeRequests,
} from '../services/employment-change.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { isSaedMember as checkIsSaedMember } from '../utils/character.js';
import { formatDateTimeLabel } from '../utils/date.js';
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
  const isSaedMember = checkIsSaedMember(activeCharacter);
  const currentOrg =
    activeCharacter.primaryOccupation?.organization ??
    activeCharacter.organization ??
    (isSaedMember ? SAED_ORGANIZATION : '');

  const content = `
    <div class="space-y-8">
      ${renderAuthAlert({ id: 'settings-alert' })}
      ${renderPageHeader({
        eyebrow: 'Preferencias',
        title: 'Configuración',
        description:
          'Seguridad de la cuenta, identidad activa y datos del personaje seleccionado.',
      })}

      ${renderSummaryStrip([
        { label: 'Usuario', value: escapeHtml(user?.username ?? '—'), tone: 'brand' },
        {
          label: 'Personaje',
          value: escapeHtml(`${activeCharacter.firstName} ${activeCharacter.lastName}`),
        },
        { label: 'Organización', value: escapeHtml(currentOrg || '—') },
        { label: 'Tema', value: 'Oscuro' },
      ])}

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="panel p-6">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">Cuenta</p>
          <h3 class="mt-1 text-sm font-semibold text-white">Credenciales e identidad</h3>
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

        <article class="panel p-6">
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

      <section class="panel p-6 md:p-8">
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

      <section class="panel p-6 md:p-8">
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

          <div class="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-[11px] uppercase tracking-wide text-ink-500">Establecimiento / empleo actual</p>
                <p class="mt-1 text-base font-semibold text-white">${escapeHtml(currentOrg || 'Sin empleo')}</p>
                <p class="mt-1 text-xs text-ink-500">
                  ${
                    isSaedMember
                      ? 'Los miembros del SAED no pueden solicitar cambios de empleo civil.'
                      : 'Los cambios de empleo requieren aprobación del Alto Mando del SAED.'
                  }
                </p>
              </div>
              ${
                !isSaedMember && can(PERMISSIONS.EMPLOYMENT_CHANGE_CREATE)
                  ? `<button type="button" id="request-employment-change" class="btn-primary">Solicitar cambio de empleo</button>`
                  : ''
              }
            </div>
            <div id="employment-change-history" class="mt-4 space-y-2">
              <p class="text-xs text-ink-500">Cargando solicitudes…</p>
            </div>
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
      ${renderAppModal({
        id: 'employment-change-modal',
        title: 'Solicitar cambio de empleo',
        size: 'md',
        bodyHtml: '<p class="text-sm text-ink-400">Cargando…</p>',
      })}
    </div>
  `;

  return {
    html: renderDashboardLayout(content, { title: 'Configuración', currentPath: '/settings' }),
    afterMount(root) {
      document.title = 'Configuración · SAED';
      const cleanupLayout = initDashboardLayout(root);
      const cleanupModal = bindAppModal(root, { modalId: 'employment-change-modal' });

      const paintEmploymentHistory = async () => {
        const host = root.querySelector('#employment-change-history');
        if (!host || isSaedMember || !can(PERMISSIONS.EMPLOYMENT_CHANGE_READ)) {
          if (host) host.innerHTML = '';
          return;
        }
        try {
          const requests = await listMyEmploymentChangeRequests();
          if (!requests.length) {
            host.innerHTML = `<p class="text-xs text-ink-500">No hay solicitudes de cambio de empleo.</p>`;
            return;
          }
          host.innerHTML = `
            <p class="text-[11px] uppercase tracking-wide text-ink-500">Historial de solicitudes</p>
            <div class="mt-2 space-y-2">
              ${requests
                .map((item) => {
                  const open = item.status === 'PENDING' || item.status === 'UNDER_REVIEW';
                  return `
                    <div class="rounded-xl border border-white/10 px-3 py-2.5">
                      <div class="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p class="text-sm text-white">
                            ${escapeHtml(item.currentOrganizationName || 'Sin empleo')}
                            → ${escapeHtml(item.requestedOrganizationName)}
                          </p>
                          <p class="mt-1 text-[11px] text-ink-500">
                            ${escapeHtml(EMPLOYMENT_CHANGE_STATUS_LABELS[item.status] || item.status)}
                            · ${escapeHtml(formatDateTimeLabel(item.createdAt))}
                          </p>
                          ${
                            item.rejectionReason
                              ? `<p class="mt-1 text-xs text-rose-300">Motivo del rechazo: ${escapeHtml(item.rejectionReason)}</p>`
                              : ''
                          }
                        </div>
                        ${
                          open
                            ? `<button type="button" class="text-xs text-rose-300 hover:text-rose-200" data-cancel-employment="${item.id}">Cancelar</button>`
                            : ''
                        }
                      </div>
                    </div>
                  `;
                })
                .join('')}
            </div>
          `;
          host.querySelectorAll('[data-cancel-employment]').forEach((button) => {
            button.addEventListener('click', async () => {
              try {
                await cancelEmploymentChangeRequest(button.getAttribute('data-cancel-employment'));
                setAuthAlert(root, {
                  id: 'settings-alert',
                  type: 'success',
                  message: 'Solicitud cancelada.',
                });
                void paintEmploymentHistory();
              } catch (error) {
                setAuthAlert(root, {
                  id: 'settings-alert',
                  type: 'error',
                  message: getApiErrorMessage(error),
                });
              }
            });
          });
        } catch (error) {
          host.innerHTML = `<p class="text-xs text-rose-300">${escapeHtml(getApiErrorMessage(error))}</p>`;
        }
      };

      root.querySelector('#request-employment-change')?.addEventListener('click', async () => {
        setAppModalContent(root, {
          modalId: 'employment-change-modal',
          title: 'Solicitar cambio de empleo',
          bodyHtml: `<p class="text-sm text-ink-400">Cargando establecimientos…</p>`,
          footerHtml: `<button type="button" class="btn-secondary" data-modal-close>Cancelar</button>`,
        });
        openAppModal(root, 'employment-change-modal');
        try {
          const catalog = await listWorkplaces();
          const workplaces = catalog.civilian ?? [];
          setAppModalContent(root, {
            modalId: 'employment-change-modal',
            bodyHtml: `
              <form id="employment-change-form" class="space-y-4">
                <p class="text-sm text-ink-300">
                  Organización actual:
                  <span class="font-medium text-white">${escapeHtml(currentOrg || 'Sin empleo')}</span>
                </p>
                <div>
                  <label class="form-label" for="employment-target">Nueva organización</label>
                  <select id="employment-target" class="form-input" required>
                    <option value="">Seleccionar…</option>
                    ${workplaces
                      .map(
                        (item) =>
                          `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)}</option>`,
                      )
                      .join('')}
                  </select>
                </div>
                <div>
                  <label class="form-label" for="employment-reason">Motivo del cambio</label>
                  <textarea id="employment-reason" class="form-input min-h-28" required minlength="8" maxlength="1000"
                    placeholder="Explica el motivo institucional del cambio…"></textarea>
                </div>
              </form>
            `,
            footerHtml: `
              <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
              <button type="submit" form="employment-change-form" class="btn-primary">Enviar solicitud</button>
            `,
          });
          root.querySelector('#employment-change-form')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
              await createEmploymentChangeRequest({
                requestedEstablishmentId: root.querySelector('#employment-target').value,
                reason: root.querySelector('#employment-reason').value.trim(),
              });
              closeAppModal(root, 'employment-change-modal');
              setAuthAlert(root, {
                id: 'settings-alert',
                type: 'success',
                message: 'Solicitud enviada. El Alto Mando la revisará.',
              });
              void paintEmploymentHistory();
            } catch (error) {
              setAuthAlert(root, {
                id: 'settings-alert',
                type: 'error',
                message: getApiErrorMessage(error),
              });
            }
          });
        } catch (error) {
          setAppModalContent(root, {
            modalId: 'employment-change-modal',
            bodyHtml: `<p class="text-sm text-rose-300">${escapeHtml(getApiErrorMessage(error))}</p>`,
          });
        }
      });

      void paintEmploymentHistory();
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
        cleanupModal?.();
        cleanupLayout?.();
      };
    },
  };
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
