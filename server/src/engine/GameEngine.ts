import {
  ServerGameState, ClientGameState, GameConfig, Player,
  GridPosition, TurnAction, DrawnCardAction, PowerAction,
  Card, hasPower, isBlackKing, CARDS_PER_PLAYER,
} from '@red-king/shared';
import { Deck } from './Deck.js';
import { StateMachine } from './StateMachine.js';
import { ViewFilter } from './ViewFilter.js';
import { TapResolver, TapResult } from './TapResolver.js';
import { PowerResolver, PowerResult } from './PowerResolver.js';
import { Scorer } from './Scorer.js';
import { v4 as uuidv4 } from 'uuid';

export interface ActionResult {
  ok: boolean;
  error?: string;
  tapResult?: TapResult;
  powerResult?: PowerResult;
  drawnCard?: Card;
  turnAdvanced?: boolean;
  gamePhaseChanged?: boolean;
  roundScores?: Record<string, number>;
  roundWinner?: string;
}

export class GameEngine {
  state: ServerGameState;
  private sm: StateMachine;
  private deck: Deck;
  private viewFilter: ViewFilter;
  private tapResolver: TapResolver;
  private powerResolver: PowerResolver;
  private scorer: Scorer;
  private playerRegistry: Map<string, Player>;
  private peekedPlayers: Set<string> = new Set();
  private blackKingPhase: 'look' | 'swap' | null = null;

  constructor(players: Player[], config: GameConfig) {
    this.sm = new StateMachine();
    this.deck = new Deck();
    this.viewFilter = new ViewFilter();
    this.tapResolver = new TapResolver();
    this.powerResolver = new PowerResolver();
    this.scorer = new Scorer();

    this.playerRegistry = new Map(players.map(p => [p.id, p]));

    const playerIds = players.map(p => p.id);
    const grids: Record<string, Card[]> = {};
    const knownCards: Record<string, string[]> = {};
    const scores: Record<string, number[]> = {};

    for (const pid of playerIds) {
      grids[pid] = this.deck.deal(CARDS_PER_PLAYER);
      knownCards[pid] = [];
      scores[pid] = [];
    }

    // Flip first card to discard pile
    const firstDiscard = this.deck.drawFromPile();
    if (firstDiscard) this.deck.addToDiscard(firstDiscard);

    this.state = {
      id: uuidv4(),
      phase: 'waiting',
      turnPhase: 'pre_draw',
      config,
      players: playerIds,
      currentPlayerIndex: 0,
      callerPlayerId: null,
      finalTurnPlayers: [],
      grids,
      drawPile: this.deck.drawPile,
      discardPile: this.deck.discardPile,
      drawnCard: null,
      knownCards,
      revealedCardIds: [],
      scores,
      currentRound: 1,
      turnStartedAt: Date.now(),
      createdAt: Date.now(),
    };
  }

  startGame(): void {
    this.sm.transition('dealing');
    this.state.phase = 'dealing';
    this.sm.transition('peeking');
    this.state.phase = 'peeking';
  }

  handlePeekSelection(playerId: string, slots: [GridPosition, GridPosition]): ActionResult {
    if (this.state.phase !== 'peeking') {
      return { ok: false, error: 'Not in peek phase' };
    }
    if (this.peekedPlayers.has(playerId)) {
      return { ok: false, error: 'Already peeked' };
    }
    if (slots[0] === slots[1]) {
      return { ok: false, error: 'Must pick two different cards' };
    }

    const grid = this.state.grids[playerId];
    const card1 = grid[slots[0]];
    const card2 = grid[slots[1]];

    if (!this.state.knownCards[playerId]) this.state.knownCards[playerId] = [];
    this.state.knownCards[playerId].push(card1.id, card2.id);
    this.peekedPlayers.add(playerId);

    const allPeeked = this.state.players.every(pid => this.peekedPlayers.has(pid));
    if (allPeeked) {
      this.sm.transition('playing');
      this.state.phase = 'playing';
      this.state.turnStartedAt = Date.now();
    }

    return { ok: true, drawnCard: undefined, gamePhaseChanged: allPeeked };
  }

