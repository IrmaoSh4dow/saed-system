import { renderEmptyState } from '../components/ui/empty-state.js';
import { renderPageHeader } from '../components/ui/page-header.js';
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
      <div class="space-y-6">
        ${renderPageHeader({
          eyebrow,
          title,
          description,
        })}
        ${renderEmptyState({
          iconName: 'bolt',
          title: 'Módulo en construcción',
          description:
            'Esta área formará parte del sistema operativo SAED en una próxima iteración.',
          actionHtml: permission
            ? `<p class="text-[11px] uppercase tracking-[0.18em] text-ink-500">${permission}</p>`
            : '',
        })}
      </div>
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
