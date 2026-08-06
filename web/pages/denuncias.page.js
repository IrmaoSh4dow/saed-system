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
          <h1 class="landing-title">Quejas ciudadanas</h1>
          <p class="landing-lead mx-auto">
            Accede con tu cuenta para registrar quejas, adjuntar evidencias y comunicarte en tiempo
            real con el personal asignado.
          </p>
        </div>

        <div class="mx-auto mt-12 max-w-xl panel p-8 text-center md:p-10" data-reveal data-reveal-delay="100">
          <div class="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-400/20 bg-brand-500/10 text-brand-300">
            ${icon('alert', 'h-5 w-5')}
          </div>
          <h2 class="text-xl font-semibold text-white">Disponible en el panel</h2>
          <p class="mt-3 text-sm leading-relaxed text-ink-300">
            Inicia sesión con tu personaje para presentar una queja o solicitar una cita médica /
            psicotécnica desde el panel institucional.
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
      document.title = 'Quejas · SAED';
      const cleanups = [initLandingLayout(root), initScrollReveal(root)];
      root.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
      return () => cleanups.forEach((fn) => fn?.());
    },
  };
}