  allPlayersPeeked(): boolean {
    return this.state.players.every(pid => this.peekedPlayers.has(pid));
  }

  handleTurnAction(playerId: string, action: TurnAction): ActionResult {
    if (!this.isPlayerTurn(playerId)) {
      return { ok: false, error: 'Not your turn' };
    }
    if (this.state.turnPhase !== 'pre_draw') {
      return { ok: false, error: `Invalid action for turn phase: ${this.state.turnPhase}` };
    }

    switch (action.type) {
      case 'draw_from_pile':
        return this.handleDrawFromPile(playerId);
      case 'take_from_discard':
        return this.handleTakeFromDiscard(playerId);
      case 'tap_self':
        return this.handleTapSelf(playerId, action.slotIndex);
      case 'tap_other':
        return this.handleTapOther(playerId, action.targetPlayerId, action.targetSlotIndex);
      case 'call':
        return this.handleCall(playerId);
      default:
        return { ok: false, error: 'Unknown action' };
    }
  }

  handleDrawnCardAction(playerId: string, action: DrawnCardAction): ActionResult {
    if (!this.isPlayerTurn(playerId)) {
      return { ok: false, error: 'Not your turn' };
    }
    if (this.state.turnPhase !== 'drawn') {
      return { ok: false, error: 'No drawn card in hand' };
    }
    if (!this.state.drawnCard) {
      return { ok: false, error: 'No drawn card' };
    }

    switch (action.type) {
      case 'swap_with_grid':
        return this.handleSwapDrawnWithGrid(playerId, action.slotIndex);
      case 'discard_drawn':
        return this.handleDiscardDrawn(playerId);
      case 'use_power':
        return this.handleUsePower(playerId);
      default:
        return { ok: false, error: 'Unknown drawn card action' };
    }
  }

  handlePowerAction(playerId: string, action: PowerAction): ActionResult {
    if (!this.isPlayerTurn(playerId)) {
      return { ok: false, error: 'Not your turn' };
    }
    if (this.state.turnPhase !== 'using_power') {
      return { ok: false, error: 'Not in power phase' };
    }

    // Handle Black King two-phase
    if (this.blackKingPhase === 'look' && action.type !== 'black_king_look') {
      return { ok: false, error: 'Must look at cards first (Black King)' };
    }
    if (this.blackKingPhase === 'swap' && action.type !== 'black_king_swap') {
      return { ok: false, error: 'Must swap cards now (Black King)' };
    }

    const result = this.powerResolver.resolve(this.state, playerId, action);

    if (action.type === 'black_king_look') {
      this.blackKingPhase = 'swap';
      return { ok: true, powerResult: result };
    }

    // Power resolved — discard the power card and end turn
    if (this.state.drawnCard) {
      this.deck.addToDiscard(this.state.drawnCard);
      this.state.drawnCard = null;
    }
    this.blackKingPhase = null;
    this.advanceTurn();
    return { ok: true, powerResult: result, turnAdvanced: true };
  }

  getStateForPlayer(playerId: string): ClientGameState {
    return this.viewFilter.filterForPlayer(this.state, playerId, this.playerRegistry);
  }

  getCurrentPlayerId(): string {
    return this.state.players[this.state.currentPlayerIndex];
  }

  // --- Private helpers ---

  private isPlayerTurn(playerId: string): boolean {
    return this.state.players[this.state.currentPlayerIndex] === playerId;
  }

  private handleDrawFromPile(playerId: string): ActionResult {
    const card = this.deck.drawFromPile();
    if (!card) return { ok: false, error: 'Draw pile is empty' };

    this.state.drawnCard = card;
    this.sm.transitionTurn('drawn');
    this.state.turnPhase = 'drawn';

    return { ok: true, drawnCard: card };
  }

