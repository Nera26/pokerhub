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

    it('avoids moving the same player twice within N hands', () => {
      const tables = [
        ['a', 'b', 'c', 'd'],
        ['e'],
        [],
      ];
      const moved: Record<string, number> = {};
      let result = service.balanceTables(tables, moved, 2);
      const firstMoved = Object.keys(moved)[0];
      // a new player sits at table 0 causing imbalance again
      result[0].push('x');
      result = service.balanceTables(result, moved, 2);
      expect(moved[firstMoved]).toBeGreaterThan(0);
      const zeros = Object.values(moved).filter((v) => v === 0);
      expect(zeros.length).toBe(1);
    });
  });

  describe('calculatePrizes', () => {
    it('splits prize pool by percentages', () => {
      expect(service.calculatePrizes(1000, [0.5, 0.3, 0.2]).prizes).toEqual([
        500,
        300,
        200,
      ]);
    });

    it('distributes remainders starting from first place', () => {
      expect(service.calculatePrizes(101, [0.5, 0.3, 0.2]).prizes).toEqual([
        51,
        30,
        20,
      ]);
    });

    it('handles bounty and PKO prizes', () => {
      expect(
        service.calculatePrizes(1000, [1], { bounty: 100, pko: true }),
      ).toEqual({ prizes: [1000], bounty: 50, pko: true });
    });

    it('handles satellite ticket logic', () => {
      expect(
        service.calculatePrizes(500, [], { satelliteTicketValue: 100 }),
      ).toEqual({ prizes: [100, 100, 100, 100, 100], seats: 5 });
    });
  });
});
