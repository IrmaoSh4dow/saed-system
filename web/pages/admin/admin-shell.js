import { renderDashTabs } from '../../components/ui/dash-tabs.js';
import { renderPageHeader } from '../../components/ui/page-header.js';
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
      ${renderPageHeader({
        eyebrow: 'Administración',
        title,
        description: 'Centro de control institucional del SAED. Gestiona personal, catálogos y contenido.',
      })}
      <div class="admin-nav-shell">
        ${renderDashTabs(
          links.map((item) => ({
            id: item.path,
            href: item.path,
            label: item.name,
            active: currentPath === item.path,
          })),
        )}
      </div>
      ${contentHtml}
    </div>
  `;

  return renderDashboardLayout(adminContent, { title, currentPath: '/admin' });
}

export function mountAdminPage(root, title) {
  document.title = `${title} · SAED`;
  return initDashboardLayout(root);
}
