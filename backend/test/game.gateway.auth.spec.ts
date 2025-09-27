import { EventEmitter } from 'events';
import { Test, TestingModule } from '@nestjs/testing';

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

class MockSocket extends EventEmitter {
  id = Math.random().toString(36).slice(2);
  emitted: Record<string, any[]> = {};
  data: Record<string, any> = {};
  handshake: any = { query: {}, auth: {} };

  emit(event: string, payload: any) {
    if (!this.emitted[event]) this.emitted[event] = [];
    this.emitted[event].push(payload);
    return super.emit(event, payload);
  }
}

function createRedis() {
  const store = new Map<string, string>();
  const hashes = new Map<string, Map<string, string>>();

  return {
    // Hash ops
    hget: async (key: string, field: string) =>
      hashes.get(key)?.get(field) ?? null,
    hset: async (key: string, field: string, value: string) => {
      if (!hashes.has(key)) hashes.set(key, new Map());
      hashes.get(key)!.set(field, value);
      return 0 as any;
    },

    // KV ops
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: string) => {
      store.set(key, value);
      return 'OK' as any;
    },
    del: async (key: string) => (store.delete(key) ? 1 : 0),

    // Helpers used by some code paths
    keys: async (pattern: string) => {
      const prefix = pattern.replace('*', '');
      return Array.from(store.keys()).filter((k) => k.startsWith(prefix));
    },
    pipeline: () => {
      const commands: Array<[string, string]> = [];
      return {
        get(key: string) {
          commands.push(['get', key]);
          return this;
        },
        exec: async () =>
          commands.map(([, key]) => [null, store.get(key) ?? null] as [null, string | null]),
      };
    },
  } as any;
}

describe('GameGateway auth', () => {
  let gateway: GameGateway;
  let engineApply: jest.Mock;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GameGateway,
        ClockService,
        {
          provide: AnalyticsService,
          useValue: { recordGameEvent: jest.fn() },
        },
        {
          provide: RoomManager,
          useValue: { get: jest.fn() },
        },
        {
          provide: getRepositoryToken(GameState),
          useValue: { find: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Hand),
          useValue: {},
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: createRedis(),
        },
      ],
    }).compile();

    gateway = moduleRef.get(GameGateway);

    // Disable rate limiting for tests
    jest.spyOn(gateway as any, 'isRateLimited').mockResolvedValue(false);

    // Ensure engines map exists
    if (!(gateway as any).engines) {
      (gateway as any).engines = new Map<string, any>();
    }
  });

  beforeEach(() => {
    // Reset engine stub before each test
    const engines = (gateway as any).engines as Map<string, any>;
    engines.clear();

    const state = {
      phase: 'DEAL',
      street: 'preflop',
      pot: 0,
      sidePots: [],
      currentBet: 0,
      players: [
        {
          id: 'p1',
          stack: 100,
          folded: false,
          bet: 0,
          allIn: false,
          holeCards: [1, 2],
        },
      ],
      communityCards: [],
      deck: [],
    };

    engineApply = jest.fn().mockReturnValue(state);

    engines.set('t1', {
      applyAction: engineApply,
      getPublicState: jest.fn(() => state),
      getHandId: jest.fn(() => 'hand'),
      getHandLog: jest.fn(() => []),
    });
  });

  it('accepts actions from authenticated player', async () => {
    const socket = new MockSocket() as any;
    socket.data = {};
    socket.handshake.query = { tableId: 't1', playerId: 'p1' };

    // Simulate connection and action
    (gateway as any).handleConnection(socket);
    await (gateway as any).handleAction(socket, {
      actionId: 'a1',
      version: '1',
      tableId: 't1',
      playerId: 'p1',
      type: 'check',
    });

    expect(engineApply).toHaveBeenCalledTimes(1);
    expect((socket as any).emitted['server:Error']).toBeUndefined();
  });

  it('rejects actions with mismatched playerId', async () => {
    const socket = new MockSocket() as any;
    socket.data = {};
    socket.handshake.query = { tableId: 't1', playerId: 'p1' };

    (gateway as any).handleConnection(socket);
    await (gateway as any).handleAction(socket, {
      actionId: 'a2',
      version: '1',
      tableId: 't1',
      playerId: 'p2', // mismatched
      type: 'check',
    });

    expect(engineApply).not.toHaveBeenCalled();
    expect((socket as any).emitted['server:Error']?.[0]).toBeDefined();
  });
});
