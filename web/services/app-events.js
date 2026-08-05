const listeners = new Map();

export function subscribe(eventName, handler) {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, new Set());
  }

  listeners.get(eventName).add(handler);

  return () => {
    listeners.get(eventName)?.delete(handler);
  };
}

export function emit(eventName, payload) {
  const handlers = listeners.get(eventName);
  if (!handlers) {
    return;
  }

  for (const handler of handlers) {
    handler(payload);
  }
}

export const APP_EVENTS = {
  CHARACTER_CHANGED: 'character:changed',
  NOTIFICATIONS_UPDATED: 'notifications:updated',
  SESSION_CLEARED: 'session:cleared',
};
