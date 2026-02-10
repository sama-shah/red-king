import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents, ServerToClientEvents, MIN_PLAYERS,
  GridPosition, Card,
} from '@red-king/shared';
import { RoomManager } from '../rooms/RoomManager.js';
import { GameEngine } from '../engine/GameEngine.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function broadcastState(io: TypedServer, roomCode: string, engine: GameEngine, players: Array<{ id: string; socketId: string }>) {
  for (const player of players) {
    const sock = io.sockets.sockets.get(player.socketId);
    if (sock) {
      sock.emit('game:state_update', engine.getStateForPlayer(player.id));
    }
  }
}

export function registerGameHandlers(
  io: TypedServer,
  socket: TypedSocket,
  roomManager: RoomManager,
) {
  socket.on('room:start', (callback) => {
    const playerId = socket.data.playerId as string | undefined;
    const roomCode = socket.data.roomCode as string | undefined;
    if (!playerId || !roomCode) return callback({ ok: false, error: 'Not in a room' });

    const room = roomManager.getRoomByCode(roomCode);
    if (!room) return callback({ ok: false, error: 'Room not found' });
    if (room.hostPlayerId !== playerId) return callback({ ok: false, error: 'Only the host can start' });
    if (room.playerCount < MIN_PLAYERS) return callback({ ok: false, error: `Need at least ${MIN_PLAYERS} players` });

    const engine = new GameEngine(room.players, room.config);
    engine.startGame();
    room.gameEngine = engine;

    callback({ ok: true });

    // Send initial state to each player
    for (const player of room.players) {
      const sock = io.sockets.sockets.get(player.socketId);
      if (sock) {
        const state = engine.getStateForPlayer(player.id);
        sock.emit('game:started', state);
        sock.emit('peek:prompt');
      }
    }
  });

  socket.on('peek:select', (slotIndices, callback) => {
    const playerId = socket.data.playerId as string | undefined;
    const roomCode = socket.data.roomCode as string | undefined;
    if (!playerId || !roomCode) return callback({ ok: false, error: 'Not in a room' });

    const room = roomManager.getRoomByCode(roomCode);
    if (!room?.gameEngine) return callback({ ok: false, error: 'No active game' });

    const result = room.gameEngine.handlePeekSelection(playerId, slotIndices);
    if (!result.ok) return callback({ ok: false, error: result.error });

    // Return the peeked cards to the player
    const grid = room.gameEngine.state.grids[playerId];
    const cards: [Card, Card] = [grid[slotIndices[0]], grid[slotIndices[1]]];
    callback({ ok: true, cards });

    io.to(roomCode).emit('peek:player_done', playerId);

    if (room.gameEngine.allPlayersPeeked()) {
      io.to(roomCode).emit('peek:phase_complete');
      broadcastState(io, roomCode, room.gameEngine, room.players);
    }
  });

  socket.on('turn:action', (action, callback) => {
    const playerId = socket.data.playerId as string | undefined;
    const roomCode = socket.data.roomCode as string | undefined;
    if (!playerId || !roomCode) return callback({ ok: false, error: 'Not in a room' });

    const room = roomManager.getRoomByCode(roomCode);
    if (!room?.gameEngine) return callback({ ok: false, error: 'No active game' });

    const result = room.gameEngine.handleTurnAction(playerId, action);
    if (!result.ok) return callback({ ok: false, error: result.error });

    callback({ ok: true });

    if (action.type === 'draw_from_pile' || action.type === 'take_from_discard') {
      io.to(roomCode).emit('turn:drew_card', {
        playerId,
        fromPile: action.type === 'draw_from_pile' ? 'draw' : 'discard',
      });
    }

    if (result.tapResult) {
      io.to(roomCode).emit('tap:result', {
        success: result.tapResult.success,
        tapperId: result.tapResult.tapperId,
        targetPlayerId: result.tapResult.targetPlayerId,
        targetSlotIndex: result.tapResult.targetSlotIndex,
        actualCard: result.tapResult.actualCard,
        description: result.tapResult.description,
      });
    }

    if (action.type === 'call') {
      io.to(roomCode).emit('game:called', {
        callerId: playerId,
        finalTurnPlayerIds: room.gameEngine.state.finalTurnPlayers,
      });
    }

    if (result.turnAdvanced) {
      handlePostTurn(io, roomCode, room.gameEngine, room.players);
    } else {
      broadcastState(io, roomCode, room.gameEngine, room.players);
    }
  });

  socket.on('turn:drawn_action', (action, callback) => {
    const playerId = socket.data.playerId as string | undefined;
    const roomCode = socket.data.roomCode as string | undefined;
    if (!playerId || !roomCode) return callback({ ok: false, error: 'Not in a room' });

    const room = roomManager.getRoomByCode(roomCode);
    if (!room?.gameEngine) return callback({ ok: false, error: 'No active game' });

    const result = room.gameEngine.handleDrawnCardAction(playerId, action);
    if (!result.ok) return callback({ ok: false, error: result.error });

    callback({ ok: true, drawnCard: result.drawnCard });

    if (result.turnAdvanced) {
      handlePostTurn(io, roomCode, room.gameEngine, room.players);
    } else {
      broadcastState(io, roomCode, room.gameEngine, room.players);
    }
  });

  socket.on('turn:power', (action, callback) => {
    const playerId = socket.data.playerId as string | undefined;
    const roomCode = socket.data.roomCode as string | undefined;
    if (!playerId || !roomCode) return callback({ ok: false, error: 'Not in a room' });

    const room = roomManager.getRoomByCode(roomCode);
    if (!room?.gameEngine) return callback({ ok: false, error: 'No active game' });

    const result = room.gameEngine.handlePowerAction(playerId, action);
    if (!result.ok) return callback({ ok: false, error: result.error });

    callback({
      ok: true,
      revealedCards: result.powerResult?.revealedCards,
    });

    if (result.powerResult) {
      io.to(roomCode).emit('turn:power_used', {
        playerId,
        powerRank: action.type,
        description: result.powerResult.description,
      });
    }

    if (result.turnAdvanced) {
      handlePostTurn(io, roomCode, room.gameEngine, room.players);
    } else {
      broadcastState(io, roomCode, room.gameEngine, room.players);
    }
  });

  socket.on('turn:swap_after_take', (slotIndex, callback) => {
    const playerId = socket.data.playerId as string | undefined;
    const roomCode = socket.data.roomCode as string | undefined;
    if (!playerId || !roomCode) return callback({ ok: false, error: 'Not in a room' });

    const room = roomManager.getRoomByCode(roomCode);
    if (!room?.gameEngine) return callback({ ok: false, error: 'No active game' });

    const result = room.gameEngine.handleSwapAfterTake(playerId, slotIndex);
    if (!result.ok) return callback({ ok: false, error: result.error });

    callback({ ok: true });

    if (result.turnAdvanced) {
      handlePostTurn(io, roomCode, room.gameEngine, room.players);
    }
  });
}

function handlePostTurn(
  io: TypedServer,
  roomCode: string,
  engine: GameEngine,
  players: Array<{ id: string; socketId: string }>,
) {
  const phase = engine.state.phase;

  if (phase === 'scoring') {
    const revealData = engine.getRevealData();
    io.to(roomCode).emit('game:reveal', { grids: revealData });

    const results = engine.getRoundResults();
    if (results) {
      io.to(roomCode).emit('game:scores', results);
    }
  }

  broadcastState(io, roomCode, engine, players);

  if (phase !== engine.state.phase) {
    io.to(roomCode).emit('game:phase_changed', engine.state.phase);
  }

  io.to(roomCode).emit('turn:started', {
    playerId: engine.getCurrentPlayerId(),
    turnPhase: engine.state.turnPhase,
  });
}
