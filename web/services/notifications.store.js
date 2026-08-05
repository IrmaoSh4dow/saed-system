import { apiClient } from './api-client.js';
import { APP_EVENTS, emit } from './app-events.js';
import { isApiAuthEnabled } from '../utils/env.js';
import { connectSocket, getSocket } from './socket-client.js';

const NOTIFICATIONS_KEY = 'saed.notifications';

export async function listNotifications() {
  if (isApiAuthEnabled()) {
    try {
      const response = await apiClient.get('/notifications');
      const items = unwrap(response).map(normalizeNotification);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
      emit(APP_EVENTS.NOTIFICATIONS_UPDATED, items);
      return items;
    } catch {
      return getLocalNotifications();
    }
  }

  return getLocalNotifications();
}

export function getNotifications() {
  return getLocalNotifications();
}

export function getUnreadNotificationsCount() {
  return getNotifications().filter((item) => !item.isRead).length;
}

export async function markNotificationAsRead(notificationId) {
  if (isApiAuthEnabled()) {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    } catch {
      /* keep local fallback */
    }
  }

  const notifications = getLocalNotifications().map((item) =>
    item.id === notificationId ? { ...item, isRead: true } : item,
  );
  saveLocal(notifications);
  emit(APP_EVENTS.NOTIFICATIONS_UPDATED, notifications);
  return notifications;
}

export async function markAllNotificationsAsRead() {
  if (isApiAuthEnabled()) {
    try {
      await apiClient.patch('/notifications/read-all');
    } catch {
      /* keep local fallback */
    }
  }

  const notifications = getLocalNotifications().map((item) => ({ ...item, isRead: true }));
  saveLocal(notifications);
  emit(APP_EVENTS.NOTIFICATIONS_UPDATED, notifications);
  return notifications;
}

export function bindNotificationSocket() {
  if (!isApiAuthEnabled()) {
    return () => {};
  }

  const socket = connectSocket() ?? getSocket();
  if (!socket) {
    return () => {};
  }

  const onNew = (payload) => {
    const item = normalizeNotification(payload);
    const current = getLocalNotifications().filter((entry) => entry.id !== item.id);
    const next = [item, ...current].slice(0, 50);
    saveLocal(next);
    emit(APP_EVENTS.NOTIFICATIONS_UPDATED, next);
  };

  socket.on('notifications:new', onNew);
  void listNotifications();

  return () => {
    socket.off('notifications:new', onNew);
  };
}

function getLocalNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocal(notifications) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  return notifications;
}

function normalizeNotification(item) {
  return {
    id: item.id,
    title: item.title,
    message: item.body ?? item.message ?? '',
    body: item.body ?? item.message ?? '',
    href: item.href ?? null,
    createdAt: item.createdAt ?? new Date().toISOString(),
    isRead: Boolean(item.isRead),
    type: item.type ?? 'info',
  };
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
