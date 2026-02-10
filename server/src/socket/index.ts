import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '@red-king/shared';
import { RoomManager } from '../rooms/RoomManager.js';
import { registerLobbyHandlers } from './lobby-handlers.js';
import { registerGameHandlers } from './game-handlers.js';

export function createSocketServer(httpServer: HttpServer, roomManager: RoomManager) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    registerLobbyHandlers(io, socket, roomManager);
    registerGameHandlers(io, socket, roomManager);
  });

  return io;
}
