import { TournamentService } from '../src/tournament/tournament.service';
import { Tournament, TournamentState } from '../src/database/entities/tournament.entity';
import { Seat } from '../src/database/entities/seat.entity';
import { Table } from '../src/database/entities/table.entity';
import { Repository } from 'typeorm';
import { RebuyService } from '../src/tournament/rebuy.service';
import { PkoService } from '../src/tournament/pko.service';

describe('TournamentService.join rollback', () => {
  let service: TournamentService;
  let tournamentsRepo: any;
  let seatsRepo: any;
  let wallet: any;

  beforeEach(() => {
    tournamentsRepo = {
      findOne: jest.fn(async ({ where: { id } }: any) => ({
        id,
        title: 'Daily Free Roll',
        buyIn: 100,
        prizePool: 1000,
        currency: 'USD',
        maxPlayers: 100,
        state: TournamentState.REG_OPEN,
        gameType: 'texas',
        tables: [],
      } as Tournament)),
      save: jest.fn(),
    } as Repository<Tournament>;

    const seatStore = new Map<string, Seat>();
    seatsRepo = {
      create: jest.fn((seat: Seat) => seat),
      save: jest.fn(async (_seat: Seat) => {
        throw new Error('save failed');
      }),
      find: jest.fn(async () => Array.from(seatStore.values())),
    } as Repository<Seat>;

    const tablesRepo = {
      find: jest.fn(async () => [
        { id: 'tbl1', seats: [], tournament: { id: 't1' } as Tournament } as Table,
      ]),
    } as Repository<Table>;

    wallet = {
      reserve: jest.fn(async () => undefined),
      rollback: jest.fn(async () => undefined),
    };

    const scheduler: any = {};
    const rooms: any = { get: jest.fn() };
    const flags: any = { get: jest.fn(), getTourney: jest.fn() };
    const events: any = { emit: jest.fn() };

    service = new TournamentService(
      tournamentsRepo,
      seatsRepo,
      tablesRepo,
      scheduler,
      rooms,
      new RebuyService(),
      new PkoService(),
      flags,
      events,
      undefined,
      wallet,
    );
  });

  it('rolls back wallet on seat save failure', async () => {
    await expect(service.join('t1', 'u1')).rejects.toThrow('save failed');
    expect(wallet.rollback).toHaveBeenCalledWith('u1', 100, 't1', 'USD');
    expect(await seatsRepo.find()).toHaveLength(0);
  });
});

