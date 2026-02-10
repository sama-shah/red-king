import { ServerGameState, Card, GridPosition } from '@red-king/shared';

export interface TapResult {
  success: boolean;
  actualCard: Card;
  tapperId: string;
  targetPlayerId: string;
  targetSlotIndex: GridPosition;
  penaltyCard?: Card;
  description: string;
}

export class TapResolver {
  resolveTapSelf(
    state: ServerGameState,
    tapperId: string,
    slotIndex: GridPosition,
  ): TapResult {
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const actualCard = state.grids[tapperId][slotIndex];

    if (actualCard.rank === topDiscard.rank) {
      // Success: discard the matched card, draw replacement
      state.discardPile.push(actualCard);
      const replacement = state.drawPile.shift();
      if (replacement) {
        state.grids[tapperId][slotIndex] = replacement;
        // Player does NOT know the replacement
      }
      return {
        success: true,
        actualCard,
        tapperId,
        targetPlayerId: tapperId,
        targetSlotIndex: slotIndex,
        description: `Correct tap! Discarded ${actualCard.rank} and drew a replacement.`,
      };
    } else {
      // Fail: draw penalty card, must swap into grid
      const penaltyCard = state.drawPile.shift() ?? null;
      return {
        success: false,
        actualCard,
        tapperId,
        targetPlayerId: tapperId,
        targetSlotIndex: slotIndex,
        penaltyCard: penaltyCard ?? undefined,
        description: `Wrong! Card was ${actualCard.rank}, not ${topDiscard.rank}. Drew a penalty card.`,
      };
    }
  }

  resolveTapOther(
    state: ServerGameState,
    tapperId: string,
    targetPlayerId: string,
    targetSlotIndex: GridPosition,
  ): TapResult {
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const actualCard = state.grids[targetPlayerId][targetSlotIndex];

    if (actualCard.rank === topDiscard.rank) {
      // Success: discard target's card, tapper replaces it with one of theirs
      state.discardPile.push(actualCard);
      // The tapper will choose which of their cards to give — handled by the engine
      return {
        success: true,
        actualCard,
        tapperId,
        targetPlayerId,
        targetSlotIndex,
        description: `Correct tap on ${targetPlayerId}! Choose a card to give them.`,
      };
    } else {
      const penaltyCard = state.drawPile.shift() ?? null;
      return {
        success: false,
        actualCard,
        tapperId,
        targetPlayerId,
        targetSlotIndex,
        penaltyCard: penaltyCard ?? undefined,
        description: `Wrong! Card was ${actualCard.rank}, not ${topDiscard.rank}. Drew a penalty card.`,
      };
    }
  }
}
