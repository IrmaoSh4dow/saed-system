const DEPARTMENTS = [
  { name: 'Urgencias', focus: 'Atención inmediata y triaje' },
  { name: 'Trauma', focus: 'Estabilización avanzada' },
  { name: 'UCI', focus: 'Cuidados intensivos' },
  { name: 'Cirugía', focus: 'Procedimientos y quirófano' },
  { name: 'Academia Médica', focus: 'Formación y certificación' },
];

export function renderDepartmentsSection() {
  return `
    <section id="departamentos" class="landing-section relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(217,30,30),0.1),_transparent_55%)]"></div>
      <div class="landing-container relative">
        <div class="mb-12 max-w-2xl" data-reveal>
          <p class="landing-eyebrow">Organización</p>
          <h2 class="landing-title">Departamentos médicos</h2>
          <p class="landing-lead">Unidades clínicas listas para operar dentro del sistema.</p>
        </div>

        <div class="grid gap-3 md:grid-cols-5">
          ${DEPARTMENTS.map(
            (item, index) => `
              <article class="surface-card surface-card-hover p-5 md:min-h-[10rem]" data-reveal data-reveal-delay="${index * 60}">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">0${index + 1}</p>
                <h3 class="mt-4 text-lg font-semibold text-white">${item.name}</h3>
                <p class="mt-2 text-sm text-ink-300">${item.focus}</p>
              </article>
            `,
          ).join('')}
        </div>
      </div>
    </section>
  `;
}
