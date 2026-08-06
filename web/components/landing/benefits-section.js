import { icon } from './icons.js';

const BENEFITS = [
  {
    title: 'Gestión hospitalaria',
    description:
      'Departamentos, turnos y flujos clínicos organizados en una interfaz pensada para operar con claridad.',
    icon: 'building',
  },
  {
    title: 'Expedientes médicos',
    description:
      'Historial clínico digital, trazable y disponible para el personal autorizado en el momento preciso.',
    icon: 'file',
  },
  {
    title: 'Informes clínicos',
    description:
      'Consultas, procedimientos y hospitalizaciones documentados con estados visibles y auditoría.',
    icon: 'stethoscope',
  },
  {
    title: 'Personal y especializaciones',
    description:
      'Fichas institucionales, rangos, certificaciones y asignación a departamentos médicos.',
    icon: 'users',
  },
  {
    title: 'Tiempo real',
    description:
      'Notificaciones y actualizaciones instantáneas para mantener al equipo sincronizado.',
    icon: 'heartPulse',
  },
  {
    title: 'Seguridad institucional',
    description:
      'Autenticación multi-proveedor, JWT y control de acceso basado en roles del personaje activo.',
    icon: 'lock',
  },
];

export function renderBenefitsSection() {
  return `
    <section id="ventajas" class="landing-section">
      <div class="landing-container">
        <div class="mx-auto mb-14 max-w-2xl text-center" data-reveal>
          <p class="landing-eyebrow">Plataforma</p>
          <h2 class="landing-title">Diseñada para el entorno clínico</h2>
          <p class="landing-lead mx-auto">
            Una infraestructura moderna para administrar el SAED con el rigor de un sistema hospitalario profesional.
          </p>
        </div>

        <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          ${BENEFITS.map(
            (item, index) => `
              <article class="surface-card surface-card-hover p-6" data-reveal data-reveal-delay="${index * 60}">
                <div class="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
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
