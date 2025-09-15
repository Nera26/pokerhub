import { TableBalancerService } from '../../src/tournament/table-balancer.service';
import { TournamentService } from '../../src/tournament/tournament.service';
import { Table } from '../../src/database/entities/table.entity';
import { Seat } from '../../src/database/entities/seat.entity';
import { Tournament, TournamentState } from '../../src/database/entities/tournament.entity';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { createInMemoryRedis } from '../utils/mock-redis';
import { createSeatRepo, createTournamentRepo } from './helpers';

describe('TableBalancerService avoidWithin', () => {
  test.each([false, true])(
    'avoids moving the same player twice across rapid rebalances (redis=%s)',
    async (useRedis) => {
      const ctx = useRedis ? createInMemoryRedis() : undefined;
      const redis = ctx?.redis as unknown as Redis | undefined;
      const config = new ConfigService({ tournament: { avoidWithin: 5 } });

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
        undefined,
        undefined,
        undefined,
        redis,
      );
      const balancer = new TableBalancerService(
        tablesRepo,
        service,
        redis,
        config,
      );

      await balancer.rebalanceIfNeeded('t1', 10);
      const initialSecond = new Set(players2);
      const movedFirstSeat = tables[1].seats.find(
        (s) => !initialSecond.has(s.user.id),
      )!;
      const movedFirst = movedFirstSeat.user.id;
      expect(movedFirstSeat.lastMovedHand).toBe(10);

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

      await balancer.rebalanceIfNeeded('t1', 11);
      let seat = tables[1].seats.find((s) => s.user.id === movedFirst)!;
      expect(seat.table.id).toBe('tbl2');
      expect(seat.lastMovedHand).toBe(10);

      ['p9', 'p10'].forEach((id) => {
        const seat: Seat = {
          id: `s${seatId++}`,
          table: tables[1],
          user: { id } as any,
          position: tables[1].seats.length,
          lastMovedHand: 0,
        } as Seat;
        tables[1].seats.push(seat);
      });

      await balancer.rebalanceIfNeeded('t1', 12);
      seat = tables[1].seats.find((s) => s.user.id === movedFirst)!;
      expect(seat.table.id).toBe('tbl2');
      expect(seat.lastMovedHand).toBe(10);
    },
  );

  it('shares lastMoved state via redis across balancer instances', async () => {
    const { redis } = createInMemoryRedis();
    const redisClient = redis as unknown as Redis;
    const config = new ConfigService({ tournament: { avoidWithin: 5 } });

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
    const service1 = new TournamentService(
      tournamentsRepo,
      seatsRepo,
      tablesRepo,
      scheduler,
      rooms,
      undefined,
      undefined,
      undefined,
      redisClient,
    );
    const balancer1 = new TableBalancerService(
      tablesRepo,
      service1,
      redisClient,
      config,
    );

    await balancer1.rebalanceIfNeeded('t1', 10);
    const initialSecond = new Set(players2);
    const movedFirstSeat = tables[1].seats.find(
      (s) => !initialSecond.has(s.user.id),
    )!;
    const movedFirst = movedFirstSeat.user.id;
    expect(movedFirstSeat.lastMovedHand).toBe(10);

    ['p7', 'p8'].forEach((id) => {
      const seat: Seat = {
        id: `s${seatId++}`,
        table: tables[0],
        user: { id } as any,
        position: tables[0].seats.length,
        lastMovedHand: 0,
      } as Seat;
      tables[0].seats.push(seat);
    });

    const service2 = new TournamentService(
      tournamentsRepo,
      seatsRepo,
      tablesRepo,
      scheduler,
      rooms,
      undefined,
      undefined,
      undefined,
      redisClient,
    );
    const balancer2 = new TableBalancerService(
      tablesRepo,
      service2,
      redisClient,
      config,
    );

    await balancer2.rebalanceIfNeeded('t1', 11);

    const seat = tables[1].seats.find((s) => s.user.id === movedFirst)!;
    expect(seat.table.id).toBe('tbl2');
    expect(seat.lastMovedHand).toBe(10);
  });

  it('respects TOURNAMENT_AVOID_WITHIN when set via env', async () => {
    const original = process.env.TOURNAMENT_AVOID_WITHIN;
    process.env.TOURNAMENT_AVOID_WITHIN = '3';
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
    const balancer = new TableBalancerService(
      tablesRepo,
      service,
    );

    await balancer.rebalanceIfNeeded('t1', 10);
    const initialSecond = new Set(players2);
    const movedFirstSeat = tables[1].seats.find(
      (s) => !initialSecond.has(s.user.id),
    )!;
    const movedFirst = movedFirstSeat.user.id;
    expect(movedFirstSeat.lastMovedHand).toBe(10);

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

    await balancer.rebalanceIfNeeded('t1', 11);
    let seat = tables[1].seats.find((s) => s.user.id === movedFirst)!;
    expect(seat.table.id).toBe('tbl2');
    expect(seat.lastMovedHand).toBe(10);

    ['p9', 'p10'].forEach((id) => {
      const seat: Seat = {
        id: `s${seatId++}`,
        table: tables[1],
        user: { id } as any,
        position: tables[1].seats.length,
        lastMovedHand: 0,
      } as Seat;
      tables[1].seats.push(seat);
    });

    await balancer.rebalanceIfNeeded('t1', 12);
    seat = tables[1].seats.find((s) => s.user.id === movedFirst)!;
    expect(seat.table.id).toBe('tbl2');
    expect(seat.lastMovedHand).toBe(10);

    if (original === undefined) {
      delete process.env.TOURNAMENT_AVOID_WITHIN;
    } else {
      process.env.TOURNAMENT_AVOID_WITHIN = original;
    }
  });

  it('moves a player once avoidWithin hands have elapsed', () => {
    const service = new TournamentService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const tables = [
      ['p1', 'p2'],
      [] as string[],
    ];
    const recentlyMoved = new Map<string, number>([
      ['p1', 0],
      ['p2', 5],
    ]);

    const balanced = service.balanceTables(
      tables,
      recentlyMoved,
      5,
      5,
    );
    expect(balanced[0]).not.toContain('p1');
    expect(balanced[1]).toContain('p1');
    expect(recentlyMoved.get('p1')).toBe(5);
  });

  it('allows moving a player again when avoidWithin is 1', () => {
    const service = new TournamentService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const tables = [
      ['p1', 'p2'],
      [] as string[],
    ];
    const recentlyMoved = new Map<string, number>([
      ['p1', 0],
      ['p2', 1],
    ]);

    const balanced = service.balanceTables(
      tables,
      recentlyMoved,
      1,
      1,
    );
    expect(balanced[0]).not.toContain('p1');
    expect(balanced[1]).toContain('p1');
    expect(recentlyMoved.get('p1')).toBe(1);
  });
});
