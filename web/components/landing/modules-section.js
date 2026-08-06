import { icon } from './icons.js';

const MODULES = [
  { title: 'Personal médico', desc: 'Fichas, rangos y especializaciones.', icon: 'users' },
  { title: 'Pacientes', desc: 'Registro y vínculo con establecimientos.', icon: 'heartPulse' },
  { title: 'Expedientes', desc: 'Historial clínico trazable y seguro.', icon: 'file' },
  { title: 'Informes', desc: 'Consultas, procedimientos y seguimiento.', icon: 'stethoscope' },
  { title: 'Departamentos', desc: 'Urgencias, Trauma, UCI y más.', icon: 'building' },
  { title: 'Academia', desc: 'Formación, evaluaciones y certificaciones.', icon: 'book' },
];

export function renderModulesSection() {
  return `
    <section id="modulos" class="landing-section border-y border-white/5 bg-surface-900/30">
      <div class="landing-container">
        <div class="mx-auto mb-14 max-w-2xl text-center" data-reveal>
          <p class="landing-eyebrow">Sistema</p>
          <h2 class="landing-title">Todo el SAED en un solo lugar</h2>
          <p class="landing-lead mx-auto">
            Módulos pensados para el trabajo clínico e institucional del día a día.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          ${MODULES.map(
            (item, index) => `
              <article class="group surface-card surface-card-hover p-6" data-reveal data-reveal-delay="${index * 50}">
                <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-400/25 bg-brand-500/10 text-brand-300 transition duration-300 group-hover:scale-105">
                  ${icon(item.icon, 'h-5 w-5')}
                </div>
                <h3 class="text-lg font-semibold text-white">${item.title}</h3>
                <p class="mt-2 text-sm leading-relaxed text-ink-300">${item.desc}</p>
              </article>
            `,
          ).join('')}
        </div>
      </div>
    </section>
  `;
}
