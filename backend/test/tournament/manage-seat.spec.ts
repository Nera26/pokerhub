import { TournamentService } from '../../src/tournament/tournament.service';
import {
  Tournament,
  TournamentState,
} from '../../src/database/entities/tournament.entity';
import { Seat } from '../../src/database/entities/seat.entity';
import { Table } from '../../src/database/entities/table.entity';
import { Repository } from 'typeorm';
import { RebuyService } from '../../src/tournament/rebuy.service';
import { PkoService } from '../../src/tournament/pko.service';

function setup(useTx = false, failSave = false) {
  const tournament: Tournament = {
    id: 't1',
    title: 'Daily',
    buyIn: 100,
    prizePool: 1000,
    maxPlayers: 100,
    state: TournamentState.REG_OPEN,
    tables: [],
    currency: 'USD',
  } as Tournament;

  const tournamentsRepo = {
    findOne: jest.fn(async ({ where: { id } }: any) =>
      id === 't1' ? tournament : undefined,
    ),
  };

  const tablesRepo = {
    find: jest.fn(async () => [
      { id: 'tbl1', seats: [], tournament: { id: 't1' } as Tournament } as Table,
    ]),
  };

  const seats = new Set<Seat>();
  const seatRepo: any = {
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

  const wallet = {
    reserve: jest.fn(async () => {}),
    rollback: jest.fn(async () => {}),
  };

  const scheduler = {};
  const rooms = {};
  const flags = {};
  const events = { emit: jest.fn() } as any;

  const service = new TournamentService(
    tournamentsRepo as unknown as Repository<Tournament>,
    seatRepo as unknown as Repository<Seat>,
    tablesRepo as unknown as Repository<Table>,
    scheduler as any,
    rooms as any,
    new RebuyService(),
    new PkoService(),
    flags as any,
    events,
    undefined,
    wallet as any,
  );

  if (useTx) {
    const txManager = {
      find: jest.fn(tablesRepo.find),
      findOne: jest.fn(async () => Array.from(seats)[0]),
      getRepository: jest.fn(() => seatRepo),
    };
    seatRepo.manager = {
      transaction: jest.fn(async (cb: any) => cb(txManager)),
    };
    return { service, seatRepo, wallet, txManager };
  }
  return { service, seatRepo, wallet };
}

describe('manageSeat helper', () => {
  describe('with transaction manager', () => {
    it('joins and withdraws a player once', async () => {
      const { service, seatRepo, wallet, txManager } = setup(true);
      const seat = await service.join('t1', 'u1');
      expect(seatRepo.create).toHaveBeenCalledTimes(1);
      expect(seatRepo.save).toHaveBeenCalledTimes(1);
      expect(wallet.reserve).toHaveBeenCalledTimes(1);

      txManager.findOne.mockResolvedValue(seat);
      await service.withdraw('t1', 'u1');
      expect(seatRepo.remove).toHaveBeenCalledTimes(1);
      expect(wallet.rollback).toHaveBeenCalledTimes(1);
    });

    it('rolls back seat creation failures', async () => {
      const { service, seatRepo, wallet } = setup(true, true);
      await expect(service.join('t1', 'u1')).rejects.toThrow('fail');
      expect(wallet.reserve).toHaveBeenCalledTimes(1);
      expect(wallet.rollback).toHaveBeenCalledTimes(1);
      expect(seatRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('without transaction manager', () => {
    it('joins and withdraws a player once', async () => {
      const { service, seatRepo, wallet } = setup(false);
      const seat = await service.join('t1', 'u1');
      expect(seatRepo.create).toHaveBeenCalledTimes(1);
      expect(seatRepo.save).toHaveBeenCalledTimes(1);
      expect(wallet.reserve).toHaveBeenCalledTimes(1);

      seatRepo.findOne.mockResolvedValue(seat);
      await service.withdraw('t1', 'u1');
      expect(seatRepo.remove).toHaveBeenCalledTimes(1);
      expect(wallet.rollback).toHaveBeenCalledTimes(1);
    });

    it('rolls back seat creation failures', async () => {
      const { service, seatRepo, wallet } = setup(false, true);
      await expect(service.join('t1', 'u1')).rejects.toThrow('fail');
      expect(wallet.reserve).toHaveBeenCalledTimes(1);
      expect(wallet.rollback).toHaveBeenCalledTimes(1);
      expect(seatRepo.save).toHaveBeenCalledTimes(1);
    });
  });
});

