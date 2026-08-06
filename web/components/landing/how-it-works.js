const STEPS = [
  {
    step: '01',
    title: 'Crear cuenta',
    description: 'Regístrate únicamente con usuario y contraseña.',
  },
  {
    step: '02',
    title: 'Registrar personajes',
    description: 'Asocia hasta dos identidades del servidor a tu cuenta.',
  },
  {
    step: '03',
    title: 'Seleccionar contexto',
    description: 'Activa un personaje civil o perteneciente al SAED.',
  },
  {
    step: '04',
    title: 'Operar en la plataforma',
    description: 'Accede a módulos clínicos e institucionales según tus permisos.',
  },
];

export function renderHowItWorksSection() {
  return `
    <section id="como-funciona" class="landing-section">
      <div class="landing-container">
        <div class="mx-auto mb-14 max-w-2xl text-center" data-reveal>
          <p class="landing-eyebrow">Acceso</p>
          <h2 class="landing-title">Cómo empezar</h2>
          <p class="landing-lead mx-auto">Cuatro pasos para entrar al sistema oficial del SAED.</p>
        </div>

        <ol class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          ${STEPS.map(
            (item, index) => `
              <li class="surface-card surface-card-hover p-6" data-reveal data-reveal-delay="${index * 70}">
                <span class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-400/30 bg-brand-500/10 text-sm font-semibold text-brand-300">
                  ${item.step}
                </span>
                <h3 class="mt-5 text-lg font-semibold text-white">${item.title}</h3>
                <p class="mt-2 text-sm leading-relaxed text-ink-300">${item.description}</p>
              </li>
            `,
          ).join('')}
        </ol>
      </div>
    </section>
  `;
}
