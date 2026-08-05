const STEPS = [
  {
    step: '01',
    title: 'Crear cuenta',
    description: 'Regístrate con Discord o con usuario y contraseña.',
  },
  {
    step: '02',
    title: 'Vincular personajes',
    description: 'Asocia las identidades que utilizas dentro del servidor.',
  },
  {
    step: '03',
    title: 'Seleccionar personaje',
    description: 'Activa el contexto correcto: civil o personal médico.',
  },
  {
    step: '04',
    title: 'Acceder al sistema',
    description: 'Entra al panel con los permisos de tu personaje activo.',
  },
];

export function renderHowItWorksSection() {
  return `
    <section id="como-funciona" class="landing-section">
      <div class="landing-container">
        <div class="mx-auto mb-14 max-w-2xl text-center" data-reveal>
          <p class="landing-eyebrow">Onboarding</p>
          <h2 class="landing-title">Cómo funciona</h2>
          <p class="landing-lead mx-auto">Cuatro pasos para empezar a operar con el sistema oficial.</p>
        </div>

        <ol class="relative grid gap-6 lg:grid-cols-4">
          <div class="pointer-events-none absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent lg:block"></div>
          ${STEPS.map(
            (item, index) => `
              <li class="relative" data-reveal data-reveal-delay="${index * 90}">
                <div class="mb-5 flex items-center gap-3 lg:flex-col lg:items-start">
                  <span class="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-brand-500/30 bg-surface-950 text-sm font-semibold text-brand-300">
                    ${item.step}
                  </span>
                </div>
                <h3 class="text-lg font-semibold text-white">${item.title}</h3>
                <p class="mt-2 text-sm leading-relaxed text-ink-300">${item.description}</p>
              </li>
            `,
          ).join('')}
        </ol>
      </div>
    </section>
  `;
}
