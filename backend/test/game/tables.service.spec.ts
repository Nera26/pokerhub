jest.mock('../../src/game/chat.service', () => ({
  ChatService: jest.fn(),
}));
jest.mock('p-queue', () => ({
  __esModule: true,
  default: class {
    add<T>(fn: () => Promise<T> | T): Promise<T> | T {
      return fn();
    }
    clear() {}
  },
}));

import { TablesService } from '../../src/game/tables.service';

describe('TablesService.getTable', () => {
  it('maps state from RoomManager into table data', async () => {
    const table = { id: 't1', smallBlind: 1, bigBlind: 2 } as any;
    const repo: any = { findOne: jest.fn().mockResolvedValue(table) };
    const userRepo: any = {
      findBy: jest
        .fn()
        .mockResolvedValue([
          { id: 'p1', username: 'Player1', avatarKey: 'avatar1' },
        ]),
    };
    const state = {
      pot: 100,
      communityCards: [0, 5, 10],
      players: [
        { id: 'p1', stack: 100, bet: 2, folded: false, allIn: false },
      ],
    };
    const room = { getPublicState: jest.fn().mockResolvedValue(state) } as any;
    const rooms = { get: jest.fn().mockReturnValue(room) } as any;
    const chat = {
      getRecentMessages: jest
        .fn()
        .mockResolvedValue([{ id: 1, username: 'p1', avatar: '', text: 'hi', time: '2023-01-01T00:00:00Z' }]),
    } as any;

    const service = new TablesService(repo, userRepo, rooms, chat);
    const res = await service.getTable('t1');

    expect(res.pot).toBe(100);
    expect(res.communityCards).toEqual(['2♣', '3♦', '4♥']);
    expect(res.players).toEqual([
      {
        id: 1,
        username: 'Player1',
        avatar: 'avatar1',
        chips: 100,
        committed: 2,
        isFolded: false,
        isAllIn: false,
      },
    ]);
    expect(res.chatMessages).toEqual([
      { id: 1, username: 'p1', avatar: '', text: 'hi', time: '2023-01-01T00:00:00Z' },
    ]);
    expect(res.stateAvailable).toBe(true);
  });

  it('sets stateAvailable=false when room state cannot be fetched', async () => {
    const table = { id: 't1', smallBlind: 1, bigBlind: 2 } as any;
    const repo: any = { findOne: jest.fn().mockResolvedValue(table) };
    const userRepo: any = { findBy: jest.fn().mockResolvedValue([]) };
    const room = { getPublicState: jest.fn().mockRejectedValue(new Error('no state')) } as any;
    const rooms = { get: jest.fn().mockReturnValue(room) } as any;
    const chat = { getRecentMessages: jest.fn().mockResolvedValue([]) } as any;

    const service = new TablesService(repo, userRepo, rooms, chat);
    const res = await service.getTable('t1');

    expect(res.stateAvailable).toBe(false);
  });
});

describe('TablesService.getTableState', () => {
  it('includes hand id and current server time', async () => {
    const repo: any = {};
    const userRepo: any = {
      findBy: jest.fn().mockResolvedValue([
        { id: 'p1', username: 'Player1', avatarKey: 'avatar1' },
      ]),
    };
    const room = {
      getPublicState: jest.fn().mockResolvedValue({
        pot: 150,
        sidePots: [{ amount: 25 }],
        street: 'flop',
        players: [{ id: 'p1', stack: 500, folded: false }],
      }),
      getHandId: jest.fn().mockResolvedValue('hand-123'),
    };
    const rooms = { get: jest.fn().mockReturnValue(room) } as any;
    const chat: any = {};

    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(2_000);

    const service = new TablesService(repo, userRepo, rooms, chat);
    const res = await service.getTableState('table-1');

    expect(room.getHandId).toHaveBeenCalled();
    expect(res.handId).toBe('hand-123');
    expect(res.serverTime).toBe(2_000);
    expect(res.pot).toEqual({ main: 150, sidePots: [25] });
    expect(res.seats).toEqual([
      {
        id: 1,
        name: 'Player1',
        avatar: 'avatar1',
        balance: 500,
        inHand: true,
      },
    ]);
    expect(nowSpy).toHaveBeenCalledTimes(2);
    nowSpy.mockRestore();
  });
});

describe('TablesService.getSidePanelTabs', () => {
  it('returns stored tabs for table', async () => {
    const repo: any = {
      findOne: jest.fn().mockResolvedValue({ tabs: ['history', 'chat'] }),
    };
    const service = new TablesService(repo, {} as any, {} as any, {} as any);
    await expect(service.getSidePanelTabs('t1')).resolves.toEqual([
      'history',
      'chat',
    ]);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 't1' } });
  });

  it('throws when table not found', async () => {
    const repo: any = { findOne: jest.fn().mockResolvedValue(null) };
    const service = new TablesService(repo, {} as any, {} as any, {} as any);
    await expect(service.getSidePanelTabs('missing')).rejects.toThrow('Table not found');
  });
});

describe('TablesService.getTablesForUser', () => {
  it('returns DTOs for tables containing the user', async () => {
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 't1',
          name: 'Table 1',
          gameType: 'texas',
          smallBlind: 1,
          bigBlind: 2,
          startingStack: 100,
          playersCurrent: 1,
          playersMax: 6,
          minBuyIn: 50,
          maxBuyIn: 200,
          handsPerHour: 30,
          avgPot: 40,
          rake: 5,
          createdAt: new Date(0),
        },
      ]),
    };
    const repo: any = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    const service = new TablesService(repo, {} as any, {} as any, {} as any);
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(10_000);

    const tables = await service.getTablesForUser('user-1');

    expect(repo.createQueryBuilder).toHaveBeenCalledWith('table');
    expect(qb.innerJoin).toHaveBeenCalledWith(
      'table.players',
      'player',
      'player.id = :userId',
      { userId: 'user-1' },
    );
    expect(tables).toHaveLength(1);
    expect(tables[0].id).toBe('t1');

    nowSpy.mockRestore();
  });
});
