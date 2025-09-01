import { TournamentScheduler } from '../../src/tournament/scheduler.service';
import { TableBalancerService } from '../../src/tournament/table-balancer.service';
import { TournamentService } from '../../src/tournament/tournament.service';
import { Table } from '../../src/database/entities/table.entity';
import { Seat } from '../../src/database/entities/seat.entity';
import { Tournament } from '../../src/database/entities/tournament.entity';
import { RebuyService } from '../../src/tournament/rebuy.service';
import { PkoService } from '../../src/tournament/pko.service';
import { icmRaw } from '../../src/tournament/structures/icm';

describe('TournamentScheduler', () => {
  it('schedules level up jobs', async () => {
    const scheduler: any = new TournamentScheduler();
    const fakeQueue = { add: jest.fn() };
    scheduler['queues'].set('level-up', fakeQueue);
    const start = new Date(Date.now() + 1000);
    await scheduler.scheduleLevelUps(
      't1',
      [
        { level: 1, durationMinutes: 1 },
        { level: 2, durationMinutes: 1 },
      ],
      start,
    );
    expect(fakeQueue.add).toHaveBeenCalledWith(
      'level',
      { tournamentId: 't1', level: 2 },
      expect.objectContaining({ delay: expect.any(Number) }),
    );
  });

  it('schedules registration window', async () => {
    const scheduler: any = new TournamentScheduler();
    const fakeQueue = { add: jest.fn() };
    scheduler['queues'].set('registration', fakeQueue);
    const now = 1000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const open = new Date(now + 5000);
    const close = new Date(now + 10000);
    await scheduler.scheduleRegistration('t1', open, close);
    expect(fakeQueue.add).toHaveBeenNthCalledWith(
      1,
      'open',
      { tournamentId: 't1' },
      { delay: 5000 },
    );
    expect(fakeQueue.add).toHaveBeenNthCalledWith(
      2,
      'close',
      { tournamentId: 't1' },
      { delay: 10000 },
    );
    (Date.now as jest.Mock).mockRestore();
  });

  it('schedules late registration close', async () => {
    const scheduler: any = new TournamentScheduler();
    const fakeQueue = { add: jest.fn() };
    scheduler['queues'].set('late-registration', fakeQueue);
    const now = 2000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const close = new Date(now + 3000);
    await scheduler.scheduleLateRegistration('t2', close);
    expect(fakeQueue.add).toHaveBeenCalledWith(
      'close',
      { tournamentId: 't2' },
      { delay: 3000 },
    );
    (Date.now as jest.Mock).mockRestore();
  });

  it('schedules breaks with correct timing', async () => {
    const scheduler: any = new TournamentScheduler();
    const fakeQueue = { add: jest.fn() };
    scheduler['queues'].set('break', fakeQueue);
    const now = 4000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const start = new Date(now + 1000);
    await scheduler.scheduleBreak('t3', start, 3000);
    expect(fakeQueue.add).toHaveBeenNthCalledWith(
      1,
      'start',
      { tournamentId: 't3' },
      { delay: 1000 },
    );
    expect(fakeQueue.add).toHaveBeenNthCalledWith(
      2,
      'end',
      { tournamentId: 't3' },
      { delay: 4000 },
    );
    (Date.now as jest.Mock).mockRestore();
  });

  it('simulates a full 10k entrant tournament and validates payouts', async () => {
    const scheduler = new TournamentScheduler();
    const levelQueue = { add: jest.fn() };
    const regQueue = { add: jest.fn() };
    scheduler['queues'].set('level-up', levelQueue);
    scheduler['queues'].set('registration', regQueue);
    const now = Date.now();
    const structure = Array.from({ length: 5 }, (_, i) => ({
      level: i + 1,
      durationMinutes: 1,
    }));
    const tables: Table[] = Array.from({ length: 100 }, (_, i) => ({
      id: `tbl${i}`,
      seats: [],
      tournament: { id: 't1' } as Tournament,
    })) as Table[];

    const serviceDeps = {
      tournaments: { find: jest.fn(), findOne: jest.fn(), save: jest.fn() } as any,
      seats: {
        save: jest.fn(async (seat: Seat) => {
          tables.forEach((t) => {
            t.seats = t.seats.filter((s) => s.id !== seat.id);
          });
          seat.table.seats.push(seat);
          return seat;
        }),
      } as any,
      tables: { find: jest.fn(async () => tables) } as any,
    };

    const rooms: any = { get: jest.fn() };
    const service = new TournamentService(
      serviceDeps.tournaments,
      serviceDeps.seats,
      serviceDeps.tables,
      scheduler,
      rooms,
      new RebuyService(),
      new PkoService(),
      { get: jest.fn().mockResolvedValue(true) } as any,
    );
    await service.scheduleTournament('t1', {
      registration: { open: new Date(now + 1000), close: new Date(now + 2000) },
      structure,
      breaks: [],
      start: new Date(now + 2000),
    });

    expect(regQueue.add).toHaveBeenCalledTimes(2);
    expect(levelQueue.add).toHaveBeenCalled();

    const allSeats: Seat[] = [];
    let seatId = 0;
    for (const tbl of tables) {
      for (let i = 0; i < 80; i++) {
        const seat: Seat = {
          id: `s${seatId}`,
          table: tbl,
          user: { id: `p${seatId}` } as any,
          position: tbl.seats.length,
          lastMovedHand: 0,
        } as Seat;
        tbl.seats.push(seat);
        allSeats.push(seat);
        seatId++;
      }
    }

    for (let i = 0; i < 2000; i++) {
      const tbl = tables[i % 20];
      const seat: Seat = {
        id: `s${seatId}`,
        table: tbl,
        user: { id: `late${seatId}` } as any,
        position: tbl.seats.length,
        lastMovedHand: 0,
      } as Seat;
      tbl.seats.push(seat);
      allSeats.push(seat);
      seatId++;
    }

    const balancer = new TableBalancerService(serviceDeps.tables, service);
    const startSim = Date.now();
    await balancer.rebalanceIfNeeded('t1');

    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 0xffffffff;
      return seed / 0xffffffff;
    };

    while (allSeats.length > 9) {
      const idx = Math.floor(rand() * allSeats.length);
      const seat = allSeats.splice(idx, 1)[0];
      seat.table.seats = seat.table.seats.filter((s) => s.id !== seat.id);
      if (allSeats.length % 500 === 0) {
        await balancer.rebalanceIfNeeded('t1');
      }
    }

    await balancer.rebalanceIfNeeded('t1');
    const duration = Date.now() - startSim;
    expect(duration).toBeGreaterThan(0);

    const stacks = allSeats.map(() => 1000 + Math.floor(rand() * 100000));
    const prizePool = 10000 * 100;
    const pct = [0.3, 0.2, 0.15, 0.1, 0.08, 0.07, 0.05, 0.03, 0.02];
    let payouts = pct.map((p) => Math.floor(prizePool * p));
    const rem = prizePool - payouts.reduce((a, b) => a + b, 0);
    payouts[0] += rem;

    const { prizes } = service.calculatePrizes(prizePool, payouts, {
      method: 'icm',
      stacks,
    });
    const expected = icmRaw(stacks, payouts);
    for (let i = 0; i < prizes.length; i++) {
      const diff = Math.abs(prizes[i] - expected[i]) / expected[i];
      expect(diff).toBeLessThanOrEqual(0.05);
    }
  });
});
