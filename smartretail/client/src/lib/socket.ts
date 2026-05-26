// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';
let socket: Socket | null = null;
export function getSocket(): Socket {
  if (!socket) {
    const url = import.meta.env.VITE_API_URL || window.location.origin;
    socket = io(url, {
      transports: ['websocket','polling'],
      auth: { token: localStorage.getItem('sr_token') },
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socket.on('connect',    () => console.log('[WS] connected', socket?.id));
    socket.on('disconnect', (r) => console.log('[WS] disconnected', r));
  }
  return socket;
}
export function disconnect() { if (socket) { socket.disconnect(); socket = null; } }
export default getSocket;
