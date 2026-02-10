import {
  ServerGameState, Card, GridPosition, PowerAction, isBlackKing,
} from '@red-king/shared';

export interface PowerResult {
  revealedCards?: Array<{ playerId: string; slotIndex: GridPosition; card: Card }>;
  swapPerformed?: { from: CardLocation; to: CardLocation };
  description: string;
}

interface CardLocation {
  playerId: string;
  slotIndex: GridPosition;
}

export class PowerResolver {
  resolve(state: ServerGameState, playerId: string, action: PowerAction): PowerResult {
    switch (action.type) {
      case 'peek_own':
        return this.resolve7(state, playerId, action.slotIndex);
      case 'peek_other':
        return this.resolve8(state, playerId, action.targetPlayerId, action.targetSlotIndex);
      case 'swap_own_with_other':
        return this.resolve9(state, playerId, action.mySlotIndex, action.targetPlayerId, action.targetSlotIndex);
      case 'look_at_two':
        return this.resolve10(state, playerId, action.selections);
      case 'blind_swap':
        return this.resolveJack(state, action.from, action.to);
      case 'reveal_own':
        return this.resolveQueen(state, playerId, action.slotIndex);
      case 'black_king_look':
        return this.resolveBlackKingLook(state, playerId, action.selections);
      case 'black_king_swap':
        return this.resolveBlackKingSwap(state, action.from, action.to);
    }
  }

  private resolve7(state: ServerGameState, playerId: string, slotIndex: GridPosition): PowerResult {
    const card = state.grids[playerId][slotIndex];
    this.addKnowledge(state, playerId, card.id);
    return {
      revealedCards: [{ playerId, slotIndex, card }],
      description: `Peeked at own card in slot ${slotIndex}.`,
    };
  }

  private resolve8(
    state: ServerGameState,
    playerId: string,
    targetPlayerId: string,
    targetSlotIndex: GridPosition,
  ): PowerResult {
    const card = state.grids[targetPlayerId][targetSlotIndex];
    this.addKnowledge(state, playerId, card.id);
    return {
      revealedCards: [{ playerId: targetPlayerId, slotIndex: targetSlotIndex, card }],
      description: `Peeked at ${targetPlayerId}'s card in slot ${targetSlotIndex}.`,
    };
  }

  private resolve9(
    state: ServerGameState,
    playerId: string,
    mySlotIndex: GridPosition,
    targetPlayerId: string,
    targetSlotIndex: GridPosition,
  ): PowerResult {
    const myCard = state.grids[playerId][mySlotIndex];
    const theirCard = state.grids[targetPlayerId][targetSlotIndex];

    // Perform swap
    state.grids[playerId][mySlotIndex] = theirCard;
    state.grids[targetPlayerId][targetSlotIndex] = myCard;

    // Invalidate knowledge of swapped positions
    this.removeKnowledge(state, playerId, myCard.id);
    this.removeKnowledge(state, playerId, theirCard.id);
    this.removeKnowledge(state, targetPlayerId, myCard.id);
    this.removeKnowledge(state, targetPlayerId, theirCard.id);

    return {
      swapPerformed: {
        from: { playerId, slotIndex: mySlotIndex },
        to: { playerId: targetPlayerId, slotIndex: targetSlotIndex },
      },
      description: `Swapped own card with ${targetPlayerId}'s card.`,
    };
  }

  private resolve10(
    state: ServerGameState,
    playerId: string,
    selections: Array<{ playerId: string; slotIndex: GridPosition }>,
  ): PowerResult {
    const revealedCards = selections.map(sel => {
      const card = state.grids[sel.playerId][sel.slotIndex];
      this.addKnowledge(state, playerId, card.id);
      return { playerId: sel.playerId, slotIndex: sel.slotIndex, card };
    });
    return {
      revealedCards,
      description: `Looked at ${selections.length} cards.`,
    };
  }

  private resolveJack(
    state: ServerGameState,
    from: CardLocation,
    to: CardLocation,
  ): PowerResult {
    const cardA = state.grids[from.playerId][from.slotIndex];
    const cardB = state.grids[to.playerId][to.slotIndex];

    // Perform blind swap
    state.grids[from.playerId][from.slotIndex] = cardB;
    state.grids[to.playerId][to.slotIndex] = cardA;

    // Invalidate all knowledge of these cards
    for (const pid of state.players) {
      this.removeKnowledge(state, pid, cardA.id);
      this.removeKnowledge(state, pid, cardB.id);
    }

    return {
      swapPerformed: { from, to },
      description: `Blind swapped cards between two positions.`,
    };
  }

  private resolveQueen(state: ServerGameState, playerId: string, slotIndex: GridPosition): PowerResult {
    const card = state.grids[playerId][slotIndex];
    state.revealedCardIds.push(card.id);
    return {
      revealedCards: [{ playerId, slotIndex, card }],
      description: `Permanently revealed own card in slot ${slotIndex}.`,
    };
  }

  private resolveBlackKingLook(
    state: ServerGameState,
    playerId: string,
    selections: Array<{ playerId: string; slotIndex: GridPosition }>,
  ): PowerResult {
    const revealedCards = selections.map(sel => {
      const card = state.grids[sel.playerId][sel.slotIndex];
      this.addKnowledge(state, playerId, card.id);
      return { playerId: sel.playerId, slotIndex: sel.slotIndex, card };
    });
    return {
      revealedCards,
      description: `Black King: Looked at ${selections.length} cards.`,
    };
  }

  private resolveBlackKingSwap(
    state: ServerGameState,
    from: CardLocation,
    to: CardLocation,
  ): PowerResult {
    const cardA = state.grids[from.playerId][from.slotIndex];
    const cardB = state.grids[to.playerId][to.slotIndex];

    state.grids[from.playerId][from.slotIndex] = cardB;
    state.grids[to.playerId][to.slotIndex] = cardA;

    // Invalidate knowledge for all players about these cards
    for (const pid of state.players) {
      this.removeKnowledge(state, pid, cardA.id);
      this.removeKnowledge(state, pid, cardB.id);
    }

    return {
      swapPerformed: { from, to },
      description: `Black King: Swapped two cards.`,
    };
  }

  private addKnowledge(state: ServerGameState, playerId: string, cardId: string): void {
    if (!state.knownCards[playerId]) {
      state.knownCards[playerId] = [];
    }
    if (!state.knownCards[playerId].includes(cardId)) {
      state.knownCards[playerId].push(cardId);
    }
  }

  private removeKnowledge(state: ServerGameState, playerId: string, cardId: string): void {
    if (state.knownCards[playerId]) {
      state.knownCards[playerId] = state.knownCards[playerId].filter(id => id !== cardId);
    }
  }
}
