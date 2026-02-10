import { Card, ClientCard, GridPosition } from './card.js';

export type GamePhase =
  | 'waiting'
  | 'dealing'
  | 'peeking'
  | 'playing'
  | 'final_turns'
  | 'reveal'
  | 'scoring'
  | 'finished';

export type TurnPhase =
  | 'pre_draw'
  | 'drawn'
  | 'using_power'
  | 'resolving_tap'
  | 'turn_complete';

export interface GameConfig {
  maxPlayers: number;
  turnTimeoutMs: number;
  roundsToPlay: number;
}

export interface ServerGameState {
  id: string;
  phase: GamePhase;
  turnPhase: TurnPhase;
  config: GameConfig;

  players: string[];
  currentPlayerIndex: number;
  callerPlayerId: string | null;
  finalTurnPlayers: string[];

  grids: Record<string, Card[]>;
  drawPile: Card[];
  discardPile: Card[];
  drawnCard: Card | null;

  knownCards: Record<string, string[]>;
  revealedCardIds: string[];

  scores: Record<string, number[]>;
  currentRound: number;

  turnStartedAt: number;
  createdAt: number;
}

export interface ClientGameState {
  phase: GamePhase;
  turnPhase: TurnPhase;

  players: ClientPlayerState[];
  currentPlayerId: string;
  callerPlayerId: string | null;
  isMyTurn: boolean;

  myGrid: ClientCard[];
  drawnCard: Card | null;

  drawPileCount: number;
  topDiscard: Card | null;
  discardPileCount: number;

  scores: Record<string, number[]>;
  currentRound: number;
}

export interface ClientPlayerState {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  grid: ClientCard[];
  cardCount: number;
}
