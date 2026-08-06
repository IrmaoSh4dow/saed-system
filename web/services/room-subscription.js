import { connectSocket } from './socket-client.js';

/**
 * Subscribe to a case/chat room with automatic rejoin on reconnect.
 * Centralizes Socket.IO room lifecycle for admin-requests, complaints, appointments.
 *
 * @param {object} options
 * @param {string} options.joinEvent
 * @param {string} options.leaveEvent
 * @param {object} options.joinPayload
 * @param {Record<string, Function>} options.events
 * @returns {() => void} cleanup
 */
export function subscribeCaseRoom({
  joinEvent,
  leaveEvent,
  joinPayload,
  events = {},
}) {
  const socket = connectSocket();
  if (!socket || !joinEvent || !leaveEvent) {
    return () => {};
  }

  const join = () => {
    socket.emit(joinEvent, joinPayload);
  };

  join();

  const onConnect = () => {
    join();
  };

  socket.on('connect', onConnect);

  const bound = Object.entries(events).map(([event, handler]) => {
    const wrapped = (...args) => handler(...args);
    socket.on(event, wrapped);
    return [event, wrapped];
  });

  return () => {
    socket.emit(leaveEvent, joinPayload);
    socket.off('connect', onConnect);
    bound.forEach(([event, handler]) => {
      socket.off(event, handler);
    });
  };
}
