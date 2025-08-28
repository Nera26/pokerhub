import { TournamentScheduler } from '../src/tournament/scheduler.service';
import { TableBalancerService } from '../src/tournament/table-balancer.service';
import { TournamentService } from '../src/tournament/tournament.service';
import { Tournament, TournamentState } from '../src/database/entities/tournament.entity';
import { Table } from '../src/database/entities/table.entity';
import { Seat } from '../src/database/entities/seat.entity';
import { Repository } from 'typeorm';

function createTournamentRepo(initial: Tournament[]): any {
  const items = new Map(initial.map((t) => [t.id, t]));
  return {
    find: jest.fn(async () => Array.from(items.values())),
    findOne: jest.fn(async ({ where: { id } }) => items.get(id)),
    save: jest.fn(async (obj: Tournament) => {
      items.set(obj.id, obj);
      return obj;
    }),
  } as Repository<Tournament>;
}

function createSeatRepo(tables: Table[]): any {
  const seats = tables.flatMap((t) => t.seats);
  const items = new Map(seats.map((s) => [s.id, s]));
  return {
    find: jest.fn(async () => Array.from(items.values())),
    save: jest.fn(async (seat: Seat) => {
      tables.forEach((tbl) => {
        tbl.seats = tbl.seats.filter((s) => s.id !== seat.id);
      });
      seat.table.seats.push(seat);
      items.set(seat.id, seat);
      return seat;
    }),
  } as Repository<Seat>;
}

describe('Tournament scheduling and balancing', () => {
  it('schedules registration, breaks and level ups via BullMQ', async () => {
    const scheduler = new TournamentScheduler();
    const registrationQueue = { add: jest.fn() };
    const breakQueue = { add: jest.fn() };
    const levelQueue = { add: jest.fn() };
    (scheduler as any)['queues'].set('registration', registrationQueue);
    (scheduler as any)['queues'].set('break', breakQueue);
    (scheduler as any)['queues'].set('level-up', levelQueue);

    const open = new Date(Date.now() + 1000);
    const close = new Date(Date.now() + 2000);
    const start = close;
    await scheduler.scheduleRegistration('t1', open, close);
    await scheduler.scheduleBreak('t1', new Date(Date.now() + 3000), 60000);
    await scheduler.scheduleLevelUps(
      't1',
      [
        { level: 1, durationMinutes: 1 },
        { level: 2, durationMinutes: 1 },
      ],
      start,
    );

    expect(registrationQueue.add).toHaveBeenCalledTimes(2);
    expect(breakQueue.add).toHaveBeenCalledTimes(2);
    expect(levelQueue.add).toHaveBeenCalledWith(
      'level',
      { tournamentId: 't1', level: 2 },
      expect.objectContaining({ delay: expect.any(Number) }),
    );
  });

  it('rebalanceIfNeeded moves players from fuller tables', async () => {
    const tables: Table[] = [
      { id: 'tbl1', seats: [], tournament: { id: 't1' } as Tournament } as Table,
      { id: 'tbl2', seats: [], tournament: { id: 't1' } as Tournament } as Table,
    ];
    const distribution = [5, 1];
    let seatId = 0;
    distribution.forEach((count, idx) => {
      for (let i = 0; i < count; i++) {
        const table = tables[idx];
        const seat: Seat = {
          id: `s${seatId}`,
          table,
          user: { id: `p${seatId}` } as any,
          position: table.seats.length,
          lastMovedHand: 0,
        } as Seat;
        table.seats.push(seat);
        seatId++;
      }
    });
    const seatsRepo = createSeatRepo(tables);
    const tablesRepo = { find: jest.fn(async () => tables) } as any;
    const tournamentsRepo = createTournamentRepo([
      {
        id: 't1',
        title: 'Test',
        buyIn: 0,
        prizePool: 0,
        maxPlayers: 100,
        state: TournamentState.RUNNING,
        tables,
      } as Tournament,
    ]);
    const scheduler: any = {};
    const service = new TournamentService(
      tournamentsRepo,
      seatsRepo,
      tablesRepo,
      scheduler,
    );
    const balancer = new TableBalancerService(tablesRepo, service);
    const before = tables.map((t) => t.seats.length);
    expect(Math.max(...before) - Math.min(...before)).toBeGreaterThan(1);
    const changed = await balancer.rebalanceIfNeeded('t1');
    expect(changed).toBe(true);
    const after = tables.map((t) => t.seats.length);
    expect(Math.max(...after) - Math.min(...after)).toBeLessThanOrEqual(1);
    expect(after.reduce((a, b) => a + b, 0)).toBe(6);
  });
});

