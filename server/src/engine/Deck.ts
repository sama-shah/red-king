import { Card, Suit, Rank } from '@red-king/shared';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export class Deck {
  drawPile: Card[] = [];
  discardPile: Card[] = [];

  constructor() {
    this.drawPile = Deck.createShuffledDeck();
  }

  static createShuffledDeck(): Card[] {
    const cards: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ id: `${suit}-${rank}`, suit, rank });
      }
    }
    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }

  deal(count: number): Card[] {
    return this.drawPile.splice(0, count);
  }

  drawFromPile(): Card | null {
    if (this.drawPile.length === 0) {
      this.reshuffleDiscardIntoDraw();
    }
    return this.drawPile.shift() ?? null;
  }

  takeFromDiscard(): Card | null {
    return this.discardPile.pop() ?? null;
  }

  addToDiscard(card: Card): void {
    this.discardPile.push(card);
  }

  topOfDiscard(): Card | null {
    return this.discardPile.length > 0
      ? this.discardPile[this.discardPile.length - 1]
      : null;
  }

  get drawPileCount(): number {
    return this.drawPile.length;
  }

  private reshuffleDiscardIntoDraw(): void {
    if (this.discardPile.length <= 1) return;
    const topCard = this.discardPile.pop()!;
    this.drawPile = [...this.discardPile];
    this.discardPile = [topCard];
    // Shuffle the draw pile
    for (let i = this.drawPile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
    }
  }
}
