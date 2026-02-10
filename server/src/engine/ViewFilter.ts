import {
  ServerGameState, ClientGameState, ClientPlayerState, ClientCard,
  Player, GridPosition,
} from '@red-king/shared';

export class ViewFilter {
  filterForPlayer(
    state: ServerGameState,
    playerId: string,
    playerRegistry: Map<string, Player>,
  ): ClientGameState {
    const currentPlayerId = state.players[state.currentPlayerIndex];
    const knownCardIds = new Set(state.knownCards[playerId] ?? []);
    const revealedIds = new Set(state.revealedCardIds);

    return {
      phase: state.phase,
      turnPhase: state.turnPhase,
      currentPlayerId,
      callerPlayerId: state.callerPlayerId,
      isMyTurn: currentPlayerId === playerId,

      myGrid: this.buildGrid(state, playerId, knownCardIds, revealedIds),
      drawnCard: currentPlayerId === playerId ? state.drawnCard : null,

      players: state.players.map(pid =>
        this.buildPlayerView(state, pid, knownCardIds, revealedIds, playerRegistry)
      ),

      drawPileCount: state.drawPile.length,
      topDiscard: state.discardPile.length > 0
        ? state.discardPile[state.discardPile.length - 1]
        : null,
      discardPileCount: state.discardPile.length,

      scores: state.scores,
      currentRound: state.currentRound,
    };
  }

  private buildGrid(
    state: ServerGameState,
    playerId: string,
    knownCardIds: Set<string>,
    revealedIds: Set<string>,
  ): ClientCard[] {
    const cards = state.grids[playerId] ?? [];
    return cards.map((card, index) => ({
      slotIndex: index as GridPosition,
      card: (knownCardIds.has(card.id) || revealedIds.has(card.id)) ? card : null,
      isRevealed: revealedIds.has(card.id),
    }));
  }

  private buildPlayerView(
    state: ServerGameState,
    targetId: string,
    viewerKnownIds: Set<string>,
    revealedIds: Set<string>,
    playerRegistry: Map<string, Player>,
  ): ClientPlayerState {
    const targetGrid = state.grids[targetId] ?? [];
    const player = playerRegistry.get(targetId);

    return {
      id: targetId,
      name: player?.name ?? 'Unknown',
      isHost: player?.isHost ?? false,
      isConnected: player?.isConnected ?? false,
      cardCount: targetGrid.length,
      grid: targetGrid.map((card, index) => ({
        slotIndex: index as GridPosition,
        card: (revealedIds.has(card.id) || viewerKnownIds.has(card.id)) ? card : null,
        isRevealed: revealedIds.has(card.id),
      })),
    };
  }
}
