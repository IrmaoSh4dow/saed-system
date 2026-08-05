import { icon } from './icons.js';

export function renderHero() {
  return `
    <section id="inicio" class="relative isolate min-h-[100svh] overflow-hidden pt-16">
      <div class="pointer-events-none absolute inset-0 hero-glow"></div>
      <div class="pointer-events-none absolute inset-0 hero-grid opacity-80"></div>
      <div class="pointer-events-none absolute inset-0 hero-scanline opacity-40"></div>
      <canvas id="hero-particles" class="pointer-events-none absolute inset-0"></canvas>

      <div class="pointer-events-none absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-brand-500/20 blur-[120px]" data-parallax="18"></div>
      <div class="pointer-events-none absolute -right-24 top-32 h-[22rem] w-[22rem] rounded-full bg-cyan-400/10 blur-[110px]" data-parallax="12"></div>

      <svg class="pointer-events-none absolute inset-x-0 bottom-0 h-44 w-full text-white/[0.08]" viewBox="0 0 1440 180" fill="none" aria-hidden="true" preserveAspectRatio="none">
        <path stroke="currentColor" stroke-width="1.2" d="M0 130h110l50-45 70 25 90-70 80 55 100-75 110 45 120-60 100 35 110 50 130-55 140 60H1440"/>
        <rect x="160" y="70" width="34" height="90" fill="currentColor" fill-opacity="0.08"/>
        <rect x="390" y="40" width="42" height="120" fill="currentColor" fill-opacity="0.1"/>
        <rect x="720" y="55" width="50" height="105" fill="currentColor" fill-opacity="0.09"/>
        <rect x="1040" y="28" width="38" height="132" fill="currentColor" fill-opacity="0.12"/>
        <rect x="1240" y="60" width="28" height="100" fill="currentColor" fill-opacity="0.08"/>
      </svg>

      <div class="landing-container relative z-10 grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-28">
        <div class="relative max-w-2xl">
          <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300" data-reveal>
            <span class="status-dot"></span>
            Sistemas operativos · Canal seguro
          </div>

          <p class="landing-eyebrow" data-reveal data-reveal-delay="60">San Andreas Emergency Department</p>
          <h1 class="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]" data-reveal data-reveal-delay="100">
            Autoridad digital<br />
            <span class="bg-gradient-to-r from-white via-brand-300 to-brand-500 bg-clip-text text-transparent">para un departamento moderno</span>
          </h1>
          <p class="mt-6 max-w-xl text-base leading-relaxed text-ink-300 md:text-lg" data-reveal data-reveal-delay="150">
            La plataforma institucional donde personal médico y ciudadanos operan con la misma claridad:
            expedientes, informes, protocolos y comunicación en tiempo real.
          </p>

          <div class="mt-9 flex flex-col gap-3 sm:flex-row" data-reveal data-reveal-delay="200">
            <a data-link href="/auth/login" class="btn-primary">
              Iniciar sesión
              ${icon('arrowRight', 'h-4 w-4')}
            </a>
            <a href="#que-es-saed" class="btn-secondary landing-hash-link">Conocer más</a>
          </div>

          <div class="mt-10 flex flex-wrap gap-3" data-reveal data-reveal-delay="260">
            <span class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-ink-300">RBAC dinámico</span>
            <span class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-ink-300">Socket.IO</span>
            <span class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-ink-300">Cadena de custodia</span>
          </div>
        </div>

        <div class="relative mx-auto w-full max-w-lg lg:max-w-none" data-reveal data-reveal-delay="120">
          <div class="absolute -inset-6 rounded-[2rem] bg-brand-500/10 blur-3xl"></div>

          <div class="float-slow absolute -left-4 top-6 z-20 hidden w-44 rounded-2xl border border-white/10 bg-surface-950/80 p-4 shadow-2xl backdrop-blur-xl sm:block" data-parallax="22">
            <p class="text-[10px] uppercase tracking-[0.2em] text-ink-400">Casos activos</p>
            <p class="mt-2 text-2xl font-semibold text-white">128</p>
            <div class="progress-track mt-3"><div class="progress-bar is-visible" style="--progress:72%"></div></div>
          </div>

          <div class="float-delayed absolute -right-2 top-24 z-20 hidden w-48 rounded-2xl border border-brand-400/20 bg-surface-950/85 p-4 shadow-2xl backdrop-blur-xl md:block" data-parallax="16">
            <div class="mb-2 flex items-center gap-2 text-brand-300">${icon('bolt', 'h-4 w-4')}<span class="text-[10px] uppercase tracking-[0.18em]">Live feed</span></div>
            <p class="text-sm font-medium text-white">Denuncia #4921 asignada</p>
            <p class="mt-1 text-xs text-ink-400">Trauma · hace 2 min</p>
          </div>

          <div class="float-slower absolute bottom-8 -left-2 z-20 hidden w-52 rounded-2xl border border-white/10 bg-surface-950/85 p-4 shadow-2xl backdrop-blur-xl sm:block" data-parallax="14">
            <p class="text-[10px] uppercase tracking-[0.2em] text-ink-400">Disponibilidad</p>
            <p class="mt-2 text-lg font-semibold text-white">94% operativos</p>
            <p class="mt-1 text-xs text-emerald-300">Turno nocturno estable</p>
          </div>

          <div class="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-surface-900/80 shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl" data-parallax="8">
            <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div class="flex items-center gap-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/15 text-brand-300">${icon('shield', 'h-4 w-4')}</span>
                <div>
                  <p class="text-sm font-semibold text-white">SAED Command</p>
                  <p class="text-[11px] text-ink-400">Panel operativo simulado</p>
                </div>
              </div>
              <span class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">Online</span>
            </div>

            <div class="grid gap-3 p-5 sm:grid-cols-2">
              <div class="rounded-xl border border-white/10 bg-surface-950/60 p-4">
                <p class="text-[11px] uppercase tracking-[0.16em] text-ink-400">Informes</p>
                <p class="mt-2 text-2xl font-semibold text-white">48</p>
                <p class="mt-1 text-xs text-brand-300">+12 hoy</p>
              </div>
              <div class="rounded-xl border border-white/10 bg-surface-950/60 p-4">
                <p class="text-[11px] uppercase tracking-[0.16em] text-ink-400">Evidencias</p>
                <p class="mt-2 text-2xl font-semibold text-white">316</p>
                <p class="mt-1 text-xs text-brand-300">Custodia activa</p>
              </div>
              <div class="sm:col-span-2 rounded-xl border border-white/10 bg-surface-950/60 p-4">
                <div class="mb-3 flex items-center justify-between">
                  <p class="text-sm font-medium text-white">Prioridad de casos</p>
                  <p class="text-xs text-ink-400">Tiempo real</p>
                </div>
                <div class="space-y-3">
                  <div>
                    <div class="mb-1 flex justify-between text-xs text-ink-300"><span>Crítico</span><span>18%</span></div>
                    <div class="progress-track"><div class="progress-bar is-visible" style="--progress:18%"></div></div>
                  </div>
                  <div>
                    <div class="mb-1 flex justify-between text-xs text-ink-300"><span>Alto</span><span>34%</span></div>
                    <div class="progress-track"><div class="progress-bar is-visible" style="--progress:34%"></div></div>
                  </div>
                  <div>
                    <div class="mb-1 flex justify-between text-xs text-ink-300"><span>Estándar</span><span>48%</span></div>
                    <div class="progress-track"><div class="progress-bar is-visible" style="--progress:48%"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface-950 via-surface-950/80 to-transparent"></div>
    </section>
  `;
}
