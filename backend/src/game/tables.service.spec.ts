import { TablesService } from './tables.service';

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
  });
});
