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

  // Websocket first; keep polling as fallback for Railway proxies that drop WS.
  // rememberUpgrade avoids repeated polling→websocket upgrade churn.
  socketInstance = io(getSocketUrl(), {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling'],
    rememberUpgrade: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    timeout: 20_000,
  });

  // The access token rotates every ~15 min. Without re-reading it here a reconnect
  // would replay the expired token, get rejected by the gateway and loop forever.
  socketInstance.io.on('reconnect_attempt', () => {
    applyAuth(socketInstance);
  });

  return socketInstance;
}

export function connectSocket() {
  const socket = getSocket();
  applyAuth(socket);

  if (!socket.connected && !socket.active) {
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
    if (!socket.active) {
      socket.connect();
    }
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
