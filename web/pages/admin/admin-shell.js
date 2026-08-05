import { getVisibleAdminNavigation } from '../../config/navigation.js';
import { initDashboardLayout, renderDashboardLayout } from '../../layouts/dashboard.layout.js';
import { getAuthState } from '../../services/auth-context.js';
import { requireActiveCharacter } from '../../utils/auth-guard.js';
import { navigate } from '../../utils/router.js';
import { hasAnyPermission, PERMISSIONS } from '../../utils/permissions.js';

const ADMIN_GATE = [
  PERMISSIONS.ADMIN_ACCESS,
  PERMISSIONS.STAFF_CREATE,
  PERMISSIONS.RANKS_READ,
  PERMISSIONS.DEPARTMENTS_CREATE,
  PERMISSIONS.PERMISSIONS_READ,
  PERMISSIONS.ROLES_ASSIGN,
  PERMISSIONS.CHARACTERS_SEARCH,
  PERMISSIONS.DECORATIONS_MANAGE,
  PERMISSIONS.LICENSES_MANAGE,
  PERMISSIONS.ACCOUNTS_MANAGE,
  PERMISSIONS.ACADEMY_MANAGE,
  PERMISSIONS.ACADEMY_APPLICATIONS,
  PERMISSIONS.NEWS_MANAGE,
  PERMISSIONS.GALLERY_MANAGE,
];

export function requireAdminAccess() {
  if (!requireActiveCharacter()) {
    return false;
  }

  const { permissions } = getAuthState();
  if (!hasAnyPermission(permissions, ADMIN_GATE)) {
    void navigate('/dashboard', { replace: true });
    return false;
  }

  return true;
}

export function renderAdminShell(contentHtml, { title, currentPath }) {
  const { permissions } = getAuthState();
  const links = getVisibleAdminNavigation(permissions);

  const adminContent = `
    <div class="space-y-6">
      <section class="surface-card p-5 md:p-6">
        <p class="landing-eyebrow">Administración</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-white">${title}</h2>
        <nav class="mt-5 flex flex-wrap gap-2">
          ${links
            .map((item) => {
              const active = currentPath === item.path;
              return `
                <a
                  data-link
                  href="${item.path}"
                  class="rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-brand-500/15 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.25)]'
                      : 'border border-white/10 text-ink-300 hover:bg-white/[0.04] hover:text-white'
                  }"
                >${item.name}</a>
              `;
            })
            .join('')}
        </nav>
      </section>
      ${contentHtml}
    </div>
  `;

  return renderDashboardLayout(adminContent, { title, currentPath: '/admin' });
}

export function mountAdminPage(root, title) {
  document.title = `${title} · SAED`;
  return initDashboardLayout(root);
}
