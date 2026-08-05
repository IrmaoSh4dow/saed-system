import { initNavbar, renderNavbar } from '../components/dashboard/navbar.js';
import { initSidebar, renderSidebar } from '../components/dashboard/sidebar.js';
import { bindNotificationSocket } from '../services/notifications.store.js';

export function renderDashboardLayout(
  contentHtml,
  { title = 'Dashboard', currentPath = '/dashboard' } = {},
) {
  return `
    <div class="dashboard-shell min-h-screen bg-surface-950 text-ink-100">
      ${renderSidebar({ currentPath })}
      <div class="lg:pl-72">
        ${renderNavbar({ title })}
        <main class="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
          <div class="mx-auto max-w-7xl">
            ${contentHtml}
          </div>
        </main>
      </div>
    </div>
  `;
}

export function initDashboardLayout(root = document) {
  const cleanups = [initSidebar(root), initNavbar(root), bindNotificationSocket()];
  return () => cleanups.forEach((fn) => fn?.());
}
