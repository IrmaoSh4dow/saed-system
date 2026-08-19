import { io } from 'socket.io-client';
import { getSocketUrl } from '../utils/env.js';

let socketInstance = null;

function readAccessToken() {
  return localStorage.getItem('saed.jwt');
}

function applyAuth(socket) {
  const token = readAccessToken();
  socket.auth = token ? { token } : {};
}

export function getSocket() {
  if (socketInstance) {
    return socketInstance;
  }

  // Prefer a single websocket transport to avoid polling→websocket upgrade
  // cycles that look like disconnect/reconnect on every page load.
  socketInstance = io(getSocketUrl(), {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket'],
    upgrade: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    timeout: 20_000,
  });

  return socketInstance;
}

export function connectSocket() {
  const socket = getSocket();
  applyAuth(socket);

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

/**
 * Refresh JWT on the socket (e.g. after character switch).
 * Only force a reconnect when the access token actually changed.
 */
export function reconnectSocketWithAuth() {
  const socket = getSocket();
  const previousToken =
    typeof socket.auth?.token === 'string' ? socket.auth.token : null;
  applyAuth(socket);
  const nextToken = typeof socket.auth?.token === 'string' ? socket.auth.token : null;

  if (!socket.connected) {
    socket.connect();
    return socket;
  }

  if (previousToken === nextToken) {
    return socket;
  }

  socket.disconnect();
  socket.connect();
  return socket;
}

export function disconnectSocket() {
  if (socketInstance?.connected) {
    socketInstance.disconnect();
  }
}