  private handleTakeFromDiscard(playerId: string): ActionResult {
    const card = this.deck.takeFromDiscard();
    if (!card) return { ok: false, error: 'Discard pile is empty' };

    // Player must swap with a grid card — store the taken card temporarily
    this.state.drawnCard = card;
    // Mark known since it was face-up
    if (!this.state.knownCards[playerId]) this.state.knownCards[playerId] = [];
    if (!this.state.knownCards[playerId].includes(card.id)) {
      this.state.knownCards[playerId].push(card.id);
    }

    this.sm.transitionTurn('drawn');
    this.state.turnPhase = 'drawn';

    return { ok: true, drawnCard: card };
  }

  handleSwapAfterTake(playerId: string, slotIndex: GridPosition): ActionResult {
    if (!this.state.drawnCard) return { ok: false, error: 'No card to swap' };

    const oldCard = this.state.grids[playerId][slotIndex];
    this.state.grids[playerId][slotIndex] = this.state.drawnCard;
    this.deck.addToDiscard(oldCard);

    // Player knows what they placed
    if (!this.state.knownCards[playerId].includes(this.state.drawnCard.id)) {
      this.state.knownCards[playerId].push(this.state.drawnCard.id);
    }
    // Remove knowledge of the discarded card from this slot
    this.state.knownCards[playerId] = this.state.knownCards[playerId].filter(id => id !== oldCard.id);

    this.state.drawnCard = null;
    this.advanceTurn();
    return { ok: true, turnAdvanced: true };
  }

  private handleSwapDrawnWithGrid(playerId: string, slotIndex: GridPosition): ActionResult {
    if (!this.state.drawnCard) return { ok: false, error: 'No drawn card' };

    const oldCard = this.state.grids[playerId][slotIndex];
    this.state.grids[playerId][slotIndex] = this.state.drawnCard;
    this.deck.addToDiscard(oldCard);

    // Player knows the new card in their grid
    if (!this.state.knownCards[playerId]) this.state.knownCards[playerId] = [];
    if (!this.state.knownCards[playerId].includes(this.state.drawnCard.id)) {
      this.state.knownCards[playerId].push(this.state.drawnCard.id);
    }
    this.state.knownCards[playerId] = this.state.knownCards[playerId].filter(id => id !== oldCard.id);

    this.state.drawnCard = null;
    this.advanceTurn();
    return { ok: true, turnAdvanced: true };
  }

  private handleDiscardDrawn(playerId: string): ActionResult {
    if (!this.state.drawnCard) return { ok: false, error: 'No drawn card' };
    this.deck.addToDiscard(this.state.drawnCard);
    this.state.drawnCard = null;
    this.advanceTurn();
    return { ok: true, turnAdvanced: true };
  }

  private handleUsePower(playerId: string): ActionResult {
    if (!this.state.drawnCard) return { ok: false, error: 'No drawn card' };
    if (!hasPower(this.state.drawnCard)) {
      return { ok: false, error: 'Card has no power' };
    }

    this.sm.transitionTurn('using_power');
    this.state.turnPhase = 'using_power';

    if (isBlackKing(this.state.drawnCard)) {
      this.blackKingPhase = 'look';
    }

    return { ok: true, drawnCard: this.state.drawnCard };
  }

  private handleTapSelf(playerId: string, slotIndex: GridPosition): ActionResult {
    if (this.state.discardPile.length === 0) {
      return { ok: false, error: 'No discard to match against' };
    }

    this.sm.transitionTurn('resolving_tap');
    this.state.turnPhase = 'resolving_tap';

    const tapResult = this.tapResolver.resolveTapSelf(this.state, playerId, slotIndex);

    if (tapResult.success) {
      this.advanceTurn();
      return { ok: true, tapResult, turnAdvanced: true };
    } else {
      // Penalty: player gets an extra card they need to deal with
      // For simplicity, auto-advance — the penalty card was already drawn by TapResolver
      this.advanceTurn();
      return { ok: true, tapResult, turnAdvanced: true };
    }
  }

