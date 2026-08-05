import { icon } from '../components/landing/icons.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';

export function createModulePlaceholderPage({
  title,
  path,
  permission,
  description,
  eyebrow = 'Módulo',
} = {}) {
  return function modulePlaceholderPage() {
    if (!requireActiveCharacter()) {
      return { html: '', afterMount: () => {} };
    }

    if (permission && !requirePermission(permission)) {
      return { html: '', afterMount: () => {} };
    }

    const content = `
      <section class="surface-card overflow-hidden p-7 md:p-10">
        <div class="mx-auto max-w-xl text-center">
          <p class="landing-eyebrow">${eyebrow}</p>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-white">${title}</h2>
          <p class="mt-3 text-sm leading-relaxed text-ink-300">${description}</p>
          <div class="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10 text-brand-300">
            ${icon('bolt', 'h-6 w-6')}
          </div>
          <p class="mt-6 text-xs uppercase tracking-[0.18em] text-ink-500">Próximamente</p>
          <p class="mt-2 text-[11px] text-ink-500">${permission ?? ''}</p>
        </div>
      </section>
    `;

    return {
      html: renderDashboardLayout(content, { title, currentPath: path }),
      afterMount(root) {
        document.title = `${title} · SAED`;
        return initDashboardLayout(root);
      },
    };
  };
}
