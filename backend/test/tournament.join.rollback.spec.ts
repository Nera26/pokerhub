import { TournamentService } from '../src/tournament/tournament.service';
import type { Tournament } from '../src/database/entities/tournament.entity';
import { TournamentState } from '../src/database/entities/tournament.entity';
import { Seat } from '../src/database/entities/seat.entity';
import { Table } from '../src/database/entities/table.entity';
import { Repository } from 'typeorm';
import type { WalletService } from '../src/wallet/wallet.service';
import {
  createTestTable,
  createTestTournament,
  createTournamentRepo,
  createTournamentServiceInstance,
} from './tournament/helpers';

describe('TournamentService.join rollback', () => {
  let service: TournamentService;
  let tournamentsRepo: Repository<Tournament>;
  let seatsRepo: Repository<Seat>;
  let tablesRepo: Repository<Table>;
  let wallet: { reserve: jest.Mock; rollback: jest.Mock };

  beforeEach(() => {
    const tournament = createTestTournament({
      id: 't1',
      title: 'Daily Free Roll',
      buyIn: 100,
      prizePool: 1000,
      maxPlayers: 100,
      state: TournamentState.REG_OPEN,
      gameType: 'texas',
    });

    const table = createTestTable('tbl1', tournament);
    tournament.tables = [table];

    tournamentsRepo = createTournamentRepo([tournament]);

    const seatStore = new Map<string, Seat>();
    const seatsRepoMock = {
      create: jest.fn((seat: Seat) => seat),
      save: jest.fn(async (_seat: Seat) => {
        throw new Error('save failed');
      }),
      find: jest.fn(async () => Array.from(seatStore.values())),
      manager: {},
    };
    seatsRepo = seatsRepoMock as unknown as Repository<Seat>;

    tablesRepo = {
      find: jest.fn(async () => [table]),
    } as unknown as Repository<Table>;

    wallet = {
      reserve: jest.fn(async () => undefined),
      rollback: jest.fn(async () => undefined),
    };

    service = createTournamentServiceInstance({
      tournamentsRepo,
      seatsRepo,
      tablesRepo,
      wallet: wallet as unknown as WalletService,
    });
  });

  it('rolls back wallet on seat save failure', async () => {
    await expect(service.join('t1', 'u1')).rejects.toThrow('save failed');
    expect(wallet.rollback).toHaveBeenCalledWith('u1', 100, 't1', 'USD');
    expect(await seatsRepo.find()).toHaveLength(0);
  });
});

