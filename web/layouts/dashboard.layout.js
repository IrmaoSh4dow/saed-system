import { initNavbar, renderNavbar } from '../components/dashboard/navbar.js';
import { initSidebar, renderSidebar } from '../components/dashboard/sidebar.js';
import { APP_EVENTS, subscribe } from '../services/app-events.js';
import {
  bindNotificationSocket,
  resetNotificationsForActiveCharacter,
} from '../services/notifications.store.js';
import { reconnectSocketWithAuth } from '../services/socket-client.js';

export function renderDashboardLayout(
  contentHtml,
  { title = 'Dashboard', currentPath = '/dashboard' } = {},
) {
  return `
    <div class="dashboard-shell min-h-screen text-ink-100">
      ${renderSidebar({ currentPath })}
      <div class="lg:pl-[17.5rem]">
        ${renderNavbar({ title })}
        <main class="min-h-[calc(100vh-4.25rem)] px-4 py-6 sm:px-6 lg:px-8">
          <div class="mx-auto max-w-7xl animate-[page-enter_420ms_cubic-bezier(0.22,1,0.36,1)]">
            ${contentHtml}
          </div>
        </main>
      </div>
    </div>
  `;
}

export function initDashboardLayout(root = document) {
  const offCharacterChanged = subscribe(APP_EVENTS.CHARACTER_CHANGED, () => {
    reconnectSocketWithAuth();
    void resetNotificationsForActiveCharacter();
  });
  const cleanups = [
    initSidebar(root),
    initNavbar(root),
    bindNotificationSocket(),
    offCharacterChanged,
  ];
  return () => cleanups.forEach((fn) => fn?.());
}
