import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import { listPermissionsCatalog } from '../../services/permissions.service.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';
import { can } from '../../services/auth-context.js';
import { PERMISSIONS } from '../../utils/permissions.js';

export function adminPermissionsPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  if (!can(PERMISSIONS.PERMISSIONS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-permissions-alert' })}
      <section class="panel p-6">
        <h3 class="text-sm font-semibold text-white">Catálogo de permisos</h3>
        <p class="mt-1 text-xs text-ink-400">
          Los permisos se asignan mediante roles (RBAC). El rango SAED no concede autorización.
        </p>
        <div id="permissions-list" class="mt-5 flex flex-wrap gap-2"></div>
      </section>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Permisos del sistema',
      currentPath: '/admin/permissions',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Permisos');

      void listPermissionsCatalog()
        .then((permissions) => {
          const host = root.querySelector('#permissions-list');
          host.innerHTML = permissions
            .map(
              (permission) => `
                <span class="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-ink-200" title="${permission.description ?? ''}">
                  ${permission.key}
                </span>
              `,
            )
            .join('');
        })
        .catch((error) => {
          setAuthAlert(root, {
            id: 'admin-permissions-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        });

      return cleanup;
    },
  };
}
