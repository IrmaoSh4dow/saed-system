import { icon } from './icons.js';

export function renderFooter() {
  return `
    <footer class="border-t border-white/8 bg-surface-950 pb-10 pt-16">
      <div class="landing-container">
        <div class="grid gap-10 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-2xl border border-brand-400/30 bg-brand-500/10 text-brand-300">
                ${icon('cross', 'h-5 w-5')}
              </span>
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-400">SAED</p>
                <p class="text-sm font-semibold text-white">Management System</p>
              </div>
            </div>
            <p class="mt-5 max-w-sm text-sm leading-relaxed text-ink-400">
              Plataforma institucional del San Andreas Emergency Department. Autenticación local con usuario y contraseña.
            </p>
          </div>

          <div>
            <p class="mb-4 text-sm font-semibold text-white">Navegación</p>
            <ul class="space-y-3 text-sm text-ink-400">
              <li><a href="/#inicio" class="landing-hash-link transition hover:text-white">Inicio</a></li>
              <li><a href="/#modulos" class="landing-hash-link transition hover:text-white">Módulos</a></li>
              <li><a href="/#noticias" class="landing-hash-link transition hover:text-white">Noticias</a></li>
              <li><a href="/#personal" class="landing-hash-link transition hover:text-white">Personal</a></li>
              <li><a href="/#departamentos" class="landing-hash-link transition hover:text-white">Departamentos</a></li>
            </ul>
          </div>

          <div>
            <p class="mb-4 text-sm font-semibold text-white">Cuenta</p>
            <ul class="space-y-3 text-sm text-ink-400">
              <li><a data-link href="/auth/login" class="transition hover:text-white">Iniciar sesión</a></li>
              <li><a data-link href="/auth/register" class="transition hover:text-white">Crear cuenta</a></li>
              <li><a href="/#como-funciona" class="landing-hash-link transition hover:text-white">Cómo empezar</a></li>
            </ul>
          </div>
        </div>

        <div class="mt-12 flex flex-col gap-3 border-t border-white/8 pt-8 text-sm text-ink-500 md:flex-row md:items-center md:justify-between">
          <p>© ${new Date().getFullYear()} San Andreas Emergency Department.</p>
          <p>Sistema oficial de gestión médica institucional.</p>
        </div>
      </div>
    </footer>
  `;
}
