import { Card, GridPosition } from '../types/card.js';
import { ClientGameState, GamePhase } from '../types/game.js';
import { PlayerPublicInfo } from '../types/player.js';

export interface ServerToClientEvents {
  'room:player_joined': (player: PlayerPublicInfo) => void;
  'room:player_left': (playerId: string) => void;
  'room:player_ready': (data: { playerId: string; isReady: boolean }) => void;
  'room:host_changed': (newHostId: string) => void;
  'room:state': (data: {
    players: PlayerPublicInfo[];
    hostId: string;
    roomCode: string;
  }) => void;

  'game:started': (state: ClientGameState) => void;
  'game:phase_changed': (phase: GamePhase) => void;
  'game:state_update': (state: ClientGameState) => void;

  'peek:prompt': () => void;
  'peek:player_done': (playerId: string) => void;
  'peek:phase_complete': () => void;

  'turn:started': (data: { playerId: string; turnPhase: string }) => void;
  'turn:drew_card': (data: { playerId: string; fromPile: 'draw' | 'discard' }) => void;
  'turn:swapped': (data: { playerId: string; slotIndex: GridPosition; discardedCard: Card }) => void;
  'turn:discarded': (data: { playerId: string; card: Card }) => void;
  'turn:power_used': (data: { playerId: string; powerRank: string; description: string }) => void;
  'turn:ended': (data: { nextPlayerId: string }) => void;

  'tap:attempted': (data: {
    tapperId: string;
    targetPlayerId: string;
    targetSlotIndex: GridPosition;
  }) => void;
  'tap:result': (data: {
    success: boolean;
    tapperId: string;
    targetPlayerId: string;
    targetSlotIndex: GridPosition;
    actualCard: Card;
    description: string;
  }) => void;

  'game:called': (data: { callerId: string; finalTurnPlayerIds: string[] }) => void;
  'game:final_turn': (data: { playerId: string }) => void;

  'game:reveal': (data: {
    grids: Record<string, Array<{ slotIndex: GridPosition; card: Card }>>;
  }) => void;
  'game:scores': (data: {
    roundScores: Record<string, number>;
    totalScores: Record<string, number[]>;
    roundWinner: string;
  }) => void;

  'error': (data: { message: string; code: string }) => void;
  'player:reconnected': (data: { playerId: string }) => void;
  'player:disconnected': (data: { playerId: string }) => void;
}
