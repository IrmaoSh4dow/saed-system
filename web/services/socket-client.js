import { io } from 'socket.io-client';
import { getSocketUrl } from '../utils/env.js';

let socketInstance = null;

function applyAuth(socket) {
  const token = localStorage.getItem('saed.jwt');
  socket.auth = token ? { token } : {};
}

export function getSocket() {
  if (socketInstance) {
    return socketInstance;
  }

  socketInstance = io(getSocketUrl(), {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 8000,
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
 * Refresh JWT on the socket (e.g. after character switch) and force reconnect
 * so account/character rooms match the active session.
 */
export function reconnectSocketWithAuth() {
  const socket = getSocket();
  applyAuth(socket);

  if (socket.connected) {
    socket.disconnect();
  }

  socket.connect();
  return socket;
}

export function disconnectSocket() {
  if (socketInstance?.connected) {
    socketInstance.disconnect();
  }
}
