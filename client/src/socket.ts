import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@red-king/shared';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const URL = import.meta.env.VITE_SERVER_URL || (
  window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://red-king.onrender.com'
);

export const socket: TypedSocket = io(URL, {
  autoConnect: false,
});
