// Card values
export const VALUES = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'
];

// Card suits
export const SUITS = [
  { name: 'hearts', symbol: '♥️', color: 'RED', spanish: 'corazones' },
  { name: 'diamonds', symbol: '♦️', color: 'RED', spanish: 'diamantes' },
  { name: 'clubs', symbol: '♣️', color: 'BLACK', spanish: 'tréboles' },
  { name: 'spades', symbol: '♠️', color: 'BLACK', spanish: 'picas' }
];

// Numeric values for comparison
export const VALUE_MAP = {
  'A': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13
};

export class Card {
  constructor(value, suit) {
    this.value = value;
    this.suit = suit;
    this.numericValue = VALUE_MAP[value];
  }

  toString() {
    return `${this.value}${this.suit.symbol}`;
  }

  get color() {
    return this.suit.color;
  }

  get suitName() {
    return this.suit.name;
  }

  get spanishSuit() {
    return this.suit.spanish;
  }

  // Used for displaying cards in Discord
  get displayName() {
    return `${this.value} de ${this.spanishSuit} ${this.suit.symbol}`;
  }
}