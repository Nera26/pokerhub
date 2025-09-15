import { suitFromChar } from '@shared/poker/cards';

describe('suitFromChar', () => {
  it('maps suit characters to suit names', () => {
    expect(suitFromChar('♣')).toBe('clubs');
    expect(suitFromChar('♦')).toBe('diamonds');
    expect(suitFromChar('♥')).toBe('hearts');
    expect(suitFromChar('♠')).toBe('spades');
  });
});
