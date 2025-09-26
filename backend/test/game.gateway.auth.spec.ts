import { EventEmitter } from 'events';
import { Test } from '@nestjs/testing';

jest.mock('p-queue', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ add: (fn: any) => fn() })),
}));

import { GameGateway } from '../src/game/game.gateway';
import { ClockService } from '../src/game/clock.service';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { RoomManager } from '../src/game/room.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hand } from '../src/database/entities/hand.entity';
import { GameState } from '../src/database/entities/game-state.entity';
import { createInMemoryRedis } from './utils/mock-redis';

class MockSocket extends EventEmitter {
  id = Math.random().toString(36).slice(2);
  emitted: Record<string, any[]> = {};
  handshake: any = { query: {}, auth: {} };
  data: Record<string, any> = {};
  emit(event: string, payload: any) {
    if (!this.emitted[event]) this.emitted[event] = [];
    this.emitted[event].push(payload);
    return super.emit(event, payload);
  }
}

describe('GameGateway auth', () => {
  let gateway: GameGateway;
  let roomApply: jest.Mock | undefined;

  beforeAll(async () => {
    roomApply = jest.fn(() => ({
      phase: 'DEAL',
      street: 'preflop',
      pot: 0,
      sidePots: [],
      currentBet: 0,
      players: [],
      communityCards: [],
    }));
    const { redis } = createInMemoryRedis();
    const moduleRef = await Test.createTestingModule({
      providers: [
        GameGateway,
        ClockService,
        { provide: AnalyticsService, useValue: { recordGameEvent: jest.fn() } },
        {
          provide: RoomManager,
          useValue: {
            get: () => ({
              apply: roomApply!,
              getPublicState: async () => ({
                phase: 'DEAL',
                street: 'preflop',
                pot: 0,
                sidePots: [],
                currentBet: 0,
                players: [],
                communityCards: [],
              }),
            }),
          },
        },
        { provide: getRepositoryToken(Hand), useValue: {} },
        {
          provide: getRepositoryToken(GameState),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            save: jest.fn(),
          },
        },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    gateway = moduleRef.get(GameGateway);
    (gateway as any).engines.set('t1', {
      applyAction: roomApply!,
      getHandId: jest.fn(() => 'hand-1'),
      getHandLog: jest.fn(() => []),
      getPublicState: jest.fn(() => ({
        phase: 'DEAL',
        street: 'preflop',
        pot: 0,
        sidePots: [],
        currentBet: 0,
        players: [],
        communityCards: [],
      })),
    });
    jest.spyOn(gateway as any, 'isRateLimited').mockResolvedValue(false);
  });

  beforeEach(() => {
    roomApply?.mockClear();
  });

  it('accepts actions from authenticated player', async () => {
    const socket = new MockSocket();
    socket.handshake.query = { tableId: 't1', playerId: 'p1' };
    gateway.handleConnection(socket as any);

    await gateway.handleAction(socket as any, {
      actionId: 'a1',
      version: '1',
      tableId: 't1',
      playerId: 'p1',
      type: 'check',
    });

    expect(roomApply).toHaveBeenCalledTimes(1);
    expect(socket.emitted['server:Error']).toBeUndefined();
  });

  it('rejects actions with mismatched playerId', async () => {
    const socket = new MockSocket();
    socket.handshake.query = { tableId: 't1', playerId: 'p1' };
    gateway.handleConnection(socket as any);

    await gateway.handleAction(socket as any, {
      actionId: 'a2',
      version: '1',
      tableId: 't1',
      playerId: 'p2',
      type: 'check',
    });

    expect(roomApply).not.toHaveBeenCalled();
    expect(socket.emitted['server:Error'][0]).toBeDefined();
  });
});

