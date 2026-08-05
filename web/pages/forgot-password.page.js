import { renderAuthAlert } from '../components/auth/auth-alert.js';
import { icon } from '../components/landing/icons.js';
import { renderAuthLayout } from '../layouts/auth.layout.js';
import { initScrollReveal } from '../utils/scroll-reveal.js';

export function forgotPasswordPage() {
  const content = `
    <div class="mx-auto w-full max-w-[420px]" data-reveal>
      <div class="surface-card p-7 sm:p-9">
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-500/30 bg-brand-500/10 text-brand-300">
            ${icon('lock', 'h-5 w-5')}
          </div>
          <h1 class="text-2xl font-semibold text-white">Recuperar acceso</h1>
          <p class="mt-2 text-sm text-ink-300">
            El restablecimiento de contraseña se gestiona de forma manual.
          </p>
        </div>

        ${renderAuthAlert({
          id: 'forgot-alert',
          type: 'info',
          message: 'Contacta a irmaoshadow._ en Discord para restablecer tu contraseña.',
        })}

        <p class="mt-7 text-center text-sm text-ink-400">
          <a data-link href="/auth/login" class="font-semibold text-brand-300 hover:text-brand-200">Volver al inicio de sesión</a>
        </p>
      </div>
    </div>
  `;

  return {
    html: renderAuthLayout(content),
    afterMount(root) {
      document.title = 'Recuperar acceso · SAED';
      const cleanups = [initScrollReveal(root)];
      root.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
      return () => cleanups.forEach((fn) => fn?.());
    },
  };
}
