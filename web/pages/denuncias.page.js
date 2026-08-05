import { icon } from '../components/landing/icons.js';
import { initLandingLayout, renderLandingLayout } from '../layouts/landing.layout.js';
import { initScrollReveal } from '../utils/scroll-reveal.js';

export function denunciasPage() {
  const content = `
    <section class="relative min-h-[80vh] pt-28 pb-20">
      <div class="pointer-events-none absolute inset-0 hero-glow opacity-70"></div>
      <div class="landing-container relative">
        <div class="mx-auto max-w-2xl text-center" data-reveal>
          <p class="landing-eyebrow">Módulo público</p>
          <h1 class="landing-title">Denuncias ciudadanas</h1>
          <p class="landing-lead mx-auto">
            Este módulo permitirá a cualquier personaje civil registrar denuncias, adjuntar evidencias
            y comunicarse en tiempo real con el personal asignado.
          </p>
        </div>

        <div class="mx-auto mt-12 max-w-xl surface-card p-8 text-center md:p-10" data-reveal data-reveal-delay="100">
          <div class="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
            ${icon('bolt', 'h-5 w-5')}
          </div>
          <h2 class="text-xl font-semibold text-white">Disponible próximamente</h2>
          <p class="mt-3 text-sm leading-relaxed text-ink-300">
            Estamos preparando la experiencia de denuncias para garantizar seguridad, trazabilidad y
            una comunicación fluida entre ciudadanos y el departamento.
          </p>
          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a data-link href="/" class="btn-secondary">Volver al inicio</a>
            <a data-link href="/auth/login" class="btn-primary">Iniciar sesión</a>
          </div>
        </div>
      </div>
    </section>
  `;

  return {
    html: renderLandingLayout(content),
    afterMount(root) {
      document.title = 'Denuncias · SAED';
      const cleanups = [initLandingLayout(root), initScrollReveal(root)];
      root.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
      return () => cleanups.forEach((fn) => fn?.());
    },
  };
}
