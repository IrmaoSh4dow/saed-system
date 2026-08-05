import { icon } from './icons.js';

export function renderFooter() {
  return `
    <footer class="border-t border-white/10 bg-surface-950 pb-10 pt-16">
      <div class="landing-container">
        <div class="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <div class="xl:col-span-1">
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-300">
                ${icon('shield', 'h-5 w-5')}
              </span>
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-400">SAED</p>
                <p class="text-sm font-semibold text-white">Management System</p>
              </div>
            </div>
            <p class="mt-5 max-w-xs text-sm leading-relaxed text-ink-400">
              Plataforma institucional del San Andreas Emergency Department para la gestión médica del servidor Roleplay.
            </p>
          </div>

          <div>
            <p class="mb-4 text-sm font-semibold text-white">Navegación</p>
            <ul class="space-y-3 text-sm text-ink-400">
              <li><a href="/#inicio" class="landing-hash-link transition hover:text-white">Inicio</a></li>
              <li><a href="/#noticias" class="landing-hash-link transition hover:text-white">Noticias</a></li>
              <li><a href="/#convocatorias" class="landing-hash-link transition hover:text-white">Convocatorias</a></li>
              <li><a href="/#personal" class="landing-hash-link transition hover:text-white">Personal</a></li>
              <li><a href="/#galeria" class="landing-hash-link transition hover:text-white">Galería</a></li>
              <li><a href="/#faq" class="landing-hash-link transition hover:text-white">FAQ</a></li>
            </ul>
          </div>

          <div>
            <p class="mb-4 text-sm font-semibold text-white">Ciudadanos</p>
            <ul class="space-y-3 text-sm text-ink-400">
              <li><a data-link href="/denuncias" class="transition hover:text-white">Denuncias</a></li>
              <li><a href="/#convocatorias" class="landing-hash-link transition hover:text-white">Convocatorias</a></li>
              <li><a data-link href="/auth/login" class="transition hover:text-white">Iniciar sesión</a></li>
            </ul>
          </div>

          <div>
            <p class="mb-4 text-sm font-semibold text-white">Comunidad</p>
            <div class="flex items-center gap-3">
              <a href="#" class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-ink-200 transition hover:border-brand-500/30 hover:text-white" aria-label="Discord">
                ${icon('discord', 'h-5 w-5')}
              </a>
            </div>
            <p class="mt-4 text-sm text-ink-500">Roleplay · FiveM · Los Santos</p>
          </div>
        </div>

        <div class="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 text-sm text-ink-500 md:flex-row md:items-center md:justify-between">
          <p>© ${new Date().getFullYear()} San Andreas Emergency Department. Todos los derechos reservados.</p>
          <p>Sistema oficial de gestión institucional.</p>
        </div>
      </div>
    </footer>
  `;
}
