import { icon } from './icons.js';
import { mockRecruitment } from '../../utils/mock-recruitment.js';

export function renderRecruitmentSection() {
  return `
    <section id="convocatorias" class="landing-section relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(34,211,238,0.12),_transparent_55%)]"></div>
        <div class="absolute inset-0 hero-grid opacity-25"></div>
      </div>

      <div class="landing-container relative">
        <div class="overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-[#071820] via-surface-900 to-surface-950 shadow-[0_40px_120px_rgba(6,182,212,0.12)]" data-reveal>
          <div class="grid lg:grid-cols-[1.25fr_0.75fr]">
            <div class="relative border-b border-white/10 p-8 md:p-12 lg:border-b-0 lg:border-r">
              <div class="pointer-events-none absolute -left-10 top-0 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl"></div>
              <p class="landing-eyebrow">Academia médica</p>
              <h2 class="mt-2 text-3xl font-semibold tracking-tight text-white md:text-5xl md:leading-[1.1]">
                Forma tu carrera<br />en el SAED
              </h2>
              <p class="mt-5 max-w-xl text-base leading-relaxed text-ink-300 md:text-lg">
                Procesos de ingreso, especializaciones y promoción interna con documentación digital,
                evaluación transparente y seguimiento desde el primer día.
              </p>
              <a data-link href="/auth/login" class="btn-cta-xl mt-9">
                Consultar procesos abiertos
                ${icon('arrowRight', 'h-5 w-5')}
              </a>
              <div class="mt-8 flex flex-wrap gap-4 text-sm text-ink-400">
                <span class="inline-flex items-center gap-2"><span class="status-dot"></span> ${mockRecruitment.length} procesos activos</span>
                <span>Inscripción 100% digital</span>
              </div>
            </div>

            <div class="space-y-4 bg-surface-950/40 p-6 md:p-8">
              ${mockRecruitment
                .map(
                  (item) => `
                    <article class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.05]">
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
