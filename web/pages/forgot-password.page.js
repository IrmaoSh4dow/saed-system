import { renderAuthAlert } from '../components/auth/auth-alert.js';
import { initAuthMotion } from '../components/auth/auth-motion.js';
import { renderAuthLayout } from '../layouts/auth.layout.js';

export function forgotPasswordPage() {
  const formHtml = `
    ${renderAuthAlert({
      id: 'forgot-alert',
      type: 'info',
      message: 'Contacta a un administrador del SAED para restablecer tu contraseña de forma segura.',
    })}

    <div class="auth-field rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 text-sm leading-relaxed text-ink-300">
      Por política institucional, el restablecimiento no se realiza de forma automática.
      Un alto mando verificará tu identidad antes de restablecer el acceso.
    </div>
  `;

  return {
    html: renderAuthLayout({
      mode: 'forgot',
      title: 'Recuperar acceso',
      subtitle: 'El restablecimiento de contraseña se gestiona de forma manual y auditada.',
      formHtml,
      switchHtml: `
        <a data-link href="/auth/login">Volver al inicio de sesión</a>
      `,
    }),
    afterMount(root) {
      document.title = 'Recuperar acceso · SAED';
      const painted = root.querySelector('#forgot-alert');
      painted?.classList.add('is-visible');
      const cleanup = initAuthMotion(root);
      return () => cleanup?.();
    },
  };
}
