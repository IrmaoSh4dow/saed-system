export function renderAboutSection() {
  return `
    <section id="que-es-saed" class="landing-section">
      <div class="landing-container">
        <div class="grid items-end gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div data-reveal>
            <p class="landing-eyebrow">Institución</p>
            <h2 class="landing-title">Un hospital digital para Los Santos</h2>
            <p class="landing-lead">
              El SAED Management System es la plataforma oficial del San Andreas Emergency Department.
              Reemplaza procesos dispersos por un flujo clínico e institucional único.
            </p>
          </div>
          <div class="space-y-4" data-reveal data-reveal-delay="100">
            <div class="rounded-2xl border border-brand-400/20 bg-brand-500/10 px-5 py-4">
              <p class="text-sm font-semibold text-brand-300">Para personal sanitario</p>
              <p class="mt-1 text-sm text-ink-300">Operación diaria con permisos por personaje y auditoría completa.</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <p class="text-sm font-semibold text-white">Para ciudadanos</p>
              <p class="mt-1 text-sm text-ink-300">Acceso a noticias y a la información médica asociada a su personaje.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
