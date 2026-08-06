import { icon } from './icons.js';

export function renderFinalCta() {
  return `
    <section class="landing-section pt-8">
      <div class="landing-container">
        <div class="relative overflow-hidden rounded-[2rem] border border-brand-400/25 bg-gradient-to-br from-brand-500/15 via-surface-900 to-surface-950 px-8 py-16 text-center md:px-16" data-reveal>
          <div class="pointer-events-none absolute inset-x-0 top-0 h-px hero-line"></div>
          <div class="relative mx-auto max-w-2xl">
            <p class="landing-eyebrow">Listo para operar</p>
            <h2 class="landing-title">Entra al SAED Management System</h2>
            <p class="landing-lead mx-auto">
              Autentícate con usuario y contraseña, selecciona tu personaje y comienza a trabajar.
            </p>
            <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a data-link href="/auth/login" class="btn-primary">
                Iniciar sesión
                ${icon('arrowRight', 'h-4 w-4')}
              </a>
              <a data-link href="/auth/register" class="btn-secondary">Crear cuenta</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
