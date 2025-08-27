import { TournamentService } from '../../src/tournament/tournament.service';

describe('TournamentService algorithms', () => {
  let service: TournamentService;

  beforeEach(() => {
    service = new TournamentService();
  });

  describe('balanceTables', () => {
    it('balances players so table sizes differ by at most one', () => {
      const tables = [
        ['a', 'b', 'c', 'd'],
        ['e', 'f'],
        ['g'],
      ];
      const balanced = service.balanceTables(tables);
      const sizes = balanced.map((t) => t.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(7);
    });
  });

  describe('calculatePrizes', () => {
    it('splits prize pool by percentages', () => {
      expect(service.calculatePrizes(1000, [0.5, 0.3, 0.2])).toEqual([500, 300, 200]);
    });

    it('distributes remainders starting from first place', () => {
      expect(service.calculatePrizes(101, [0.5, 0.3, 0.2])).toEqual([51, 30, 20]);
    });
  });
});
