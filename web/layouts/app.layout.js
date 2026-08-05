import { icon } from '../components/landing/icons.js';

export function renderAppShellLayout(contentHtml, { title = 'Dashboard' } = {}) {
  return `
    <div class="min-h-screen bg-surface-950">
      <header class="sticky top-0 z-40 border-b border-white/10 bg-surface-950/80 backdrop-blur-xl">
        <div class="landing-container flex h-16 items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-300">
              ${icon('shield', 'h-5 w-5')}
            </span>
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-400">SAED</p>
              <p class="text-sm font-semibold text-white">${title}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a data-link href="/characters/select" class="btn-secondary px-3 py-2 text-xs">Personajes</a>
            <button type="button" id="app-logout" class="btn-secondary px-3 py-2 text-xs">Salir</button>
          </div>
        </div>
      </header>
      <main class="landing-container py-10">${contentHtml}</main>
    </div>
  `;
}
