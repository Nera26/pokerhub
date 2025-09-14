import { Test } from '@nestjs/testing';
import { GameGateway } from '../../src/game/game.gateway';
import { ClockService } from '../../src/game/clock.service';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { RoomManager } from '../../src/game/room.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hand } from '../../src/database/entities/hand.entity';
import { GameState } from '../../src/database/entities/game-state.entity';
import { createInMemoryRedis } from '../utils/mock-redis';

jest.mock('p-queue', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ add: (fn: any) => fn() })),
}));

describe('Game state recovery', () => {
  it('restores latest snapshot when redis empty', async () => {
    const { redis } = createInMemoryRedis();
    const snapshot = {
      tableId: 't1',
      tick: 5,
      state: {
        street: 'preflop',
        pot: 0,
        sidePots: [],
        currentBet: 0,
        players: [],
        communityCards: [],
      },
    } as const;
    const moduleRef = await Test.createTestingModule({
      providers: [
        GameGateway,
        ClockService,
        { provide: AnalyticsService, useValue: { recordGameEvent: jest.fn() } },
        { provide: RoomManager, useValue: { get: () => ({ apply: jest.fn(), getPublicState: jest.fn() }) } },
        { provide: getRepositoryToken(Hand), useValue: { findOne: jest.fn() } },
        {
          provide: getRepositoryToken(GameState),
          useValue: { find: jest.fn().mockResolvedValue([snapshot]), save: jest.fn() },
        },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    const gateway = moduleRef.get(GameGateway);
    await gateway.onModuleInit();
    expect((gateway as any).states.get('t1')).toEqual(snapshot.state);
    expect((gateway as any).tick).toBe(5);
  });
});

