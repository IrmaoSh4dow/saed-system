import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initPasswordToggles, renderPasswordField } from '../components/auth/password-field.js';
import { renderSubmitButton, setButtonLoading } from '../components/auth/submit-button.js';
import { renderTextField, setFieldError } from '../components/auth/text-field.js';
import { icon } from '../components/landing/icons.js';
import { renderAuthLayout } from '../layouts/auth.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { loginWithPassword } from '../services/identity.service.js';
import { requireGuest } from '../utils/auth-guard.js';
import { navigate } from '../utils/router.js';
import { initScrollReveal } from '../utils/scroll-reveal.js';

const REMEMBER_KEY = 'saed.rememberSession';

export function loginPage() {
  if (!requireGuest()) {
    return { html: '', afterMount: () => {} };
  }

  const remembered = localStorage.getItem(REMEMBER_KEY) === 'true';

  const content = `
    <div class="mx-auto w-full max-w-[420px]" data-reveal>
      <div class="surface-card overflow-hidden p-7 sm:p-9">
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-500/30 bg-brand-500/10 text-brand-300">
            ${icon('shield', 'h-5 w-5')}
          </div>
          <h1 class="text-2xl font-semibold tracking-tight text-white">Iniciar sesión</h1>
          <p class="mt-2 text-sm leading-relaxed text-ink-300">
            Accede al sistema oficial del San Andreas Emergency Department.
          </p>
        </div>

        <div class="mb-5">${renderAuthAlert({ id: 'login-alert' })}</div>

        <form id="login-form" class="space-y-5" novalidate>
          ${renderTextField({
            id: 'identifier',
            name: 'identifier',
            label: 'Usuario',
            placeholder: 'medic01',
            autocomplete: 'username',
            required: true,
          })}
          ${renderPasswordField({
            id: 'password',
            name: 'password',
            label: 'Contraseña',
            autocomplete: 'current-password',
          })}
          <div class="flex items-center justify-between gap-3">
            <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-300">
              <input id="remember-session" name="remember" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-surface-950 text-brand-500 focus:ring-brand-500/40" ${remembered ? 'checked' : ''} />
              Recordar sesión
            </label>
            <a data-link href="/auth/forgot-password" class="text-sm font-medium text-brand-300 hover:text-brand-200">¿Olvidaste tu contraseña?</a>
          </div>
          ${renderSubmitButton({
            id: 'login-submit',
            label: 'Iniciar sesión',
            loadingLabel: 'Verificando...',
          })}
        </form>

        <p class="mt-7 text-center text-sm text-ink-400">
          ¿No tienes cuenta?
          <a data-link href="/auth/register" class="font-semibold text-brand-300 hover:text-brand-200">Crear cuenta</a>
        </p>
      </div>
      <p class="mt-6 text-center text-xs text-ink-500">
        <a data-link href="/" class="transition hover:text-ink-300">Volver a la Landing</a>
      </p>
    </div>
  `;

  return {
    html: renderAuthLayout(content),
    afterMount(root) {
      document.title = 'Iniciar sesión · SAED';
      const form = root.querySelector('#login-form');
      const submitButton = root.querySelector('#login-submit');
      const rememberCheckbox = root.querySelector('#remember-session');
      const cleanups = [initScrollReveal(root), initPasswordToggles(root)];
      root.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));

      const onRememberChange = () => {
        localStorage.setItem(REMEMBER_KEY, rememberCheckbox?.checked ? 'true' : 'false');
      };

      const onSubmit = async (event) => {
        event.preventDefault();
        setFieldError(root, 'identifier');
        setFieldError(root, 'password');
        setAuthAlert(root, { id: 'login-alert', message: '' });

        const identifier = form.identifier.value.trim();
        const password = form.password.value;
        let hasError = false;

        if (!identifier) {
          setFieldError(root, 'identifier', 'Introduce tu usuario.');
          hasError = true;
        }

        if (!password) {
          setFieldError(root, 'password', 'Introduce tu contraseña.');
          hasError = true;
        }

        if (hasError) {
          setAuthAlert(root, {
            id: 'login-alert',
            type: 'error',
            message: 'Revisa los campos marcados e inténtalo de nuevo.',
          });
          return;
        }

        onRememberChange();
        setButtonLoading(submitButton, true);

        try {
          const result = await loginWithPassword({ identifier, password });
          setAuthAlert(root, {
            id: 'login-alert',
            type: 'success',
            message: 'Sesión iniciada. Continuando...',
          });
          await wait(250);
          void navigate(result.path, { replace: true });
        } catch (error) {
          setAuthAlert(root, {
            id: 'login-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo iniciar sesión.'),
          });
        } finally {
          setButtonLoading(submitButton, false);
        }
      };

      rememberCheckbox?.addEventListener('change', onRememberChange);
      form?.addEventListener('submit', onSubmit);
      cleanups.push(() => {
        rememberCheckbox?.removeEventListener('change', onRememberChange);
        form?.removeEventListener('submit', onSubmit);
      });

      return () => cleanups.forEach((fn) => fn?.());
    },
  };
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
