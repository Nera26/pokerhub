import type { TournamentService } from '../../src/tournament/tournament.service';
import type { Tournament } from '../../src/database/entities/tournament.entity';
import { TournamentState } from '../../src/database/entities/tournament.entity';
import { Seat } from '../../src/database/entities/seat.entity';
import { Table } from '../../src/database/entities/table.entity';
import { Repository } from 'typeorm';
import { createTestTable, createTestTournament, createTournamentServiceInstance } from './helpers';

interface SetupTournamentServiceOptions {
  useTransactionManager?: boolean;
  failSave?: boolean;
}

interface SeatRepositoryMocks {
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
  findOne: jest.Mock;
  manager?: {
    transaction: jest.Mock;
  };
}

interface TransactionManagerMocks {
  find: jest.Mock;
  findOne: jest.Mock;
  getRepository: jest.Mock;
}

interface SetupTournamentServiceResult {
  service: TournamentService;
  seatRepo: SeatRepositoryMocks;
  wallet: Record<'reserve' | 'rollback', jest.Mock>;
  setSeatLookup: (seat: Seat) => void;
  txManager?: TransactionManagerMocks;
}

function setupTournamentService({
  useTransactionManager = false,
  failSave = false,
}: SetupTournamentServiceOptions = {}): SetupTournamentServiceResult {
  const tournament = createTestTournament({
    id: 't1',
    title: 'Daily',
    buyIn: 100,
    prizePool: 1000,
    maxPlayers: 100,
    state: TournamentState.REG_OPEN,
  });
  const table = createTestTable('tbl1', tournament);
  tournament.tables = [table];

  const tournamentsRepo = {
    findOne: jest.fn(async ({ where: { id } }: any) =>
      id === 't1' ? tournament : undefined,
    ),
  };

  const tablesRepo = {
    find: jest.fn(async () => [table]),
  };

  const seats = new Set<Seat>();
  const seatRepo: SeatRepositoryMocks = {
    create: jest.fn((obj: Seat) => obj),
    save: jest.fn(async (obj: Seat) => {
      if (failSave) throw new Error('fail');
      seats.add(obj);
      return obj;
    }),
    remove: jest.fn(async (obj: Seat) => {
      seats.delete(obj);
    }),
    findOne: jest.fn(async () => Array.from(seats)[0]),
  };

  const wallet: Record<'reserve' | 'rollback', jest.Mock> = {
    reserve: jest.fn(async () => {}),
    rollback: jest.fn(async () => {}),
  };

  const scheduler = {};
  const rooms = {};
  const flags = {};
  const events = { emit: jest.fn() } as any;

  const service = createTournamentServiceInstance({
    tournamentsRepo: tournamentsRepo as unknown as Repository<Tournament>,
    seatsRepo: seatRepo as unknown as Repository<Seat>,
    tablesRepo: tablesRepo as unknown as Repository<Table>,
    scheduler: scheduler as any,
    rooms: rooms as any,
    flags: flags as any,
    events,
    wallet: wallet as any,
  });

  if (useTransactionManager) {
    const txManager: TransactionManagerMocks = {
      find: jest.fn(tablesRepo.find),
      findOne: jest.fn(async () => Array.from(seats)[0]),
      getRepository: jest.fn(() => seatRepo),
    };
    seatRepo.manager = {
      transaction: jest.fn(async (cb: any) => cb(txManager)),
    };
    return {
      service,
      seatRepo,
      wallet,
      txManager,
      setSeatLookup: (seat: Seat) => {
        txManager.findOne.mockResolvedValue(seat);
        seatRepo.findOne.mockResolvedValue(seat);
      },
    };
  }

  return {
    service,
    seatRepo,
    wallet,
    setSeatLookup: (seat: Seat) => {
      seatRepo.findOne.mockResolvedValue(seat);
    },
  };
}

describe('manageSeat helper', () => {
  const scenarios: Array<{
    description: string;
    options?: SetupTournamentServiceOptions;
  }> = [
    {
      description: 'with transaction manager',
      options: { useTransactionManager: true },
    },
    {
      description: 'without transaction manager',
    },
  ];

  describe.each(scenarios)('$description', ({ options }) => {
    const baseOptions: SetupTournamentServiceOptions = {
      ...(options ?? {}),
    };

    const createContext = (
      overrides?: Partial<SetupTournamentServiceOptions>,
    ): SetupTournamentServiceResult =>
      setupTournamentService({ ...baseOptions, ...overrides });

    it('joins and withdraws a player once', async () => {
      const context = createContext();
      const seat = await context.service.join('t1', 'u1');
      expect(context.seatRepo.create).toHaveBeenCalledTimes(1);
      expect(context.seatRepo.save).toHaveBeenCalledTimes(1);
      expect(context.wallet.reserve).toHaveBeenCalledTimes(1);

      context.setSeatLookup(seat);
      await context.service.withdraw('t1', 'u1');
      expect(context.seatRepo.remove).toHaveBeenCalledTimes(1);
      expect(context.wallet.rollback).toHaveBeenCalledTimes(1);
    });

    it('rolls back seat creation failures', async () => {
      const context = createContext({ failSave: true });
      await expect(context.service.join('t1', 'u1')).rejects.toThrow('fail');
      expect(context.wallet.reserve).toHaveBeenCalledTimes(1);
      expect(context.wallet.rollback).toHaveBeenCalledTimes(1);
      expect(context.seatRepo.save).toHaveBeenCalledTimes(1);
    });
  });
});
