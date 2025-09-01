import fs from 'fs';
import path from 'path';
import { TableBalancerService } from '../../src/tournament/table-balancer.service';
import { TournamentService } from '../../src/tournament/tournament.service';
import { RebuyService } from '../../src/tournament/rebuy.service';
import { PkoService } from '../../src/tournament/pko.service';
import { calculateIcmPayouts } from '../../src/tournament/structures/icm';
import { Seat } from '../../src/database/entities/seat.entity';
import { Table } from '../../src/database/entities/table.entity';
import { Tournament } from '../../src/database/entities/tournament.entity';

async function runSimulation(players: number, checkIcm = false): Promise<number> {
  const start = Date.now();
  const structurePath = path.resolve(
    __dirname,
    '../../src/tournament/structures/v1.json',
  );
  const structure = JSON.parse(fs.readFileSync(structurePath, 'utf8')) as {
    levels: { level: number; durationMinutes: number }[];
  };

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
  const events: any = { emit: async () => {} };

  const service = new TournamentService(
    tournamentsRepo,
    seatsRepo,
    tablesRepo,
    scheduler,
    rooms,
    new RebuyService(),
    new PkoService(),
    flags,
    events,
  );
  const balancer = new TableBalancerService(tablesRepo, service);

  await service.scheduleTournament('t1', {
    registration: { open: new Date(), close: new Date() },
    structure: structure.levels.map((l) => ({
      level: l.level,
      durationMinutes: l.durationMinutes,
    })),
    breaks: [],
    start: new Date(),
  });
  await balancer.rebalanceIfNeeded('t1');

  const stacks = Array.from({ length: 9 }, () =>
    Math.floor(Math.random() * 10000) + 1000,
  );
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
  const expected = calculateIcmPayouts(stacks, payouts);
  if (checkIcm) {
    for (let i = 0; i < prizes.length; i++) {
      expect(Math.abs(prizes[i] - expected[i])).toBeLessThan(1);
    }
  }

  return Date.now() - start;
}

describe('mega tournament simulation', () => {
  it('finishes near documented duration and matches ICM payouts', async () => {
    const docPath = path.resolve(
      __dirname,
      '../../../docs/player/tournament-handbook.md',
    );
    const text = fs.readFileSync(docPath, 'utf8');
    const match = text.match(/"expectedDuration"\s*:\s*(\d+)/);
    const targetMinutes = match ? Number(match[1]) : 0;

    await runSimulation(10000); // warmup
    const baseline = await runSimulation(10000);
    const actual = await runSimulation(10000, true);

    const perMinute = baseline / targetMinutes;
    const actualMinutes = actual / perMinute;
    const diff = Math.abs(actualMinutes - targetMinutes);
    expect(diff).toBeLessThanOrEqual(targetMinutes * 0.05);
  });
});
