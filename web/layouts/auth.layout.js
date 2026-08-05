import { icon } from '../components/landing/icons.js';

/**
 * @param {string} contentHtml
 * @param {{ contentAlign?: 'center' | 'start' }} [options]
 */
export function renderAuthLayout(contentHtml, { contentAlign = 'center' } = {}) {
  const mainAlign =
    contentAlign === 'start' ? 'items-start justify-start' : 'items-center justify-center';

  return `
    <div class="relative min-h-screen overflow-hidden">
      <div class="pointer-events-none absolute inset-0 hero-glow"></div>
      <div class="pointer-events-none absolute inset-0 hero-grid opacity-50"></div>
      <div class="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-brand-500/20 blur-[110px]"></div>
      <div class="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-[120px]"></div>

      <header class="relative z-20">
        <div class="landing-container flex h-16 items-center justify-between md:h-[4.5rem]">
          <a data-link href="/" class="group flex items-center gap-3">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-300 transition group-hover:border-brand-400/50">
              ${icon('shield', 'h-5 w-5')}
            </span>
            <span class="leading-tight">
              <span class="block text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-400">SAED</span>
              <span class="block text-sm font-semibold text-white">Management System</span>
            </span>
          </a>
          <a data-link href="/" class="inline-flex items-center gap-2 text-sm font-medium text-ink-300 transition hover:text-white">
            ${icon('arrowLeft', 'h-4 w-4')}
            Volver
          </a>
        </div>
      </header>

      <main class="relative z-10 flex min-h-[calc(100vh-4.5rem)] ${mainAlign} px-6 pb-12 pt-6 md:pb-16 md:pt-8">
        ${contentHtml}
      </main>
    </div>
  `;
}
