import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, PlayerPublicInfo } from '@red-king/shared';
import { RoomManager } from '../rooms/RoomManager.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerLobbyHandlers(
  io: TypedServer,
  socket: TypedSocket,
  roomManager: RoomManager,
) {
  socket.on('room:create', (data, callback) => {
    const { room, player } = roomManager.createRoom(data.playerName, socket.id);
    socket.data.playerId = player.id;
    socket.data.roomCode = room.code;
    socket.join(room.code);

    callback({ ok: true, roomCode: room.code, playerId: player.id });

    const pubInfo: PlayerPublicInfo = {
      id: player.id,
      name: player.name,
      isHost: player.isHost,
      isConnected: player.isConnected,
    };
    socket.emit('room:state', {
      players: [pubInfo],
      hostId: player.id,
      roomCode: room.code,
    });
  });

  socket.on('room:join', (data, callback) => {
    const result = roomManager.joinRoom(data.roomCode, data.playerName, socket.id);
    if ('error' in result) {
      return callback({ ok: false, error: result.error });
    }

    const { room, player } = result;
    socket.data.playerId = player.id;
    socket.data.roomCode = room.code;
    socket.join(room.code);

    callback({ ok: true, playerId: player.id });

    const pubInfo: PlayerPublicInfo = {
      id: player.id,
      name: player.name,
      isHost: player.isHost,
      isConnected: player.isConnected,
    };

    socket.to(room.code).emit('room:player_joined', pubInfo);

    const allPlayers = room.players.map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      isConnected: p.isConnected,
    }));
    socket.emit('room:state', {
      players: allPlayers,
      hostId: room.hostPlayerId,
      roomCode: room.code,
    });
  });

  socket.on('room:leave', () => {
    const playerId = socket.data.playerId as string | undefined;
    if (!playerId) return;

    const result = roomManager.leaveRoom(playerId);
    if (!result) return;

    socket.leave(result.room.code);
    io.to(result.room.code).emit('room:player_left', playerId);

    if (result.wasHost && !result.room.isEmpty) {
      io.to(result.room.code).emit('room:host_changed', result.room.hostPlayerId);
    }
  });

  socket.on('room:ready', (isReady) => {
    const playerId = socket.data.playerId as string | undefined;
    const roomCode = socket.data.roomCode as string | undefined;
    if (!playerId || !roomCode) return;

    const room = roomManager.getRoomByCode(roomCode);
    if (!room) return;

    const player = room.getPlayer(playerId);
    if (player) {
      player.isReady = isReady;
      io.to(roomCode).emit('room:player_ready', { playerId, isReady });
    }
  });

  socket.on('disconnect', () => {
    const playerId = socket.data.playerId as string | undefined;
    if (!playerId) return;

    const room = roomManager.getRoomByPlayerId(playerId);
    if (room) {
      const player = room.getPlayer(playerId);
      if (player) {
        player.isConnected = false;
        io.to(room.code).emit('player:disconnected', { playerId });
      }

      // If not in game, remove from room after a delay
      if (!room.isInGame) {
        setTimeout(() => {
          const currentRoom = roomManager.getRoomByPlayerId(playerId);
          if (currentRoom) {
            const p = currentRoom.getPlayer(playerId);
            if (p && !p.isConnected) {
              const result = roomManager.leaveRoom(playerId);
              if (result) {
                io.to(result.room.code).emit('room:player_left', playerId);
                if (result.wasHost && !result.room.isEmpty) {
                  io.to(result.room.code).emit('room:host_changed', result.room.hostPlayerId);
                }
              }
            }
          }
        }, 30000);
      }
    }
  });
}
