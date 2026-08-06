import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initAuthMotion } from '../components/auth/auth-motion.js';
import { renderSelectField } from '../components/auth/select-field.js';
import { renderSubmitButton, setButtonLoading } from '../components/auth/submit-button.js';
import { renderTextField, setFieldError } from '../components/auth/text-field.js';
import { MAX_CHARACTERS_PER_ACCOUNT } from '../config/characters.js';
import { renderAuthLayout } from '../layouts/auth.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listWorkplaces } from '../services/characters.service.js';
import { createCharacterRecord, getCurrentCharacters } from '../services/identity.service.js';
import { requireAuth } from '../utils/auth-guard.js';
import { validateImageUploadFile } from '../utils/image-upload.js';
import { navigate } from '../utils/router.js';

export function createCharacterPage() {
  if (!requireAuth()) {
    return { html: '', afterMount: () => {} };
  }

  const existingCount = getCurrentCharacters().length;
  if (existingCount >= MAX_CHARACTERS_PER_ACCOUNT) {
    return {
      html: '',
      afterMount() {
        void navigate('/characters/select', { replace: true });
      },
    };
  }

  const hasCharacters = existingCount > 0;

  const content = `
    <div class="mx-auto w-full max-w-2xl" data-reveal>
      <div class="panel overflow-hidden p-7 sm:p-9">
        <div class="mb-8">
          <p class="landing-eyebrow">Identidad</p>
          <h1 class="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Crear personaje</h1>
          <p class="mt-3 text-sm leading-relaxed text-ink-300">
            Define tu identidad dentro del servidor. El estado inicial será <span class="text-sky-300">Civil</span>.
          </p>
        </div>

        <div class="mb-5">${renderAuthAlert({ id: 'character-alert' })}</div>

        <form id="create-character-form" class="space-y-5" novalidate>
          <div class="grid gap-5 sm:grid-cols-2">
            ${renderTextField({
              id: 'first-name',
              name: 'firstName',
              label: 'Nombre',
              placeholder: 'John',
              autocomplete: 'given-name',
              required: true,
            })}
            ${renderTextField({
              id: 'last-name',
              name: 'lastName',
              label: 'Apellido',
              placeholder: 'Miller',
              autocomplete: 'family-name',
              required: true,
            })}
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label class="form-label" for="birth-date">Fecha de nacimiento</label>
              <input id="birth-date" name="birthDate" type="date" class="form-input" required />
              <p id="birth-date-error" class="form-error hidden"></p>
            </div>
            ${renderSelectField({
              id: 'sex',
              name: 'sex',
              label: 'Sexo',
              required: true,
              options: [
                { value: 'MALE', label: 'Masculino' },
                { value: 'FEMALE', label: 'Femenino' },
                { value: 'OTHER', label: 'Otro' },
              ],
            })}
          </div>

          ${renderTextField({
            id: 'nationality',
            name: 'nationality',
            label: 'Nacionalidad',
            placeholder: 'Estadounidense',
            required: true,
          })}

          ${renderSelectField({
            id: 'organization',
            name: 'organization',
            label: 'Trabajo / organización',
            required: true,
            options: [{ value: '', label: 'Cargando establecimientos…' }],
          })}
          <p class="form-hint -mt-3">SAED no está disponible aquí. Solo se asigna al ser incorporado a personal médico.</p>

          <div>
            <label class="form-label" for="avatar">Imagen / avatar (opcional)</label>
            <input id="avatar" name="avatar" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" class="form-input file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500/20 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-300" />
            <p class="form-hint">JPG, PNG o WebP · máximo 8 MB. La imagen se adapta con object-fit cover.</p>
            <div id="avatar-preview" class="mt-4 hidden h-40 w-full overflow-hidden rounded-2xl border border-white/10">
              <img alt="Vista previa del avatar" class="h-full w-full object-cover object-center" />
            </div>
          </div>

          <div class="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink-300">
            Estado inicial: <span class="font-semibold text-sky-300">CIVIL</span>
          </div>

          ${renderSubmitButton({
            id: 'create-character-submit',
            label: 'Crear personaje',
            loadingLabel: 'Guardando...',
          })}
        </form>

        ${
          hasCharacters
            ? `<p class="mt-6 text-center text-sm text-ink-400"><a data-link href="/characters/select" class="font-semibold text-brand-300 hover:text-brand-200">Volver al selector</a></p>`
            : ''
        }
      </div>
    </div>
  `;

  return {
    html: renderAuthLayout(content),
    afterMount(root) {
      document.title = 'Crear personaje · SAED';
      const form = root.querySelector('#create-character-form');
      const submitButton = root.querySelector('#create-character-submit');
      const avatarInput = root.querySelector('#avatar');
      const previewHost = root.querySelector('#avatar-preview');
      const previewImage = previewHost?.querySelector('img');
      let avatarFile = null;
      let previewObjectUrl = null;
      let workplaces = [];

      const cleanups = [initAuthMotion(root)];

      const loadWorkplaces = async () => {
        const select = root.querySelector('#organization');
        if (!select) return;
        try {
          const catalog = await listWorkplaces();
          workplaces = catalog.civilian ?? [];
          select.innerHTML = workplaces.length
            ? workplaces
                .map(
                  (item) =>
                    `<option value="${item.name}">${item.name}</option>`,
                )
                .join('')
            : `<option value="">No hay establecimientos disponibles</option>`;
        } catch (error) {
          select.innerHTML = `<option value="">Error al cargar establecimientos</option>`;
          setAuthAlert(root, {
            id: 'character-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo cargar el catálogo de establecimientos.'),
          });
        }
      };

      void loadWorkplaces();

      const clearPreview = () => {
        if (previewObjectUrl) {
          URL.revokeObjectURL(previewObjectUrl);
          previewObjectUrl = null;
        }
        avatarFile = null;
        previewHost?.classList.add('hidden');
        if (previewImage) previewImage.removeAttribute('src');
      };

      const onAvatarChange = () => {
        const file = avatarInput?.files?.[0] ?? null;
        clearPreview();
        if (!file) return;

        const validation = validateImageUploadFile(file);
        if (!validation.ok) {
          setAuthAlert(root, {
            id: 'character-alert',
            type: 'error',
            message: validation.message,
          });
          avatarInput.value = '';
          return;
        }

        avatarFile = validation.file;
        previewObjectUrl = URL.createObjectURL(avatarFile);
        if (previewImage) {
          previewImage.src = previewObjectUrl;
        }
        previewHost?.classList.remove('hidden');
        setAuthAlert(root, { id: 'character-alert', message: '' });
      };

      const onSubmit = async (event) => {
        event.preventDefault();
        ['first-name', 'last-name', 'birth-date', 'sex', 'nationality', 'organization'].forEach(
          (id) => setFieldError(root, id),
        );
        setAuthAlert(root, { id: 'character-alert', message: '' });

        const firstName = form.firstName.value.trim();
        const lastName = form.lastName.value.trim();
        const birthDate = form.birthDate.value;
        const sex = form.sex.value;
        const nationality = form.nationality.value.trim();
        const organization = form.organization.value;
        const workplace = workplaces.find((item) => item.name === organization);
        let hasError = false;

        if (firstName.length < 2) {
          setFieldError(root, 'first-name', 'Introduce un nombre válido.');
          hasError = true;
        }
        if (lastName.length < 2) {
          setFieldError(root, 'last-name', 'Introduce un apellido válido.');
          hasError = true;
        }
        if (!birthDate) {
          setFieldError(root, 'birth-date', 'Selecciona la fecha de nacimiento.');
          hasError = true;
        }
        if (!sex) {
          setFieldError(root, 'sex', 'Selecciona una opción.');
          hasError = true;
        }
        if (nationality.length < 2) {
          setFieldError(root, 'nationality', 'Introduce la nacionalidad.');
          hasError = true;
        }
        if (!workplace) {
          setFieldError(root, 'organization', 'Selecciona un trabajo válido.');
          hasError = true;
        }

        if (hasError) {
          setAuthAlert(root, {
            id: 'character-alert',
            type: 'error',
            message: 'Revisa los campos marcados.',
          });
          return;
        }

        setButtonLoading(submitButton, true);

        try {
          await createCharacterRecord({
            firstName,
            lastName,
            birthDate,
            sex,
            nationality,
            organization: workplace.name,
            position: workplace.defaultPosition,
            avatarFile,
          });
          void navigate('/characters/select', { replace: true });
        } catch (error) {
          setAuthAlert(root, {
            id: 'character-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo crear el personaje.'),
          });
        } finally {
          setButtonLoading(submitButton, false);
        }
      };

      avatarInput?.addEventListener('change', onAvatarChange);
      form?.addEventListener('submit', onSubmit);
      cleanups.push(() => {
        clearPreview();
        avatarInput?.removeEventListener('change', onAvatarChange);
        form?.removeEventListener('submit', onSubmit);
      });

      return () => cleanups.forEach((fn) => fn?.());
    },
  };
}
