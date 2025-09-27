import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { GameGateway } from '../../src/game/game.gateway';
import { RoomManager } from '../../src/game/room.service';
import { ClockService } from '../../src/game/clock.service';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { EventPublisher } from '../../src/events/events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hand } from '../../src/database/entities/hand.entity';
import { createInMemoryRedis } from '../utils/mock-redis';
import { GameState } from '../../src/database/entities/game-state.entity';

jest.mock('../../src/game/room.service', () => ({
  RoomManager: class {
    get() {
      return {
        apply: async () => ({
          phase: 'BETTING_ROUND',
          street: 'preflop',
          pot: 0,
          sidePots: [],
          currentBet: 0,
          deck: [1, 2],
          communityCards: [],
          players: [
            {
              id: 'p1',
              stack: 100,
              folded: false,
              bet: 0,
              allIn: false,
              holeCards: [1, 2],
            },
            {
              id: 'p2',
              stack: 100,
              folded: false,
              bet: 0,
              allIn: false,
              holeCards: [3, 4],
            },
          ],
        }),
        getPublicState: async () => ({
          phase: 'BETTING_ROUND',
          street: 'preflop',
          pot: 0,
          sidePots: [],
          currentBet: 0,
          deck: [1, 2],
          communityCards: [],
          players: [
            {
              id: 'p1',
              stack: 100,
              folded: false,
              bet: 0,
              allIn: false,
              holeCards: [1, 2],
            },
            {
              id: 'p2',
              stack: 100,
              folded: false,
              bet: 0,
              allIn: false,
              holeCards: [3, 4],
            },
          ],
        }),
        replay: async () => ({ street: 'preflop', pot: 0, players: [] }),
      } as any;
    }
  },
}));

jest.mock('../../src/game/pqueue-loader', () => {
  class ImmediateQueue {
    add<T>(fn: () => Promise<T> | T): Promise<T> | T {
      return fn();
    }
    clear() {}
    get size() {
      return 0;
    }
    get pending() {
      return 0;
    }
  }
  return {
    loadPQueue: jest.fn(async () => ImmediateQueue),
  };
});

function waitForConnect(socket: Socket): Promise<void> {
  return new Promise((resolve) => socket.on('connect', () => resolve()));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('GameGateway player privacy', () => {
  let app: INestApplication;
  let url: string;
  let gateway: GameGateway;

  beforeAll(async () => {
    const { redis } = createInMemoryRedis();
    const moduleRef = await Test.createTestingModule({
      providers: [
        GameGateway,
        RoomManager,
        ClockService,
        { provide: AnalyticsService, useValue: { recordGameEvent: jest.fn() } },
        { provide: EventPublisher, useValue: { emit: jest.fn() } },
        { provide: getRepositoryToken(Hand), useValue: { findOne: jest.fn() } },
        {
          provide: getRepositoryToken(GameState),
          useValue: { find: jest.fn().mockResolvedValue([]), save: jest.fn() },
        },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    gateway = app.get(GameGateway);
    await app.init();
    const server = app.getHttpServer();
    await new Promise<void>((res) => server.listen(0, res));
    const address = server.address();
    url = `http://localhost:${address.port}/game`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('sanitizes state, revealing hole cards only to the acting player', async () => {
    const baseState = {
      phase: 'BETTING_ROUND',
      street: 'preflop',
      pot: 0,
      sidePots: [],
      currentBet: 0,
      deck: [1, 2],
      communityCards: [],
      players: [
        {
          id: 'p1',
          stack: 100,
          folded: false,
          bet: 0,
          allIn: false,
          holeCards: [1, 2],
        },
        {
          id: 'p2',
          stack: 100,
          folded: false,
          bet: 0,
          allIn: false,
          holeCards: [3, 4],
        },
      ],
    } as const;
    (gateway as any).engines.set('default', {
      applyAction: () => baseState,
      getPublicState: () => baseState,
      getHandId: () => 'hand',
      getHandLog: () => [],
    });
    const client = io(url, {
      transports: ['websocket'],
      auth: { playerId: 'p1' },
    });
    await waitForConnect(client);
    const states: any[] = [];
    client.on('state', (s) => states.push(s));
    const stateReceived = new Promise<void>((resolve) =>
      client.once('state', () => resolve()),
    );
    client.emit('action', {
      version: '1',
      type: 'bet',
      tableId: 'default',
      playerId: 'p1',
      amount: 1,
      actionId: 'a1',
    });
    await stateReceived;
    await wait(50);
    client.disconnect();
    (gateway as any).engines.delete('default');

    expect(states.length).toBeGreaterThan(0);
    for (const s of states) {
      expect(s.deck).toBeUndefined();
      const p1 = (s.players as Array<Record<string, unknown>>).find(
        (p) => p.id === 'p1',
      );
      const p2 = (s.players as Array<Record<string, unknown>>).find(
        (p) => p.id === 'p2',
      );
      expect(p1?.holeCards).toEqual([1, 2]);
      expect(p2?.holeCards).toBeUndefined();
    }
  });
});

