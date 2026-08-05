import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../services/notifications.store.js';
import { APP_EVENTS, emit } from '../../services/app-events.js';
import { navigate } from '../../utils/router.js';
import { icon } from '../landing/icons.js';

export function renderNotificationsDropdown() {
  const unread = getUnreadNotificationsCount();
  const notifications = getNotifications();

  return `
    <div class="relative" id="notifications-dropdown">
      <button
        type="button"
        id="notifications-toggle"
        class="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-ink-200 transition hover:bg-white/[0.08] hover:text-white"
        aria-label="Notificaciones"
        aria-expanded="false"
      >
        ${icon('bell', 'h-4 w-4')}
        ${
          unread
            ? `<span class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">${unread}</span>`
            : ''
        }
      </button>

      <div id="notifications-menu" class="absolute right-0 z-50 mt-2 hidden w-80 overflow-hidden rounded-2xl border border-white/10 bg-surface-900/95 shadow-2xl backdrop-blur-xl sm:w-96">
        <div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p class="text-sm font-semibold text-white">Notificaciones</p>
          <button type="button" id="notifications-mark-all" class="text-xs font-medium text-brand-300 hover:text-brand-200">
            Marcar todas
          </button>
        </div>
        <ul class="max-h-80 overflow-y-auto">
          ${
            notifications.length
              ? notifications
                  .map(
                    (item) => `
                      <li class="border-b border-white/5 ${item.isRead ? 'opacity-70' : ''}">
                        <button type="button" class="w-full px-4 py-3 text-left transition hover:bg-white/[0.04]" data-notification-id="${item.id}" data-notification-href="${item.href ?? ''}">
                          <div class="flex items-start justify-between gap-3">
                            <p class="text-sm font-semibold text-white">${item.title}</p>
                            ${item.isRead ? '' : '<span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-400"></span>'}
                          </div>
                          <p class="mt-1 text-xs leading-relaxed text-ink-300">${item.message}</p>
                          <p class="mt-2 text-[11px] text-ink-500">${formatRelative(item.createdAt)}</p>
                        </button>
                      </li>
                    `,
                  )
                  .join('')
              : `<li class="px-4 py-8 text-center text-sm text-ink-400">No hay notificaciones</li>`
          }
        </ul>
      </div>
    </div>
  `;
}

export function initNotificationsDropdown(root = document) {
  const toggle = root.querySelector('#notifications-toggle');
  const menu = root.querySelector('#notifications-menu');
  const markAll = root.querySelector('#notifications-mark-all');

  if (!toggle || !menu) {
    return () => {};
  }

  const close = () => {
    menu.classList.add('hidden');
    toggle.setAttribute('aria-expanded', 'false');
  };

  const onToggle = (event) => {
    event.stopPropagation();
    const isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden', isOpen);
    toggle.setAttribute('aria-expanded', String(!isOpen));
  };

  const onDocumentClick = (event) => {
    if (!root.querySelector('#notifications-dropdown')?.contains(event.target)) {
      close();
    }
  };

  const refresh = () => {
    void navigate(window.location.pathname, { replace: true });
  };

  const onMarkAll = () => {
    markAllNotificationsAsRead();
    emit(APP_EVENTS.NOTIFICATIONS_UPDATED);
    refresh();
  };

  const onItemClick = (event) => {
    const button = event.target.closest('[data-notification-id]');
    if (!button) {
      return;
    }

    const href = button.getAttribute('data-notification-href');
    void markNotificationAsRead(button.getAttribute('data-notification-id'));
    emit(APP_EVENTS.NOTIFICATIONS_UPDATED);
    close();
    if (href) {
      void navigate(href);
      return;
    }
    refresh();
  };

  toggle.addEventListener('click', onToggle);
  document.addEventListener('click', onDocumentClick);
  markAll?.addEventListener('click', onMarkAll);
  menu.addEventListener('click', onItemClick);

  return () => {
    toggle.removeEventListener('click', onToggle);
    document.removeEventListener('click', onDocumentClick);
    markAll?.removeEventListener('click', onMarkAll);
    menu.removeEventListener('click', onItemClick);
  };
}

function formatRelative(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  return `Hace ${Math.round(hours / 24)} d`;
}
