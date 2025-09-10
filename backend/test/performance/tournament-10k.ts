import assert from 'assert';
import { TableBalancerService } from '../../src/tournament/table-balancer.service';
import { TournamentService } from '../../src/tournament/tournament.service';
import { RebuyService } from '../../src/tournament/rebuy.service';
import { PkoService } from '../../src/tournament/pko.service';
import { icmRaw } from '@shared/utils/icm';
import { Seat } from '../../src/database/entities/seat.entity';
import { Table } from '../../src/database/entities/table.entity';
import { Tournament } from '../../src/database/entities/tournament.entity';

async function runSimulation(players: number, assertIcm = false): Promise<number> {
  const start = Date.now();

  const tableCount = Math.max(1, Math.ceil(players / 100));
  const tables: Table[] = Array.from({ length: tableCount }, (_, i) => ({
    id: `tbl${i}`,
    seats: [] as Seat[],
    tournament: { id: 't1' } as Tournament,
  })) as Table[];

  let seatId = 0;
  for (let i = 0; i < players; i++) {
    const tbl = tables[i % tables.length];
    const seat: Seat = {
      id: `s${seatId}`,
      table: tbl,
      user: { id: `p${seatId}` } as any,
      position: tbl.seats.length,
      lastMovedHand: 0,
    } as Seat;
    tbl.seats.push(seat);
    seatId++;
  }

  const seatsRepo = {
    save: async (seat: Seat) => {
      tables.forEach((t) => {
        t.seats = t.seats.filter((s) => s.id !== seat.id);
      });
      seat.table.seats.push(seat);
      return seat;
    },
  } as any;

  const tablesRepo = { find: async () => tables } as any;
  const tournamentsRepo: any = {};
  const scheduler = {
    scheduleRegistration: async () => {},
    scheduleBreak: async () => {},
    scheduleLevelUps: async () => {},
  } as any;
  const rooms: any = { get: () => ({}) };
  const flags: any = { get: async () => true, getTourney: async () => true };

  const service = new TournamentService(
    tournamentsRepo,
    seatsRepo,
    tablesRepo,
    scheduler,
    rooms,
    new RebuyService(),
    new PkoService(),
    flags,
  );

  const balancer = new TableBalancerService(tablesRepo, service);
  await service.scheduleTournament('t1', {
    registration: { open: new Date(), close: new Date() },
    structure: [{ level: 1, durationMinutes: 1 }],
    breaks: [],
    start: new Date(),
  });
  await balancer.rebalanceIfNeeded('t1');

  const stacks = Array.from({ length: 9 }, () =>
    Math.floor(Math.random() * 10000) + 1000,
  );
  const payouts = [300000, 200000, 150000, 100000, 80000, 70000, 50000, 30000, 20000];
  const prizePool = payouts.reduce((a, b) => a + b, 0);
  const { prizes } = service.calculatePrizes(prizePool, payouts, {
    method: 'icm',
    stacks,
  });
  const expected = icmRaw(stacks, payouts);
  if (assertIcm) {
    for (let i = 0; i < prizes.length; i++) {
      assert(
        Math.abs(prizes[i] - expected[i]) < 1,
        `ICM mismatch at ${i}: ${prizes[i]} vs ${expected[i]}`,
      );
    }
  }

  return Date.now() - start;
}

async function main() {
  await runSimulation(10000); // warmup
  const expected = await runSimulation(10000);
  const actual = await runSimulation(10000, true);
  const diff = Math.abs(actual - expected);
  assert(
    diff <= expected * 0.05,
    `Runtime ${actual}ms deviates from expected ${expected.toFixed(
      2,
    )}ms by ${diff.toFixed(2)}ms`,
  );
  console.log(
    `Runtime ${actual}ms within 5% of expected ${expected.toFixed(2)}ms`,
  );
}

main();
