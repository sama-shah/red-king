import { GameConfig } from './game.js';
import { Player } from './player.js';

export interface Room {
  code: string;
  hostPlayerId: string;
  players: Player[];
  config: GameConfig;
  gameId: string | null;
  createdAt: number;
}

export interface RoomPublicInfo {
  code: string;
  hostPlayerName: string;
  playerCount: number;
  maxPlayers: number;
  isInGame: boolean;
}
