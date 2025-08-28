import {
  TournamentService,
} from '../../src/tournament/tournament.service';
import {
  Tournament,
  TournamentState,
} from '../../src/database/entities/tournament.entity';
import { Seat } from '../../src/database/entities/seat.entity';
import { Table } from '../../src/database/entities/table.entity';
import { Repository } from 'typeorm';

describe('TournamentService algorithms', () => {
  let service: TournamentService;
  let scheduler: any;
  let tournamentsRepo: any;
  let seatsRepo: any;
  let tablesRepo: any;

  function createRepo<T extends { id: string }>(initial: T[] = []) {
    const items = new Map(initial.map((i) => [i.id, i]));
    return {
      find: jest.fn(async () => Array.from(items.values())),
      findOne: jest.fn(async ({ where: { id } }) => items.get(id)),
      save: jest.fn(async (obj: T) => {
        items.set(obj.id, obj);
        return obj;
      }),
    };
  }

  beforeEach(() => {
    scheduler = {
      scheduleRegistration: jest.fn(),
      scheduleBreak: jest.fn(),
      scheduleLevelUps: jest.fn(),
    };
    tournamentsRepo = createRepo<Tournament>([
      {
        id: 't1',
        title: 'Daily Free Roll',
        buyIn: 0,
        prizePool: 1000,
        maxPlayers: 100,
        state: TournamentState.REG_OPEN,
        tables: [],
      } as Tournament,
    ]);
    seatsRepo = createRepo<Seat>();
    tablesRepo = { find: jest.fn() };
    service = new TournamentService(
      tournamentsRepo as Repository<Tournament>,
      seatsRepo as Repository<Seat>,
      tablesRepo as Repository<Table>,
      scheduler,
    );
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

  describe('state transitions', () => {
    it('follows REG_OPEN → RUNNING → PAUSED → FINISHED', async () => {
      await service.openRegistration('t1');
      expect(await service.getState('t1')).toBe(TournamentState.REG_OPEN);
      await service.start('t1');
      expect(await service.getState('t1')).toBe(TournamentState.RUNNING);
      await service.pause('t1');
      expect(await service.getState('t1')).toBe(TournamentState.PAUSED);
      await service.finish('t1');
      expect(await service.getState('t1')).toBe(TournamentState.FINISHED);
    });
  });

  describe('scheduler integration', () => {
    it('uses scheduler queues', async () => {
      const open = new Date(Date.now() + 1000);
      const close = new Date(Date.now() + 2000);
      const start = close;
      await service.scheduleTournament('t1', {
        registration: { open, close },
        structure: [
          { level: 1, durationMinutes: 10 },
          { level: 2, durationMinutes: 10 },
        ],
        breaks: [
          { start: new Date(Date.now() + 3000), durationMs: 60000 },
        ],
        start,
      });
      expect(scheduler.scheduleRegistration).toHaveBeenCalledWith(
        't1',
        open,
        close,
      );
      expect(scheduler.scheduleBreak).toHaveBeenCalled();
      expect(scheduler.scheduleLevelUps).toHaveBeenCalledWith(
        't1',
        expect.any(Array),
        start,
      );
    });
  });
});
