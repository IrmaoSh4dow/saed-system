import { apiClient } from './api-client.js';
import { APP_EVENTS, emit } from './app-events.js';
import { getCurrentActiveCharacter } from './identity.service.js';
import { isApiAuthEnabled } from '../utils/env.js';
import { connectSocket, getSocket } from './socket-client.js';

const LEGACY_NOTIFICATIONS_KEY = 'saed.notifications';
const notificationsFetchedForCharacter = new Set();

export async function listNotifications() {
  const characterId = getActiveCharacterId();
  if (!characterId) {
    clearLegacyCache();
    emit(APP_EVENTS.NOTIFICATIONS_UPDATED, []);
    return [];
  }

  if (isApiAuthEnabled()) {
    try {
      const response = await apiClient.get('/notifications');
      const items = unwrap(response)
        .map(normalizeNotification)
        .filter((item) => matchesActiveCharacter(item, characterId));
      saveLocal(characterId, items);
      notificationsFetchedForCharacter.add(characterId);
      emit(APP_EVENTS.NOTIFICATIONS_UPDATED, items);
      return items;
    } catch {
      return getLocalNotifications(characterId);
    }
  }

  return getLocalNotifications(characterId);
}

export function getNotifications() {
  const characterId = getActiveCharacterId();
  if (!characterId) {
    return [];
  }
  return getLocalNotifications(characterId);
}

export function getUnreadNotificationsCount() {
  return getNotifications().filter((item) => !item.isRead).length;
}

export async function markNotificationAsRead(notificationId) {
  const characterId = getActiveCharacterId();
  if (!characterId) {
    return [];
  }

  if (isApiAuthEnabled()) {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    } catch {
      /* keep local fallback */
    }
  }

  const notifications = getLocalNotifications(characterId).map((item) =>
    item.id === notificationId ? { ...item, isRead: true } : item,
  );
  saveLocal(characterId, notifications);
  emit(APP_EVENTS.NOTIFICATIONS_UPDATED, notifications);
  return notifications;
}

export async function markAllNotificationsAsRead() {
  const characterId = getActiveCharacterId();
  if (!characterId) {
    return [];
  }

  if (isApiAuthEnabled()) {
    try {
      await apiClient.patch('/notifications/read-all');
    } catch {
      /* keep local fallback */
    }
  }

  const notifications = getLocalNotifications(characterId).map((item) => ({
    ...item,
    isRead: true,
  }));
  saveLocal(characterId, notifications);
  emit(APP_EVENTS.NOTIFICATIONS_UPDATED, notifications);
  return notifications;
}

/**
 * Clears in-memory/local cache for the previous character and reloads for the active one.
 */
export function resetNotificationsForActiveCharacter() {
  clearLegacyCache();
  notificationsFetchedForCharacter.clear();
  emit(APP_EVENTS.NOTIFICATIONS_UPDATED, []);
  return listNotifications();
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
    const characterId = getActiveCharacterId();
    if (!characterId) {
      return;
    }

    const item = normalizeNotification(payload);
    if (!matchesActiveCharacter(item, characterId)) {
      return;
    }

    const current = getLocalNotifications(characterId).filter((entry) => entry.id !== item.id);
    const next = [item, ...current].slice(0, 50);
    saveLocal(characterId, next);
    emit(APP_EVENTS.NOTIFICATIONS_UPDATED, next);
  };

  socket.on('notifications:new', onNew);

  // Fetch once per active character; SPA navigations must not hammer /notifications.
  const characterId = getActiveCharacterId();
  if (characterId && !notificationsFetchedForCharacter.has(characterId)) {
    void listNotifications();
  }

  return () => {
    socket.off('notifications:new', onNew);
  };
}

function getActiveCharacterId() {
  try {
    return getCurrentActiveCharacter()?.id ?? null;
  } catch {
    return null;
  }
}

function storageKey(characterId) {
  return `saed.notifications.${characterId}`;
}

function getLocalNotifications(characterId) {
  try {
    const raw = localStorage.getItem(storageKey(characterId));
    if (!raw) {
      return [];
    }
    return JSON.parse(raw).filter((item) => matchesActiveCharacter(item, characterId));
  } catch {
    return [];
  }
}

function saveLocal(characterId, notifications) {
  localStorage.setItem(storageKey(characterId), JSON.stringify(notifications));
  clearLegacyCache();
  return notifications;
}

function clearLegacyCache() {
  localStorage.removeItem(LEGACY_NOTIFICATIONS_KEY);
}

function matchesActiveCharacter(item, characterId) {
  if (!characterId) {
    return false;
  }
  // Legacy cached rows without characterId are treated as unsafe and ignored.
  if (!item.characterId) {
    return false;
  }
  return item.characterId === characterId;
}

function normalizeNotification(item) {
  return {
    id: item.id,
    characterId: item.characterId ?? null,
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
