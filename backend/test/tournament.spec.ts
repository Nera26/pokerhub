import { TournamentScheduler } from '../src/tournament/scheduler.service';
import { TableBalancerService } from '../src/tournament/table-balancer.service';
import type { Tournament } from '../src/database/entities/tournament.entity';
import { TournamentState } from '../src/database/entities/tournament.entity';
import { Table } from '../src/database/entities/table.entity';
import { Seat } from '../src/database/entities/seat.entity';
import { RebuyService } from '../src/tournament/rebuy.service';
import { PkoService } from '../src/tournament/pko.service';
import type { EventPublisher } from '../src/events/events.service';
import {
  createSeatRepo,
  createTestTable,
  createTestTournament,
  createTournamentRepo,
  createTournamentServiceInstance,
} from './tournament/helpers';

function createTournamentContext(): { tournament: Tournament; tables: Table[] } {
  const tournament = createTestTournament({
    id: 't1',
    title: 'Test',
    buyIn: 0,
    prizePool: 0,
    maxPlayers: 100,
    state: TournamentState.RUNNING,
  });
  const tables = [
    createTestTable('tbl1', tournament),
    createTestTable('tbl2', tournament),
  ];
  tournament.tables = tables;
  return { tournament, tables };
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
    const { tournament, tables } = createTournamentContext();
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
    const tournamentsRepo = createTournamentRepo([tournament]);
    const scheduler: any = {};
    const rooms: any = { get: jest.fn() };
    const service = createTournamentServiceInstance({
      tournamentsRepo,
      seatsRepo,
      tablesRepo,
      scheduler,
      rooms,
    });
    const balancer = new TableBalancerService(tablesRepo, service);
    const before = tables.map((t) => t.seats.length);
    expect(Math.max(...before) - Math.min(...before)).toBeGreaterThan(1);
    const changed = await balancer.rebalanceIfNeeded('t1');
    expect(changed).toBe(true);
    const after = tables.map((t) => t.seats.length);
    expect(Math.max(...after) - Math.min(...after)).toBeLessThanOrEqual(1);
    expect(after.reduce((a, b) => a + b, 0)).toBe(6);
  });

  it('rebalanceIfNeeded avoids moving recently relocated players', async () => {
    const { tournament, tables } = createTournamentContext();
    const distribution = [5, 1];
    const currentHand = 100;
    const avoidWithin = 10;
    const recentHand = currentHand - 5;
    const recent = new Map<string, number>();
    let seatId = 0;
    distribution.forEach((count, idx) => {
      for (let i = 0; i < count; i++) {
        const table = tables[idx];
        const seat: Seat = {
          id: `s${seatId}`,
          table,
          user: { id: `p${seatId}` } as any,
          position: table.seats.length,
          lastMovedHand: idx === 0 && i < 2 ? recentHand : 0,
        } as Seat;
        table.seats.push(seat);
        if (seat.lastMovedHand === recentHand) {
          recent.set(seat.user.id, seat.lastMovedHand);
        }
        seatId++;
      }
    });
    const seatsRepo = createSeatRepo(tables);
    const tablesRepo = { find: jest.fn(async () => tables) } as any;
    const tournamentsRepo = createTournamentRepo([tournament]);
    const scheduler: any = {};
    const rooms: any = { get: jest.fn() };
    const service = createTournamentServiceInstance({
      tournamentsRepo,
      seatsRepo,
      tablesRepo,
      scheduler,
      rooms,
    });
    const redis = {
      hgetall: jest.fn(async () =>
        Object.fromEntries(
          Array.from(recent.entries()).map(([k, v]) => [k, v.toString()]),
        ),
      ),
      hset: jest.fn(async () => undefined),
      del: jest.fn(async () => undefined),
    } as any;
    const balancer = new TableBalancerService(tablesRepo, service, redis);
    const keep = tables[0].seats
      .filter((s) => s.lastMovedHand === recentHand)
      .map((s) => s.user.id);
    const changed = await balancer.rebalanceIfNeeded(
      't1',
      currentHand,
      avoidWithin,
    );
    expect(changed).toBe(true);
    const counts = tables.map((t) => t.seats.length);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(6);
    const remaining = tables[0].seats.map((s) => s.user.id);
    keep.forEach((id) => expect(remaining).toContain(id));
  });

  it('emits bubble event when players reach payout threshold', async () => {
    const tournament = createTestTournament({
      id: 't1',
      title: 'Bubble Test',
      buyIn: 0,
      prizePool: 0,
      maxPlayers: 100,
      state: TournamentState.RUNNING,
    });
    const tables = [createTestTable('tbl1', tournament)];
    tournament.tables = tables;
    for (let i = 0; i < 5; i++) {
      tables[0].seats.push({
        id: `s${i}`,
        table: tables[0],
        user: { id: `p${i}` } as any,
        position: i,
        lastMovedHand: 0,
      } as Seat);
    }
    const seatsRepo = createSeatRepo(tables);
    const tablesRepo = { find: jest.fn(async () => tables) } as any;
    const tournamentsRepo = createTournamentRepo([tournament]);
    const scheduler: any = {};
    const rooms: any = { get: jest.fn() };
    const events = { emit: jest.fn() } as unknown as EventPublisher;
    const service = createTournamentServiceInstance({
      tournamentsRepo,
      seatsRepo,
      tablesRepo,
      scheduler,
      rooms,
      rebuys: new RebuyService(),
      pko: new PkoService(),
      flags: { get: jest.fn().mockResolvedValue(true) } as any,
      events,
    });
    const balancer = new TableBalancerService(tablesRepo, service);
    await balancer.rebalanceIfNeeded('t1', 0, 10, 5);
    expect(events.emit).toHaveBeenCalledWith('tournament.bubble', {
      tournamentId: 't1',
      remainingPlayers: 5,
    });
  });
});

