import { TableBalancerService } from '../../src/tournament/table-balancer.service';
import { TournamentService } from '../../src/tournament/tournament.service';
import { Table } from '../../src/database/entities/table.entity';
import { Seat } from '../../src/database/entities/seat.entity';
import {
  Tournament,
  TournamentState,
} from '../../src/database/entities/tournament.entity';
import { Repository } from 'typeorm';

describe('TableBalancerService lastMovedHand persistence', () => {
  function createTournamentRepo(initial: Tournament[]): Repository<Tournament> {
    const items = new Map(initial.map((t) => [t.id, t]));
    return {
      find: jest.fn(async () => Array.from(items.values())),
      findOne: jest.fn(async ({ where: { id } }) => items.get(id)),
      save: jest.fn(async (obj: Tournament) => {
        items.set(obj.id, obj);
        return obj;
      }),
    } as unknown as Repository<Tournament>;
  }

  function createSeatRepo(tables: Table[]): Repository<Seat> {
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
    } as unknown as Repository<Seat>;
  }

  it('skips moves for players who recently moved even after restart', async () => {
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
    const tablesRepo = { find: jest.fn(async () => tables) } as any;
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
    const initialSecond = new Set(players2);
    const movedFirstSeat = tables[1].seats.find(
      (s) => !initialSecond.has(s.user.id),
    )!;
    const movedPlayer = movedFirstSeat.user.id;

    // create new imbalance
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

    await balancer2.rebalanceIfNeeded('t1', 11, 5);

    const seat = tables[1].seats.find((s) => s.user.id === movedPlayer)!;
    expect(seat.table.id).toBe('tbl2');
    expect(seat.lastMovedHand).toBe(10);
  });
});

