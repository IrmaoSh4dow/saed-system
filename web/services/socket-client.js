import { io } from 'socket.io-client';
import { getSocketUrl } from '../utils/env.js';

let socketInstance = null;

export function getSocket() {
  if (socketInstance) {
    return socketInstance;
  }

  socketInstance = io(getSocketUrl(), {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });

  return socketInstance;
}

export function connectSocket() {
  const socket = getSocket();
  const token = localStorage.getItem('saed.jwt');

  if (token) {
    socket.auth = { token };
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socketInstance?.connected) {
    socketInstance.disconnect();
  }
}
