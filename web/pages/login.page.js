import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initAuthMotion } from '../components/auth/auth-motion.js';
import { initPasswordToggles, renderPasswordField } from '../components/auth/password-field.js';
import { renderSubmitButton, setButtonLoading } from '../components/auth/submit-button.js';
import { renderTextField, setFieldError } from '../components/auth/text-field.js';
import { renderAuthLayout } from '../layouts/auth.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { loginWithPassword } from '../services/identity.service.js';
import { requireGuest } from '../utils/auth-guard.js';
import { navigate } from '../utils/router.js';

const REMEMBER_KEY = 'saed.rememberSession';

export function loginPage() {
  if (!requireGuest()) {
    return { html: '', afterMount: () => {} };
  }

  const remembered = localStorage.getItem(REMEMBER_KEY) === 'true';

  const formHtml = `
    ${renderAuthAlert({ id: 'login-alert' })}

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

      <div class="auth-meta-row">
        <label class="auth-checkbox">
          <input
            id="remember-session"
            name="remember"
            type="checkbox"
            ${remembered ? 'checked' : ''}
          />
          <span>Recordar sesión</span>
        </label>
        <a data-link href="/auth/forgot-password" class="auth-link">¿Olvidaste tu contraseña?</a>
      </div>

      ${renderSubmitButton({
        id: 'login-submit',
        label: 'Iniciar sesión',
        loadingLabel: 'Verificando...',
      })}
    </form>
  `;

  return {
    html: renderAuthLayout({
      mode: 'login',
      title: 'Iniciar sesión',
      subtitle: 'Accede con tus credenciales institucionales al SAED Management System.',
      formHtml,
      switchHtml: `
        ¿No tienes cuenta?
        <a data-link href="/auth/register">Crear cuenta</a>
      `,
    }),
    afterMount(root) {
      document.title = 'Iniciar sesión · SAED';
      const form = root.querySelector('#login-form');
      const submitButton = root.querySelector('#login-submit');
      const rememberCheckbox = root.querySelector('#remember-session');
      const cleanups = [initAuthMotion(root), initPasswordToggles(root)];

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
          await wait(280);
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
