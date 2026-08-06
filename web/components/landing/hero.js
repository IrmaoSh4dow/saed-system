import { icon } from './icons.js';

export function renderHero() {
  return `
    <section id="inicio" class="relative isolate min-h-[100svh] overflow-hidden pt-16">
      <div class="pointer-events-none absolute inset-0 hero-mesh"></div>
      <div class="pointer-events-none absolute left-1/2 top-1/3 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-40 hero-orbit blur-3xl"></div>
      <div class="pointer-events-none absolute inset-x-0 top-[42%] h-px hero-line"></div>
      <canvas id="hero-particles" class="pointer-events-none absolute inset-0 opacity-40"></canvas>

      <div class="landing-container relative z-10 flex min-h-[calc(100svh-4rem)] flex-col justify-center py-20 lg:py-28">
        <div class="mx-auto max-w-4xl text-center">
          <div class="mb-7 inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-500/10 px-4 py-1.5 text-xs font-medium text-brand-300" data-reveal>
            <span class="status-dot"></span>
            San Andreas Emergency Department
          </div>

          <h1 class="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-[4.5rem] lg:leading-[1.02]" data-reveal data-reveal-delay="80">
            SAED
          </h1>
          <p class="mt-4 text-xl font-medium tracking-tight text-brand-300 sm:text-2xl lg:text-3xl" data-reveal data-reveal-delay="120">
            La infraestructura digital del departamento médico
          </p>
          <p class="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-300 md:text-lg" data-reveal data-reveal-delay="160">
            Personal sanitario, pacientes, expedientes, informes clínicos y academia —
            centralizados en una plataforma institucional moderna.
          </p>

          <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row" data-reveal data-reveal-delay="220">
            <a data-link href="/auth/login" class="btn-primary min-w-[11rem]">
              Iniciar sesión
              ${icon('arrowRight', 'h-4 w-4')}
            </a>
            <a href="#modulos" class="btn-secondary landing-hash-link min-w-[11rem]">Explorar módulos</a>
          </div>
        </div>

        <div class="mx-auto mt-16 grid w-full max-w-5xl gap-3 sm:grid-cols-3" data-reveal data-reveal-delay="280">
          <div class="surface-card float-soft px-5 py-5 text-left">
            <p class="text-[11px] uppercase tracking-[0.2em] text-ink-500">Clínica</p>
            <p class="mt-2 text-lg font-semibold text-white">Expedientes e informes</p>
          </div>
          <div class="surface-card float-soft px-5 py-5 text-left" style="animation-delay:-2.5s">
            <p class="text-[11px] uppercase tracking-[0.2em] text-ink-500">Institucional</p>
            <p class="mt-2 text-lg font-semibold text-white">Personal y departamentos</p>
          </div>
          <div class="surface-card float-soft px-5 py-5 text-left" style="animation-delay:-5s">
            <p class="text-[11px] uppercase tracking-[0.2em] text-ink-500">Formación</p>
            <p class="mt-2 text-lg font-semibold text-white">Academia médica</p>
          </div>
        </div>
      </div>
    </section>
  `;
}
