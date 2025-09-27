import { Test } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { ClockService } from '../../src/game/clock.service';
jest.mock('p-queue', () => {
  return jest.fn().mockImplementation(() => ({
    add: (fn: any) => Promise.resolve(fn()),
    size: 0,
    pending: 0,
  }));
});
import { GameGateway } from '../../src/game/game.gateway';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hand } from '../../src/database/entities/hand.entity';
import { GameState } from '../../src/database/entities/game-state.entity';
import { RoomManager } from '../../src/game/room.service';
import { createInMemoryRedis } from '../utils/mock-redis';

class MockSocket extends EventEmitter {
  id = Math.random().toString(36).slice(2);
  emitted: Record<string, any[]> = {};
  handshake: any = { auth: {}, headers: {} };
  data: any = {};
  emit(event: string, payload: any) {
    if (!this.emitted[event]) this.emitted[event] = [];
    this.emitted[event].push(payload);
    return super.emit(event, payload);
  }
}

describe('GameGateway with GameEngine', () => {
  let gateway: GameGateway;
  let handsRepo: { save: jest.Mock };

  beforeAll(async () => {
    handsRepo = { save: jest.fn(), findOne: jest.fn() } as any;
    const { redis } = createInMemoryRedis();
    const moduleRef = await Test.createTestingModule({
      providers: [
        GameGateway,
        { provide: ClockService, useValue: { setTimer: jest.fn(), clearTimer: jest.fn(), onTick: jest.fn() } },
        { provide: AnalyticsService, useValue: { recordGameEvent: jest.fn() } },
        { provide: RoomManager, useValue: {} },
        { provide: getRepositoryToken(Hand), useValue: handsRepo },
        {
          provide: getRepositoryToken(GameState),
          useValue: { find: jest.fn().mockResolvedValue([]), save: jest.fn() },
        },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    gateway = moduleRef.get(GameGateway);
    (gateway as any).isRateLimited = jest.fn().mockResolvedValue(false);
    (gateway as any).recordAckLatency = jest.fn();
    (gateway as any).recordStateLatency = jest.fn();
    (gateway as any).maybeSnapshot = jest.fn();
  });

  it('processes actions through engine and saves hand log', async () => {
    await gateway.startSession('t1', ['A', 'B']);
    const socketA = new MockSocket();
    const socketB = new MockSocket();
    (gateway as any).socketPlayers.set(socketA.id, 'A');
    (gateway as any).socketPlayers.set(socketB.id, 'B');

    await gateway.handleAction(socketA as any, { actionId: '1', tableId: 't1', playerId: 'A', type: 'postBlind', amount: 1 });
    await gateway.handleAction(socketB as any, { actionId: '2', tableId: 't1', playerId: 'B', type: 'postBlind', amount: 2 });
    await gateway.handleAction(socketA as any, { actionId: '3', tableId: 't1', playerId: 'A', type: 'next' });
    await gateway.handleAction(socketA as any, { actionId: '4', tableId: 't1', playerId: 'A', type: 'bet', amount: 4 });
    await gateway.handleAction(socketB as any, { actionId: '5', tableId: 't1', playerId: 'B', type: 'fold' });
    await gateway.handleAction(socketA as any, { actionId: '6', tableId: 't1', playerId: 'A', type: 'next' });
    await new Promise((r) => setImmediate(r));

    expect(socketA.emitted['state']).toBeDefined();
    expect(handsRepo.save).toHaveBeenCalled();
  });

  it('emits error on invalid action', async () => {
    await gateway.startSession('t2', ['A', 'B']);
    const socket = new MockSocket();
    (gateway as any).socketPlayers.set(socket.id, 'A');

    await gateway.handleAction(socket as any, {
      actionId: 'i1',
      tableId: 't2',
      playerId: 'A',
      type: 'bet',
      amount: 5,
    });
    await new Promise((r) => setImmediate(r));

    expect(socket.emitted['server:Error']?.[0] ?? '').toContain('invalid action');
  });
});
