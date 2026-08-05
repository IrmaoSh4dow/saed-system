import { icon } from './icons.js';
import { mockRecruitment } from '../../utils/mock-recruitment.js';

export function renderRecruitmentSection() {
  return `
    <section id="convocatorias" class="landing-section relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.18),_transparent_55%)]"></div>
        <div class="absolute inset-0 hero-grid opacity-30"></div>
      </div>

      <div class="landing-container relative">
        <div class="overflow-hidden rounded-[2rem] border border-brand-400/25 bg-gradient-to-br from-[#0b1a38] via-surface-900 to-surface-950 shadow-[0_40px_120px_rgba(37,99,235,0.2)]" data-reveal>
          <div class="grid lg:grid-cols-[1.25fr_0.75fr]">
            <div class="relative border-b border-white/10 p-8 md:p-12 lg:border-b-0 lg:border-r">
              <div class="pointer-events-none absolute -left-10 top-0 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl"></div>
              <p class="landing-eyebrow">Reclutamiento prioritario</p>
              <h2 class="mt-2 text-3xl font-semibold tracking-tight text-white md:text-5xl md:leading-[1.1]">
                Tu carrera en el SAED<br />empieza aquí
              </h2>
              <p class="mt-5 max-w-xl text-base leading-relaxed text-ink-300 md:text-lg">
                Procesos abiertos de ingreso y promoción interna. Documentación digital, evaluación
                transparente y seguimiento completo desde el primer día.
              </p>
              <a href="#convocatorias" class="btn-cta-xl mt-9">
                Consultar convocatorias abiertas
                ${icon('arrowRight', 'h-5 w-5')}
              </a>
              <div class="mt-8 flex flex-wrap gap-4 text-sm text-ink-400">
                <span class="inline-flex items-center gap-2"><span class="status-dot"></span> 2 procesos activos</span>
                <span>Inscripción 100% digital</span>
              </div>
            </div>

            <div class="space-y-4 bg-surface-950/40 p-6 md:p-8">
              ${mockRecruitment
                .map(
                  (item) => `
                    <article class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1 hover:border-brand-400/30 hover:bg-white/[0.05]">
                      <div class="mb-3 flex items-center justify-between gap-3">
                        <span class="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                          ${item.status}
                        </span>
                        <span class="text-xs text-ink-400">${item.closesAt}</span>
                      </div>
                      <h3 class="text-lg font-semibold text-white">${item.title}</h3>
                      <p class="mt-2 text-sm leading-relaxed text-ink-300">${item.summary}</p>
                    </article>
                  `,
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
