import { Card, Rank } from './types/card.js';

export const CARD_VALUES: Record<Rank, number> = {
  'A': 1,
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 10,
  'Q': 10,
  'K': 13,
};

export const RED_KING_VALUE = -1;
export const BLACK_KING_VALUE = 13;

export function isRedKing(card: Card): boolean {
  return card.rank === 'K' && (card.suit === 'hearts' || card.suit === 'diamonds');
}

export function isBlackKing(card: Card): boolean {
  return card.rank === 'K' && (card.suit === 'clubs' || card.suit === 'spades');
}

export function getCardValue(card: Card): number {
  if (card.rank === 'K') {
    return isRedKing(card) ? RED_KING_VALUE : BLACK_KING_VALUE;
  }
  return CARD_VALUES[card.rank];
}

export const POWER_RANKS: Rank[] = ['7', '8', '9', '10', 'J', 'Q'];

export function hasPower(card: Card): boolean {
  return POWER_RANKS.includes(card.rank) || isBlackKing(card);
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const CARDS_PER_PLAYER = 4;
export const PEEK_COUNT = 2;
export const ROOM_CODE_LENGTH = 5;
