import { initLandingLayout, renderLandingLayout } from '../layouts/landing.layout.js';

export function notFoundPage() {
  const content = `
    <section class="flex min-h-[70vh] items-center pt-24">
      <div class="landing-container text-center">
        <p class="landing-eyebrow">404</p>
        <h1 class="landing-title">Página no encontrada</h1>
        <p class="landing-lead mx-auto">La ruta solicitada no existe en el sitio público del SAED.</p>
        <a data-link href="/" class="btn-primary mt-8">Volver al inicio</a>
      </div>
    </section>
  `;

  return {
    html: renderLandingLayout(content),
    afterMount(root) {
      document.title = 'No encontrada · SAED';
      return initLandingLayout(root);
    },
  };
}
