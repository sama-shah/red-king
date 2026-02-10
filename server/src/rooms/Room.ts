import { Player, GameConfig, MAX_PLAYERS } from '@red-king/shared';
import { GameEngine } from '../engine/GameEngine.js';

export class Room {
  code: string;
  hostPlayerId: string;
  players: Player[] = [];
  config: GameConfig;
  gameEngine: GameEngine | null = null;
  createdAt: number;

  constructor(code: string, host: Player, config?: Partial<GameConfig>) {
    this.code = code;
    this.hostPlayerId = host.id;
    this.players = [host];
    this.config = {
      maxPlayers: config?.maxPlayers ?? MAX_PLAYERS,
      turnTimeoutMs: config?.turnTimeoutMs ?? 0,
      roundsToPlay: config?.roundsToPlay ?? 1,
    };
    this.createdAt = Date.now();
  }

  addPlayer(player: Player): boolean {
    if (this.players.length >= this.config.maxPlayers) return false;
    if (this.players.some(p => p.id === player.id)) return false;
    this.players.push(player);
    return true;
  }

  removePlayer(playerId: string): void {
    this.players = this.players.filter(p => p.id !== playerId);
    if (this.hostPlayerId === playerId && this.players.length > 0) {
      this.hostPlayerId = this.players[0].id;
      this.players[0].isHost = true;
    }
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.find(p => p.id === playerId);
  }

  get isEmpty(): boolean {
    return this.players.length === 0;
  }

  get isInGame(): boolean {
    return this.gameEngine !== null;
  }

  get playerCount(): number {
    return this.players.length;
  }
}
