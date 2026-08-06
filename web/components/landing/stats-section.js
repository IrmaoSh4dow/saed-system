import { icon } from './icons.js';
import { mockStats } from '../../utils/mock-stats.js';

export function renderStatsSection() {
  return `
    <section id="estadisticas" class="landing-section">
      <div class="landing-container">
        <div class="mx-auto mb-14 max-w-2xl text-center" data-reveal>
          <p class="landing-eyebrow">Indicadores</p>
          <h2 class="landing-title">El SAED en cifras</h2>
          <p class="landing-lead mx-auto">Métricas que ilustran la escala clínica e institucional de la plataforma.</p>
        </div>

        <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          ${mockStats
            .map(
              (item, index) => `
                <article class="surface-card surface-card-hover p-6" data-reveal data-reveal-delay="${index * 70}">
                  <div class="mb-5 flex items-start justify-between gap-3">
                    <div class="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-500/25 bg-brand-500/10 text-brand-300">
                      ${icon(item.icon, 'h-5 w-5')}
                    </div>
                    <span class="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-ink-400">${item.hint}</span>
                  </div>
                  <p class="text-4xl font-semibold tracking-tight text-white md:text-[2.75rem]">
                    <span data-count-to="${item.value}">0</span>
                  </p>
                  <p class="mt-2 text-sm text-ink-300">${item.label}</p>
                  <div class="mt-5">
                    <div class="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-ink-400">
                      <span>Actividad clínica</span>
                      <span>${item.progress}%</span>
                    </div>
                    <div class="progress-track">
                      <div class="progress-bar" data-progress style="--progress:${item.progress}%"></div>
                    </div>
                  </div>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>
  `;
}
