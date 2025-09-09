import { TableBalancerService } from '../../src/tournament/table-balancer.service';
import { TournamentService } from '../../src/tournament/tournament.service';
import { Repository } from 'typeorm';
import { Table } from '../../src/database/entities/table.entity';
import { Seat } from '../../src/database/entities/seat.entity';
import { Tournament, TournamentState } from '../../src/database/entities/tournament.entity';
import { createTablesRepository } from './test-utils';

describe('TableBalancerService integration', () => {
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
      save: jest.fn(async (seat: Seat | Seat[]) => {
        const arr = Array.isArray(seat) ? seat : [seat];
        for (const s of arr) {
          tables.forEach((tbl) => {
            tbl.seats = tbl.seats.filter((seat) => seat.id !== s.id);
          });
          s.table.seats.push(s);
          items.set(s.id, s);
        }
        return Array.isArray(seat) ? arr : arr[0];
      }),
    } as Repository<Seat>;
  }

  it('balances 120 entrants across 10 tables', async () => {
    const tables: Table[] = Array.from({ length: 10 }, (_, i) => ({
      id: `tbl${i}`,
      seats: [],
      tournament: { id: 't1' } as Tournament,
    })) as Table[];
    const distribution = [30, 10, 10, 10, 10, 10, 10, 10, 10, 10];
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
    const tablesRepo = createTablesRepository(tables) as Repository<Table>;
    const tournamentsRepo = createTournamentRepo([
      {
        id: 't1',
        title: 'Test',
        buyIn: 0,
        prizePool: 0,
        maxPlayers: 1000,
        state: TournamentState.RUNNING,
        tables,
      } as Tournament,
    ]);
    const scheduler: any = {};
    const rooms: any = { get: jest.fn() };
    const service = new TournamentService(
      tournamentsRepo,
      seatsRepo,
      tablesRepo,
      scheduler,
      rooms,
    );
    const balancer = new TableBalancerService(tablesRepo, service);

    const before = tables.map((t) => t.seats.length);
    expect(Math.max(...before) - Math.min(...before)).toBeGreaterThan(1);

    await balancer.rebalanceIfNeeded('t1');

    const after = tables.map((t) => t.seats.length);
    expect(Math.max(...after) - Math.min(...after)).toBeLessThanOrEqual(1);
    expect(after.reduce((a, b) => a + b, 0)).toBe(120);
  });

  it('does not move the same player twice within the window', async () => {
    const tables: Table[] = [
      { id: 'tbl1', seats: [], tournament: { id: 't1' } as Tournament } as Table,
      { id: 'tbl2', seats: [], tournament: { id: 't1' } as Tournament } as Table,
    ];
    const players1 = ['p1', 'p2', 'p3', 'p4'];
    const players2 = ['p5', 'p6'];
    let seatId = 0;
    players1.forEach((id) => {
      const seat: Seat = {
        id: `s${seatId++}`,
        table: tables[0],
        user: { id } as any,
        position: tables[0].seats.length,
        lastMovedHand: 0,
      } as Seat;
      tables[0].seats.push(seat);
    });
    players2.forEach((id) => {
      const seat: Seat = {
        id: `s${seatId++}`,
        table: tables[1],
        user: { id } as any,
        position: tables[1].seats.length,
        lastMovedHand: 0,
      } as Seat;
      tables[1].seats.push(seat);
    });
    const seatsRepo = createSeatRepo(tables);
    const tablesRepo = createTablesRepository(tables) as Repository<Table>;
    const tournamentsRepo = createTournamentRepo([
      {
        id: 't1',
        title: 'Test',
        buyIn: 0,
        prizePool: 0,
        maxPlayers: 1000,
        state: TournamentState.RUNNING,
        tables,
      } as Tournament,
    ]);
    const scheduler: any = {};
    const rooms: any = { get: jest.fn() };
    const service = new TournamentService(
      tournamentsRepo,
      seatsRepo,
      tablesRepo,
      scheduler,
      rooms,
    );
    const balancer = new TableBalancerService(tablesRepo, service);

    await balancer.rebalanceIfNeeded('t1', 10, 5);
    const initialSecondTable = new Set(players2);
    const movedFirst = tables[1].seats
      .map((s) => s.user.id)
      .find((id) => !initialSecondTable.has(id))!;

    // create new imbalance with two additional players on table 2
    ['p7', 'p8'].forEach((id) => {
      const seat: Seat = {
        id: `s${seatId++}`,
        table: tables[1],
        user: { id } as any,
        position: tables[1].seats.length,
        lastMovedHand: 0,
      } as Seat;
      tables[1].seats.push(seat);
    });

    await balancer.rebalanceIfNeeded('t1', 12, 5);

    // player moved first should remain on table 2
    expect(tables[1].seats.map((s) => s.user.id)).toContain(movedFirst);
  });

  it('persists avoidance window across service restart', async () => {
    const tables: Table[] = [
      { id: 'tbl1', seats: [], tournament: { id: 't1' } as Tournament } as Table,
      { id: 'tbl2', seats: [], tournament: { id: 't1' } as Tournament } as Table,
    ];
    const players1 = ['p1', 'p2', 'p3', 'p4'];
    const players2 = ['p5', 'p6'];
    let seatId = 0;
    players1.forEach((id) => {
      const seat: Seat = {
        id: `s${seatId++}`,
        table: tables[0],
        user: { id } as any,
        position: tables[0].seats.length,
        lastMovedHand: 0,
      } as Seat;
      tables[0].seats.push(seat);
    });
    players2.forEach((id) => {
      const seat: Seat = {
        id: `s${seatId++}`,
        table: tables[1],
        user: { id } as any,
        position: tables[1].seats.length,
        lastMovedHand: 0,
      } as Seat;
      tables[1].seats.push(seat);
    });
    const seatsRepo = createSeatRepo(tables);
    const tablesRepo = createTablesRepository(tables) as Repository<Table>;
    const tournamentsRepo = createTournamentRepo([
      {
        id: 't1',
        title: 'Test',
        buyIn: 0,
        prizePool: 0,
        maxPlayers: 1000,
        state: TournamentState.RUNNING,
        tables,
      } as Tournament,
    ]);
    const scheduler: any = {};
    const rooms: any = { get: jest.fn() };
    const service = new TournamentService(
      tournamentsRepo,
      seatsRepo,
      tablesRepo,
      scheduler,
      rooms,
    );
    const balancer = new TableBalancerService(tablesRepo, service);

    await balancer.rebalanceIfNeeded('t1', 10, 5);
    const initialSecondTable = new Set(players2);
    const movedFirst = tables[1].seats
      .map((s) => s.user.id)
      .find((id) => !initialSecondTable.has(id))!;

    // create new imbalance with two additional players on table 2
    ['p7', 'p8'].forEach((id) => {
      const seat: Seat = {
        id: `s${seatId++}`,
        table: tables[1],
        user: { id } as any,
        position: tables[1].seats.length,
        lastMovedHand: 0,
      } as Seat;
      tables[1].seats.push(seat);
    });

    // simulate service restart
    const service2 = new TournamentService(
      tournamentsRepo,
      seatsRepo,
      tablesRepo,
      scheduler,
      rooms,
    );
    const balancer2 = new TableBalancerService(tablesRepo, service2);

    await balancer2.rebalanceIfNeeded('t1', 12, 5);

    // player moved first should remain on table 2
    expect(tables[1].seats.map((s) => s.user.id)).toContain(movedFirst);
  });
});
