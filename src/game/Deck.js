import { VALUES, SUITS, Card } from './Card.js';

export class Deck {
  constructor() {
    this.cards = [];
    this.init();
    this.shuffle();
  }

  init() {
    // Create a new deck with all 52 cards
    for (const suit of SUITS) {
      for (const value of VALUES) {
        this.cards.push(new Card(value, suit));
      }
    }
  }

  shuffle() {
    // Fisher-Yates shuffle algorithm
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal() {
    if (this.cards.length === 0) {
      throw new Error('No cards left in the deck');
    }
    return this.cards.pop();
  }

  get remainingCards() {
    return this.cards.length;
  }
}