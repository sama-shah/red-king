import { Player, MAX_PLAYERS, MIN_PLAYERS } from '@red-king/shared';
import { Room } from './Room.js';
import { generateRoomCode, generatePlayerId } from '../utils/id-generator.js';

export class RoomManager {
  private rooms = new Map<string, Room>();
  private playerRoomMap = new Map<string, string>();

  createRoom(playerName: string, socketId: string): { room: Room; player: Player } {
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.rooms.has(code));

    const player: Player = {
      id: generatePlayerId(),
      socketId,
      name: playerName,
      isHost: true,
      isConnected: true,
      isReady: false,
    };

    const room = new Room(code, player);
    this.rooms.set(code, room);
    this.playerRoomMap.set(player.id, code);

    return { room, player };
  }

  joinRoom(roomCode: string, playerName: string, socketId: string): { room: Room; player: Player } | { error: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found' };
    if (room.isInGame) return { error: 'Game already in progress' };
    if (room.playerCount >= room.config.maxPlayers) return { error: 'Room is full' };

    const player: Player = {
      id: generatePlayerId(),
      socketId,
      name: playerName,
      isHost: false,
      isConnected: true,
      isReady: false,
    };

    if (!room.addPlayer(player)) return { error: 'Could not join room' };
    this.playerRoomMap.set(player.id, roomCode.toUpperCase());

    return { room, player };
  }

  leaveRoom(playerId: string): { room: Room; wasHost: boolean } | null {
    const roomCode = this.playerRoomMap.get(playerId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const wasHost = room.hostPlayerId === playerId;
    room.removePlayer(playerId);
    this.playerRoomMap.delete(playerId);

    if (room.isEmpty) {
      this.rooms.delete(roomCode);
    }

    return { room, wasHost };
  }

  getRoomByCode(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  getRoomByPlayerId(playerId: string): Room | undefined {
    const code = this.playerRoomMap.get(playerId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  getPlayerIdBySocketId(socketId: string): string | undefined {
    for (const [, room] of this.rooms) {
      const player = room.players.find(p => p.socketId === socketId);
      if (player) return player.id;
    }
    return undefined;
  }

  canStartGame(roomCode: string): { ok: boolean; error?: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.isInGame) return { ok: false, error: 'Game already in progress' };
    if (room.playerCount < MIN_PLAYERS) return { ok: false, error: `Need at least ${MIN_PLAYERS} players` };
    return { ok: true };
  }
}
