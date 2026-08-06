import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initAuthMotion } from '../components/auth/auth-motion.js';
import { initPasswordToggles, renderPasswordField } from '../components/auth/password-field.js';
import { renderSubmitButton, setButtonLoading } from '../components/auth/submit-button.js';
import { renderTextField, setFieldError } from '../components/auth/text-field.js';
import { renderAuthLayout } from '../layouts/auth.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { registerAccount } from '../services/identity.service.js';
import { requireGuest } from '../utils/auth-guard.js';
import { navigate } from '../utils/router.js';

export function registerPage() {
  if (!requireGuest()) {
    return { html: '', afterMount: () => {} };
  }

  const formHtml = `
    ${renderAuthAlert({ id: 'register-alert' })}

    <form id="register-form" class="space-y-5" novalidate>
      ${renderTextField({
        id: 'register-username',
        name: 'username',
        label: 'Usuario',
        placeholder: 'medic01',
        autocomplete: 'username',
        required: true,
        hint: 'Mínimo 3 caracteres. Solo letras, números y guion bajo.',
      })}
      ${renderPasswordField({
        id: 'register-password',
        name: 'password',
        label: 'Contraseña',
        autocomplete: 'new-password',
        hint: 'Usa al menos 8 caracteres.',
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
  `;

  return {
    html: renderAuthLayout({
      mode: 'register',
      title: 'Crear cuenta',
      subtitle: 'Regístrate para gestionar tus personajes y acceder a los módulos autorizados del SAED.',
      formHtml,
      switchHtml: `
        ¿Ya tienes cuenta?
        <a data-link href="/auth/login">Iniciar sesión</a>
      `,
    }),
    afterMount(root) {
      document.title = 'Crear cuenta · SAED';
      const form = root.querySelector('#register-form');
      const submitButton = root.querySelector('#register-submit');
      const cleanups = [initAuthMotion(root), initPasswordToggles(root)];

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
          await wait(280);
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
