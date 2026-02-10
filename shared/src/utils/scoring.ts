import { Card } from '../types/card.js';
import { getCardValue } from '../constants.js';

export function calculateScore(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + getCardValue(card), 0);
}

export function determineWinner(roundScores: Record<string, number>): string {
  return Object.entries(roundScores)
    .sort(([, a], [, b]) => a - b)[0][0];
}
