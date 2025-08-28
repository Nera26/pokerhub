import { TableBalancerService } from '../../src/tournament/table-balancer.service';
import { TournamentService } from '../../src/tournament/tournament.service';
import { Repository } from 'typeorm';
import { Table } from '../../src/database/entities/table.entity';
import { Seat } from '../../src/database/entities/seat.entity';
import { Tournament, TournamentState } from '../../src/database/entities/tournament.entity';

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
    const service = new TournamentService(
      tournamentsRepo,
      seatsRepo,
      tablesRepo,
      scheduler,
    );
    const balancer = new TableBalancerService(tablesRepo, service);

    const before = tables.map((t) => t.seats.length);
    expect(Math.max(...before) - Math.min(...before)).toBeGreaterThan(1);

    await balancer.rebalanceIfNeeded('t1');

    const after = tables.map((t) => t.seats.length);
    expect(Math.max(...after) - Math.min(...after)).toBeLessThanOrEqual(1);
    expect(after.reduce((a, b) => a + b, 0)).toBe(120);
  });
});
