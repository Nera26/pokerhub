import { Test } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { ClockService } from '../src/game/clock.service';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { EventPublisher } from '../src/events/events.service';
import { RoomManager } from '../src/game/room.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hand } from '../src/database/entities/hand.entity';
import { GameState } from '../src/database/entities/game-state.entity';
import { MockRedis } from './utils/mock-redis';

jest.mock('p-queue', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ add: (fn: any) => fn() })),
}));

import { GameGateway } from '../src/game/game.gateway';

class MockSocket extends EventEmitter {
  id = Math.random().toString(36).slice(2);
  emitted: Record<string, any[]> = {};
  emit(event: string, payload: any) {
    if (!this.emitted[event]) this.emitted[event] = [];
    this.emitted[event].push(payload);
    return super.emit(event, payload);
  }
  handshake = { auth: {} } as any;
}

describe('GameGateway idempotency', () => {
  function createModule(redis: MockRedis, room: any) {
    return Test.createTestingModule({
      providers: [
        GameGateway,
        ClockService,
        { provide: AnalyticsService, useValue: { recordGameEvent: jest.fn() } },
        { provide: EventPublisher, useValue: { emit: jest.fn() } },
        { provide: getRepositoryToken(Hand), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(GameState), useValue: { find: jest.fn(), save: jest.fn() } },
        { provide: RoomManager, useValue: { get: () => room } },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();
  }

  it('acknowledges duplicates and only applies once', async () => {
    const redis = new MockRedis();
    const state = {
      phase: 'DEAL',
      street: 'preflop',
      pot: 5,
      sidePots: [],
      currentBet: 0,
      players: [],
      communityCards: [],
    } as const;
    const apply = jest.fn(async () => state);
    const room = { apply, getPublicState: async () => state };
    const moduleRef = await createModule(redis, room);
    const gateway = moduleRef.get(GameGateway);
    jest.spyOn(gateway as any, 'isRateLimited').mockResolvedValue(false);

    const socket = new MockSocket();
    (socket as any).data = {};
    socket.handshake.address = '0.0.0.0';
    (socket as any).conn = { remoteAddress: '0.0.0.0' };
    (gateway as any).socketPlayers.set(socket.id, 'p1');
    const action = { type: 'check', tableId: 't1', version: '1', actionId: 'a1', playerId: 'p1' } as const;

    await gateway.handleAction(socket as any, action);
    await gateway.handleAction(socket as any, action);

    expect(apply).toHaveBeenCalledTimes(1);
    expect(socket.emitted['action:ack']).toEqual([
      { actionId: 'a1', version: '1' },
      { actionId: 'a1', duplicate: true, version: '1' },
    ]);
  });

  it('deduplicates across process restarts via Redis', async () => {
    const redis = new MockRedis();
    const action = { type: 'check', tableId: 't1', version: '1', actionId: 'b1', playerId: 'p1' } as const;

    const state = {
      phase: 'DEAL',
      street: 'preflop',
      pot: 5,
      sidePots: [],
      currentBet: 0,
      players: [],
      communityCards: [],
    } as const;
    const apply1 = jest.fn(async () => state);
    const room1 = { apply: apply1, getPublicState: async () => state };
    const module1 = await createModule(redis, room1);
    const gateway1 = module1.get(GameGateway);
    jest.spyOn(gateway1 as any, 'isRateLimited').mockResolvedValue(false);
    const socket1 = new MockSocket();
    (socket1 as any).data = {};
    socket1.handshake.address = '0.0.0.0';
    (socket1 as any).conn = { remoteAddress: '0.0.0.0' };
    (gateway1 as any).socketPlayers.set(socket1.id, 'p1');
    await gateway1.handleAction(socket1 as any, action);
    expect(apply1).toHaveBeenCalledTimes(1);

    const apply2 = jest.fn(async () => state);
    const room2 = { apply: apply2, getPublicState: async () => state };
    const module2 = await createModule(redis, room2);
    const gateway2 = module2.get(GameGateway);
    jest.spyOn(gateway2 as any, 'isRateLimited').mockResolvedValue(false);
    const socket2 = new MockSocket();
    (socket2 as any).data = {};
    socket2.handshake.address = '0.0.0.0';
    (socket2 as any).conn = { remoteAddress: '0.0.0.0' };
    (gateway2 as any).socketPlayers.set(socket2.id, 'p1');
    await gateway2.handleAction(socket2 as any, action);

    expect(apply2).not.toHaveBeenCalled();
    expect(socket2.emitted['action:ack']).toEqual([
      { actionId: 'b1', duplicate: true, version: '1' },
    ]);
  });
});

