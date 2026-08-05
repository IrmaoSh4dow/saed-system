import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initPasswordToggles, renderPasswordField } from '../components/auth/password-field.js';
import { renderSubmitButton, setButtonLoading } from '../components/auth/submit-button.js';
import { renderTextField, setFieldError } from '../components/auth/text-field.js';
import { icon } from '../components/landing/icons.js';
import { renderAuthLayout } from '../layouts/auth.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { registerAccount } from '../services/identity.service.js';
import { requireGuest } from '../utils/auth-guard.js';
import { navigate } from '../utils/router.js';
import { initScrollReveal } from '../utils/scroll-reveal.js';

export function registerPage() {
  if (!requireGuest()) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="mx-auto w-full max-w-[420px]" data-reveal>
      <div class="surface-card overflow-hidden p-7 sm:p-9">
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-500/30 bg-brand-500/10 text-brand-300">
            ${icon('users', 'h-5 w-5')}
          </div>
          <h1 class="text-2xl font-semibold tracking-tight text-white">Crear cuenta</h1>
          <p class="mt-2 text-sm leading-relaxed text-ink-300">
            Regístrate para gestionar tus personajes y acceder al sistema.
          </p>
        </div>

        <div class="mb-5">${renderAuthAlert({ id: 'register-alert' })}</div>

        <form id="register-form" class="space-y-5" novalidate>
          ${renderTextField({
            id: 'register-username',
            name: 'username',
            label: 'Usuario',
            placeholder: 'medic01',
            autocomplete: 'username',
            required: true,
          })}
          ${renderPasswordField({
            id: 'register-password',
            name: 'password',
            label: 'Contraseña',
            autocomplete: 'new-password',
          })}
          ${renderPasswordField({
            id: 'register-confirm',
            name: 'confirmPassword',
            label: 'Confirmar contraseña',
            autocomplete: 'new-password',
          })}
          ${renderSubmitButton({
            id: 'register-submit',
            label: 'Crear cuenta',
            loadingLabel: 'Creando cuenta...',
          })}
        </form>

        <p class="mt-7 text-center text-sm text-ink-400">
          ¿Ya tienes cuenta?
          <a data-link href="/auth/login" class="font-semibold text-brand-300 hover:text-brand-200">Iniciar sesión</a>
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
      document.title = 'Crear cuenta · SAED';
      const form = root.querySelector('#register-form');
      const submitButton = root.querySelector('#register-submit');
      const cleanups = [initScrollReveal(root), initPasswordToggles(root)];
      root.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));

      const onSubmit = async (event) => {
        event.preventDefault();
        setFieldError(root, 'register-username');
        setFieldError(root, 'register-password');
        setFieldError(root, 'register-confirm');
        setAuthAlert(root, { id: 'register-alert', message: '' });

        const username = form.username.value.trim();
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;
        let hasError = false;

        if (!username || username.length < 3) {
          setFieldError(root, 'register-username', 'El usuario debe tener al menos 3 caracteres.');
          hasError = true;
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          setFieldError(root, 'register-username', 'Solo letras, números y guion bajo.');
          hasError = true;
        }

        if (!password || password.length < 8) {
          setFieldError(root, 'register-password', 'Mínimo 8 caracteres.');
          hasError = true;
        }

        if (password !== confirmPassword) {
          setFieldError(root, 'register-confirm', 'Las contraseñas no coinciden.');
          hasError = true;
        }

        if (hasError) {
          setAuthAlert(root, {
            id: 'register-alert',
            type: 'error',
            message: 'Revisa los campos marcados e inténtalo de nuevo.',
          });
          return;
        }

        setButtonLoading(submitButton, true);

        try {
          const result = await registerAccount({
            username,
            password,
            displayName: username,
          });
          setAuthAlert(root, {
            id: 'register-alert',
            type: 'success',
            message: 'Cuenta creada. Continuando...',
          });
          await wait(250);
          void navigate(result.path, { replace: true });
        } catch (error) {
          setAuthAlert(root, {
            id: 'register-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo crear la cuenta.'),
          });
        } finally {
          setButtonLoading(submitButton, false);
        }
      };

      form?.addEventListener('submit', onSubmit);
      cleanups.push(() => form?.removeEventListener('submit', onSubmit));
      return () => cleanups.forEach((fn) => fn?.());
    },
  };
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
