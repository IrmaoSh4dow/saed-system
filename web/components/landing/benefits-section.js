import { icon } from './icons.js';

const BENEFITS = [
  {
    title: 'Gestión moderna',
    description:
      'Procesos claros, interfaces rápidas y una experiencia pensada para operar bajo presión.',
    icon: 'grid',
  },
  {
    title: 'Expedientes digitales',
    description:
      'Historial profesional completo, trazable y disponible cuando el mando lo necesita.',
    icon: 'file',
  },
  {
    title: 'Seguimiento de casos',
    description:
      'Investigaciones organizadas, estados visibles y asignación controlada por permisos.',
    icon: 'search',
  },
  {
    title: 'Evidencias centralizadas',
    description: 'Un único repositorio reutilizable entre informes, casos y denuncias.',
    icon: 'archive',
  },
  {
    title: 'Comunicación en tiempo real',
    description: 'Notificaciones y chat operativos sin recargar la aplicación.',
    icon: 'bolt',
  },
  {
    title: 'Seguridad',
    description: 'Autenticación multi-proveedor, JWT y control de acceso basado en roles.',
    icon: 'lock',
  },
];

export function renderBenefitsSection() {
  return `
    <section id="ventajas" class="landing-section">
      <div class="landing-container">
        <div class="mx-auto mb-14 max-w-2xl text-center" data-reveal>
          <p class="landing-eyebrow">Plataforma</p>
          <h2 class="landing-title">¿Por qué utilizar este sistema?</h2>
          <p class="landing-lead mx-auto">
            Una infraestructura diseñada para el Roleplay serio: precisa, segura y preparada para crecer.
          </p>
        </div>

        <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          ${BENEFITS.map(
            (item, index) => `
              <article class="surface-card surface-card-hover p-6" data-reveal data-reveal-delay="${index * 60}">
                <div class="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-300">
                  ${icon(item.icon, 'h-5 w-5')}
                </div>
                <h3 class="text-lg font-semibold text-white">${item.title}</h3>
                <p class="mt-2 text-sm leading-relaxed text-ink-300">${item.description}</p>
              </article>
            `,
          ).join('')}
        </div>
      </div>
    </section>
  `;
}
