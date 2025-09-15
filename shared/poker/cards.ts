export const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'] as const;
export type Rank = typeof RANKS[number];

export const SUITS = ['♣','♦','♥','♠'] as const;
export type SuitChar = typeof SUITS[number];
export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';

const SUIT_MAP: Record<SuitChar, Suit> = {
  '♣': 'clubs',
  '♦': 'diamonds',
  '♥': 'hearts',
  '♠': 'spades',
};

export function suitFromChar(char: SuitChar): Suit {
  return SUIT_MAP[char];
}