  private handleTapOther(playerId: string, targetPlayerId: string, targetSlotIndex: GridPosition): ActionResult {
    if (this.state.discardPile.length === 0) {
      return { ok: false, error: 'No discard to match against' };
    }
    if (!this.state.players.includes(targetPlayerId)) {
      return { ok: false, error: 'Invalid target player' };
    }

    this.sm.transitionTurn('resolving_tap');
    this.state.turnPhase = 'resolving_tap';

    const tapResult = this.tapResolver.resolveTapOther(this.state, playerId, targetPlayerId, targetSlotIndex);

    // For both success and failure, advance the turn
    this.advanceTurn();
    return { ok: true, tapResult, turnAdvanced: true };
  }

  private handleCall(playerId: string): ActionResult {
    if (this.state.callerPlayerId) {
      return { ok: false, error: 'Someone already called' };
    }

    this.state.callerPlayerId = playerId;

    // Determine who gets final turns (everyone except the caller)
    this.state.finalTurnPlayers = this.state.players.filter(pid => pid !== playerId);

    if (this.state.phase === 'playing') {
      this.sm.transition('final_turns');
      this.state.phase = 'final_turns';
    }

    this.advanceTurn();
    return { ok: true, turnAdvanced: true, gamePhaseChanged: true };
  }

  private advanceTurn(): void {
    this.sm.resetTurn();
    this.state.turnPhase = 'pre_draw';

    // Move to next player
    let nextIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;

    if (this.state.phase === 'final_turns') {
      // Skip the caller and players who have already taken their final turn
      let checked = 0;
      while (checked < this.state.players.length) {
        const nextPid = this.state.players[nextIndex];
        if (this.state.finalTurnPlayers.includes(nextPid)) {
          // This player still needs their final turn
          this.state.finalTurnPlayers = this.state.finalTurnPlayers.filter(id => id !== nextPid);
          break;
        }
        nextIndex = (nextIndex + 1) % this.state.players.length;
        checked++;
      }

      // If no one left needs a final turn, go to reveal
      if (checked >= this.state.players.length || this.state.finalTurnPlayers.length === 0) {
        this.endRound();
        return;
      }
    }

    this.state.currentPlayerIndex = nextIndex;
    this.state.turnStartedAt = Date.now();
  }

  private endRound(): void {
    this.sm.transition('reveal');
    this.state.phase = 'reveal';

    const roundScores = this.scorer.calculateRoundScores(this.state);
    for (const [pid, score] of Object.entries(roundScores)) {
      if (!this.state.scores[pid]) this.state.scores[pid] = [];
      this.state.scores[pid].push(score);
    }

    this.sm.transition('scoring');
    this.state.phase = 'scoring';
  }

  getRoundResults(): { roundScores: Record<string, number>; totalScores: Record<string, number[]>; roundWinner: string } | null {
    if (this.state.phase !== 'scoring') return null;
    const lastRoundScores: Record<string, number> = {};
    for (const pid of this.state.players) {
      const scores = this.state.scores[pid];
      lastRoundScores[pid] = scores[scores.length - 1];
    }
    return {
      roundScores: lastRoundScores,
      totalScores: this.state.scores,
      roundWinner: this.scorer.determineRoundWinner(lastRoundScores),
    };
  }

  getRevealData(): Record<string, Array<{ slotIndex: GridPosition; card: Card }>> {
    const result: Record<string, Array<{ slotIndex: GridPosition; card: Card }>> = {};
    for (const pid of this.state.players) {
      result[pid] = this.state.grids[pid].map((card, i) => ({
        slotIndex: i as GridPosition,
        card,
      }));
    }
    return result;
  }
}
