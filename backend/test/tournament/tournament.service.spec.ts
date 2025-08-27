import { TournamentService } from '../../src/tournament/tournament.service';

describe('TournamentService algorithms', () => {
  let service: TournamentService;

  beforeEach(() => {
    service = new TournamentService();
  });

  describe('balanceTables', () => {
    it('balances players so table sizes differ by at most one', () => {
      const tables = [['a', 'b', 'c', 'd'], ['e', 'f'], ['g']];
      const balanced = service.balanceTables(tables);
      const sizes = balanced.map((t) => t.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(7);
    });

    it('avoids moving the same player twice within N hands', () => {
      const tables = [['a', 'b', 'c', 'd'], ['e', 'f'], ['g']];
      const moved = new Map<string, number>();
      const balanced1 = service.balanceTables(tables, moved, 10, 5);
      const movedAfterFirst = moved.size;
      service.balanceTables(balanced1, moved, 12, 5);
      expect(moved.size).toBe(movedAfterFirst);
    });
  });

  describe('calculatePrizes', () => {
    it('splits prize pool by percentages', () => {
      expect(service.calculatePrizes(1000, [0.5, 0.3, 0.2]).prizes).toEqual([
        500, 300, 200,
      ]);
    });

    it('distributes remainders starting from first place', () => {
      expect(service.calculatePrizes(101, [0.5, 0.3, 0.2]).prizes).toEqual([
        51, 30, 20,
      ]);
    });

    it('handles bounty pool and satellite seats', () => {
      const res = service.calculatePrizes(1000, [1], {
        bountyPct: 0.5,
        satelliteSeatCost: 200,
      });
      expect(res.bountyPool).toBe(500);
      expect(res.seats).toBe(2);
      expect(res.remainder).toBe(0);
      expect(res.prizes[0]).toBe(100);
    });
  });
});
