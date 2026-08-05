import { icon } from './icons.js';

export function renderFinalCta() {
  return `
    <section class="landing-section">
      <div class="landing-container">
        <div class="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-600/20 via-surface-900 to-surface-950 px-8 py-14 text-center md:px-16" data-reveal>
          <div class="pointer-events-none absolute inset-0 hero-grid opacity-40"></div>
          <div class="relative mx-auto max-w-2xl">
            <p class="landing-eyebrow">Acceso</p>
            <h2 class="landing-title">Entra al sistema oficial del SAED</h2>
            <p class="landing-lead mx-auto">
              Autentícate, selecciona tu personaje y comienza a operar con la plataforma institucional.
            </p>
            <a data-link href="/auth/login" class="btn-primary mt-8">
              Iniciar sesión
              ${icon('arrowRight', 'h-4 w-4')}
            </a>
          </div>
        </div>
      </div>
    </section>
  `;
}
