import { TournamentService } from '../../src/tournament/tournament.service';
import {
  Tournament,
  TournamentState,
} from '../../src/database/entities/tournament.entity';
import { Seat } from '../../src/database/entities/seat.entity';
import { Table } from '../../src/database/entities/table.entity';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { icmRaw } from '../../src/tournament/structures/icm';
import { RebuyService } from '../../src/tournament/rebuy.service';
import { PkoService } from '../../src/tournament/pko.service';

describe('TournamentService algorithms', () => {
  let service: TournamentService;
  let scheduler: any;
  let tournamentsRepo: any;
  let seatsRepo: any;
  let tablesRepo: any;
  let rooms: any;
  let flags: any;
  let events: any;
  let wallet: any;
  let balance: number;

  function createRepo<T extends { id: string }>(initial: T[] = []) {
    const items = new Map(initial.map((i) => [i.id, i]));
    return {
      create: jest.fn((obj: T) => obj),
      find: jest.fn(async () => Array.from(items.values())),
      findOne: jest.fn(async ({ where: { id } }) => items.get(id)),
      save: jest.fn(async (obj: T) => {
        items.set(obj.id, obj);
        return obj;
      }),
      remove: jest.fn(async (obj: T) => {
        items.delete(obj.id);
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
        buyIn: 100,
        gameType: 'texas',
        prizePool: 1000,
        maxPlayers: 100,
        state: TournamentState.REG_OPEN,
        tables: [],
      } as Tournament,
    ]);
    seatsRepo = createRepo<Seat>();
    tablesRepo = { find: jest.fn() };
    rooms = { get: jest.fn() };
    flags = { get: jest.fn(), getTourney: jest.fn() };
    events = { emit: jest.fn() };
    balance = 1000;
    wallet = {
      reserve: jest.fn(async (_id: string, amount: number) => {
        balance -= amount;
      }),
      rollback: jest.fn(async (_id: string, amount: number) => {
        balance += amount;
      }),
    };
    service = new TournamentService(
      tournamentsRepo as Repository<Tournament>,
      seatsRepo as Repository<Seat>,
      tablesRepo as Repository<Table>,
      scheduler,
      rooms,
      new RebuyService(),
      new PkoService(),
      flags,
      events,
      undefined,
      wallet,
    );
  });

  describe('seat assignment flow', () => {
    it('joins and withdraws a player', async () => {
      tablesRepo.find.mockResolvedValue([
        { id: 'tbl1', seats: [], tournament: { id: 't1' } as Tournament } as Table,
      ]);
      const seat = await service.join('t1', 'u1');
      expect(wallet.reserve).toHaveBeenCalledWith('u1', 100, 't1', 'USD');
      expect(events.emit).toHaveBeenCalledWith('wallet.reserve', {
        accountId: 'u1',
        amount: 100,
        refId: 't1',
        currency: 'USD',
      });
      expect(balance).toBe(900);
      (seatsRepo.findOne as any).mockResolvedValue(seat);
      await service.withdraw('t1', 'u1');
      expect(wallet.rollback).toHaveBeenCalledWith('u1', 100, 't1', 'USD');
      expect(events.emit).toHaveBeenCalledWith('wallet.rollback', {
        accountId: 'u1',
        amount: 100,
        refId: 't1',
        currency: 'USD',
      });
      expect(balance).toBe(1000);
      expect(seatsRepo.remove).toHaveBeenCalledWith(seat);
    });
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

    it('cancels from open state and emits event', async () => {
      await service.cancel('t1');
      expect(await service.getState('t1')).toBe(TournamentState.CANCELLED);
      expect(events.emit).toHaveBeenCalledWith('tournament.cancel', {
        tournamentId: 't1',
      });
    });

    it('rejects cancel after finish', async () => {
      await service.start('t1');
      await service.finish('t1');
      await expect(service.cancel('t1')).rejects.toThrow(
        'Invalid transition from FINISHED to CANCELLED',
      );
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

  describe('autoFoldOnTimeout', () => {
    it('applies a fold action for the timed-out seat', async () => {
      const seat: Seat = {
        id: 's1',
        table: { id: 'tbl1', seats: [] } as Table,
        user: { id: 'u1' } as any,
        position: 0,
        lastMovedHand: 0,
      } as Seat;
      seatsRepo = {
        ...seatsRepo,
        findOne: jest.fn(async () => seat),
      };
      const apply = jest.fn(async () => ({}));
      rooms.get.mockReturnValue({ apply });
      service = new TournamentService(
        tournamentsRepo as Repository<Tournament>,
        seatsRepo as Repository<Seat>,
        tablesRepo as Repository<Table>,
        scheduler,
        rooms,
      );

      await service.autoFoldOnTimeout('s1');

      expect(apply).toHaveBeenCalledWith({ type: 'fold', playerId: 'u1' });
    });
  });

  describe('resolveBubbleElimination', () => {
    it('splits prizes among simultaneous busts', () => {
      const busts = [
        { id: 'a', stack: 5000 },
        { id: 'b', stack: 3000 },
        { id: 'c', stack: 2000 },
      ];
      const res = service.resolveBubbleElimination(busts, [100, 50, 25]);
      expect(res.map((r) => r.prize)).toEqual([59, 58, 58]);
      expect(res.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('calculateIcmPayouts', () => {
    it('returns payouts matching prize pool', () => {
      const stacks = [5000, 3000, 2000];
      const prizes = [50, 30, 20];
      const res = service.calculateIcmPayouts(stacks, prizes);
      expect(res.reduce((a, b) => a + b, 0)).toBe(100);
    });

    it('rounding error is less than one chip', () => {
      const stacks = [4000, 3500, 2500];
      const prizes = [60, 30, 10];
      const res = service.calculateIcmPayouts(stacks, prizes);
      const raw = icmRaw(stacks, prizes);
      res.forEach((p: number, i: number) => {
        expect(Math.abs(p - raw[i])).toBeLessThan(1);
      });
    });

    it('property: payout sums equal prize pool and rounding error <1', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 1000 }), {
            minLength: 2,
            maxLength: 5,
          }),
          fc.array(fc.integer({ min: 1, max: 100 }), {
            minLength: 1,
            maxLength: 5,
          }),
          (stacks: number[], prizes: number[]) => {
            const p = prizes.slice(0, stacks.length);
            const res = service.calculateIcmPayouts(stacks, p);
            const totalPrizes = p.reduce((a, b) => a + b, 0);
            expect(res.reduce((a, b) => a + b, 0)).toBe(totalPrizes);
            const raw = icmRaw(stacks, p);
            res.forEach((pay: number, i: number) => {
              expect(Math.abs(pay - raw[i])).toBeLessThan(1);
            });
          },
        ),
      );
    });
  });
});
