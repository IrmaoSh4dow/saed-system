import { icon } from './icons.js';

const TYPE_META = {
  ACADEMY: {
    title: 'Academia Médica',
    summary:
      'Convocatoria de ingreso a la Academia del SAED. Formación estructurada y seguimiento digital desde el primer día.',
  },
  TRANSFER: {
    title: 'Traslado',
    summary:
      'Proceso para personal proveniente de otra jurisdicción o departamento que desea incorporarse al SAED.',
  },
};

export function renderRecruitmentSection(intake = []) {
  const rows = ['ACADEMY', 'TRANSFER'].map((type) => {
    const config = intake.find((item) => item.type === type) ?? { type, isOpen: false };
    const meta = TYPE_META[type];
    const open = Boolean(config.isOpen);
    return {
      type,
      title: meta.title,
      summary: meta.summary,
      open,
    };
  });

  const openCount = rows.filter((item) => item.open).length;

  return `
    <section id="convocatorias" class="landing-section relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(217,30,30,0.10),_transparent_55%)]"></div>
        <div class="absolute inset-0 hero-grid opacity-25"></div>
      </div>

      <div class="landing-container relative">
        <div class="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950 shadow-[0_40px_120px_rgba(0,0,0,0.35)]" data-reveal>
          <div class="grid lg:grid-cols-[1.25fr_0.75fr]">
            <div class="relative border-b border-white/10 p-8 md:p-12 lg:border-b-0 lg:border-r">
              <div class="pointer-events-none absolute -left-10 top-0 h-56 w-56 rounded-full bg-brand-500/15 blur-3xl"></div>
              <p class="landing-eyebrow">Postulaciones SAED</p>
              <h2 class="mt-2 text-3xl font-semibold tracking-tight text-white md:text-5xl md:leading-[1.1]">
                Convocatorias<br />de ingreso
              </h2>
              <p class="mt-5 max-w-xl text-base leading-relaxed text-ink-300 md:text-lg">
                Academia y Traslados se abren y cierran desde el sistema. El estado que ves aquí es el oficial.
              </p>
              <a data-link href="/auth/login" class="btn-cta-xl mt-9">
                Acceder para postular
                ${icon('arrowRight', 'h-5 w-5')}
              </a>
              <div class="mt-8 flex flex-wrap gap-4 text-sm text-ink-400">
                <span class="inline-flex items-center gap-2">
                  <span class="status-dot ${openCount ? '' : '!bg-rose-400'}"></span>
                  ${openCount} convocatoria${openCount === 1 ? '' : 's'} abierta${openCount === 1 ? '' : 's'}
                </span>
                <span>Inscripción 100% digital</span>
              </div>
            </div>

            <div class="space-y-4 bg-surface-950/40 p-6 md:p-8" id="landing-intake-cards">
              ${rows
                .map(
                  (item) => `
                    <article class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1 hover:border-brand-400/30 hover:bg-white/[0.05]">
                      <div class="mb-3 flex items-center justify-between gap-3">
                        <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                          item.open
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }">
                          ${item.open ? 'Convocatoria abierta' : 'Convocatoria cerrada'}
                        </span>
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

export async function paintRecruitmentSection(root, intake) {
  const host = root.querySelector('#convocatorias');
  if (!host) return;
  host.outerHTML = renderRecruitmentSection(intake);
}
