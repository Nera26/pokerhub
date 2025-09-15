import { RANKS, SUITS, suitFromChar } from '@shared/poker/cards';

describe('shared card helpers', () => {
  const cardToString = (card: number): string => {
    const rank = RANKS[Math.floor(card / 4)] ?? '?';
    const suit = SUITS[card % 4] ?? '?';
    return `${rank}${suit}`;
  };

  it('converts numeric cards to strings', () => {
    expect(cardToString(0)).toBe('2♣');
    expect(cardToString(51)).toBe('A♠');
  });

  it('maps suit characters to suit names', () => {
    expect(suitFromChar('♣')).toBe('clubs');
    expect(suitFromChar('♦')).toBe('diamonds');
    expect(suitFromChar('♥')).toBe('hearts');
    expect(suitFromChar('♠')).toBe('spades');
  });
});
