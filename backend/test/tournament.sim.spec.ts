import { TableBalancerService } from '../src/tournament/table-balancer.service';
import { TournamentService } from '../src/tournament/tournament.service';
import { Table } from '../src/database/entities/table.entity';
import { Seat } from '../src/database/entities/seat.entity';
import { Tournament } from '../src/database/entities/tournament.entity';
import { RebuyService } from '../src/tournament/rebuy.service';
import { PkoService } from '../src/tournament/pko.service';
import { icmRaw } from '@shared/utils/icm';

describe('tournament simulation', () => {
  it('simulates 10k entrants with late registration and bubble payouts', async () => {
    const tables: Table[] = Array.from({ length: 100 }, (_, i) => ({
      id: `tbl${i}`,
      seats: [],
      tournament: { id: 't1' } as Tournament,
    })) as Table[];

    const allSeats: Seat[] = [];
    let seatId = 0;
    // initial 8k entrants
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

    // 2k late registration entrants join first 20 tables
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

    const seatsRepo = {
      save: jest.fn(async (seat: Seat) => {
        tables.forEach((t) => {
          t.seats = t.seats.filter((s) => s.id !== seat.id);
        });
        seat.table.seats.push(seat);
        return seat;
      }),
    } as any;

    const tablesRepo = {
      find: jest.fn(async () => tables),
    } as any;

    const tournamentsRepo: any = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    const scheduler: any = {};
    const rooms: any = { get: jest.fn() };

    const service = new TournamentService(
      tournamentsRepo,
      seatsRepo,
      tablesRepo,
      scheduler,
      rooms,
      new RebuyService(),
      new PkoService(),
      { get: jest.fn().mockResolvedValue(true) } as any,
    );
    const balancer = new TableBalancerService(tablesRepo, service);

    // balance after late registration
    await balancer.rebalanceIfNeeded('t1');
    const countsAfterLate = tables.map((t) => t.seats.length);
    expect(Math.max(...countsAfterLate) - Math.min(...countsAfterLate)).toBeLessThanOrEqual(1);

    // example bubble payout split among three busts for last paid spot
    const bubble = service.resolveBubbleElimination(
      [
        { id: 'b1', stack: 5000 },
        { id: 'b2', stack: 3000 },
        { id: 'b3', stack: 2000 },
      ],
      [30001, 0, 0],
    );
    expect(bubble).toEqual([
      { id: 'b1', prize: 10001 },
      { id: 'b2', prize: 10000 },
      { id: 'b3', prize: 10000 },
    ]);

    // play down to final table
    while (allSeats.length > 9) {
      const idx = Math.floor(Math.random() * allSeats.length);
      const seat = allSeats.splice(idx, 1)[0];
      seat.table.seats = seat.table.seats.filter((s) => s.id !== seat.id);
    }
    await balancer.rebalanceIfNeeded('t1');
    const counts = tables.map((t) => t.seats.length);
    const diff = Math.max(...counts) - Math.min(...counts);
    expect(diff).toBeLessThanOrEqual(1);

    const stacks = allSeats.map(() => Math.floor(Math.random() * 10000) + 1000);
    const payouts = [
      300000,
      200000,
      150000,
      100000,
      80000,
      70000,
      50000,
      30000,
      20000,
    ];
    const prizePool = payouts.reduce((a, b) => a + b, 0);
    const { prizes } = service.calculatePrizes(prizePool, payouts, {
      method: 'icm',
      stacks,
    });
    const expected = icmRaw(stacks, payouts);
    for (let i = 0; i < stacks.length; i++) {
      expect(Math.abs(prizes[i] - expected[i])).toBeLessThan(1);
    }
  });
});

