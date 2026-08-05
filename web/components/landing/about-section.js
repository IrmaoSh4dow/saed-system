export function renderAboutSection() {
  return `
    <section id="que-es-saed" class="landing-section relative">
      <div class="landing-container">
        <div class="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div data-reveal>
            <p class="landing-eyebrow">Institución</p>
            <h2 class="landing-title">¿Qué es el SAED?</h2>
            <p class="landing-lead">
              El San Andreas Emergency Department es el organismo encargado de la atención médica de
              emergencia, la coordinación hospitalaria y el servicio sanitario dentro del servidor Roleplay.
            </p>
            <p class="mt-5 max-w-2xl text-base leading-relaxed text-ink-300">
              Esta plataforma no es un MDT improvisado: es la infraestructura institucional del
              departamento. Cada expediente, cada informe y cada decisión queda registrada con el
              rigor que exige el servicio.
            </p>
          </div>

          <div class="relative" data-reveal data-reveal-delay="120">
            <div class="absolute -inset-4 rounded-[2rem] bg-brand-500/10 blur-2xl"></div>
            <div class="surface-card relative overflow-hidden p-8 md:p-10">
              <div class="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-500/25 blur-3xl"></div>
              <div class="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl"></div>
              <div class="relative space-y-8">
                <div class="flex items-center gap-3">
                  <span class="h-2 w-2 rounded-full bg-brand-400"></span>
                  <span class="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">Misión</span>
                </div>
                <p class="text-2xl font-medium leading-snug text-white md:text-[1.75rem]">
                  Atender Los Santos con disciplina, transparencia y tecnología.
                </p>
                <div class="grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2">
                  <div class="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p class="text-sm font-semibold text-white">Ciudadanos</p>
                    <p class="mt-2 text-sm leading-relaxed text-ink-400">Denuncias, seguimiento y canal directo con el departamento.</p>
                  </div>
                  <div class="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p class="text-sm font-semibold text-white">Personal médico</p>
                    <p class="mt-2 text-sm leading-relaxed text-ink-400">Operaciones, informes y cadena de mando en un solo sistema.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
